const { ChatGroq } = require("@langchain/groq");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { Document } = require("@langchain/core/documents");
const { tool } = require("@langchain/core/tools");
const { ToolMessage, AIMessage, HumanMessage, SystemMessage } = require("@langchain/core/messages");
const { z } = require("zod");
const { KNOWLEDGE_DOCS } = require("./ragKnowledgeBase");
const { executeCode } = require("./executeCode");
const dotenv = require("dotenv");

dotenv.config();

/**
 * CompileVerse Vector Space & Semantic Retriever
 * Performs vector similarity search over curated programming documentation,
 * language specifications, and algorithmic patterns.
 */
class RagVectorRetriever {
  constructor(docs) {
    this.documents = docs.map(d => new Document({
      pageContent: `${d.topic}\n${d.content}\nKeywords: ${d.keywords.join(" ")}`,
      metadata: { id: d.id, topic: d.topic, language: d.language, keywords: d.keywords }
    }));
    this.idf = {};
    this.docVectors = [];
    this._buildVectorIndex();
  }

  _tokenize(text) {
    return (text || "")
      .toLowerCase()
      .replace(/[^a-z0-9_#]/g, " ")
      .split(/\s+/)
      .filter(token => token.length > 1);
  }

  _buildVectorIndex() {
    const N = this.documents.length;
    const docTermFreqs = [];

    // Step 1: Compute Term Frequency for each document
    for (const doc of this.documents) {
      const tokens = this._tokenize(doc.pageContent);
      const tf = {};
      tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
      docTermFreqs.push({ tf, totalTokens: tokens.length });

      const uniqueTokens = new Set(tokens);
      uniqueTokens.forEach(t => {
        this.idf[t] = (this.idf[t] || 0) + 1;
      });
    }

    // Step 2: Compute IDF and Document Vectors
    for (const t in this.idf) {
      this.idf[t] = Math.log(1 + (N / (this.idf[t] || 1)));
    }

    this.docVectors = docTermFreqs.map(({ tf, totalTokens }) => {
      const vector = {};
      let magnitudeSq = 0;
      for (const t in tf) {
        const weight = (tf[t] / totalTokens) * (this.idf[t] || 1);
        vector[t] = weight;
        magnitudeSq += weight * weight;
      }
      return { vector, magnitude: Math.sqrt(magnitudeSq) || 1 };
    });
  }

  /**
   * Retrieve top-k documents based on vector cosine similarity + language priority
   */
  async retrieve(query, language = "general", topK = 2) {
    const queryTokens = this._tokenize(query);
    if (queryTokens.length === 0) return [];

    const queryTf = {};
    queryTokens.forEach(t => { queryTf[t] = (queryTf[t] || 0) + 1; });

    let queryMagnitudeSq = 0;
    const queryVector = {};
    for (const t in queryTf) {
      const weight = (queryTf[t] / queryTokens.length) * (this.idf[t] || 1);
      queryVector[t] = weight;
      queryMagnitudeSq += weight * weight;
    }
    const queryMagnitude = Math.sqrt(queryMagnitudeSq) || 1;

    const scores = this.documents.map((doc, idx) => {
      const { vector, magnitude } = this.docVectors[idx];
      let dotProduct = 0;

      for (const t in queryVector) {
        if (vector[t]) {
          dotProduct += queryVector[t] * vector[t];
        }
      }

      let similarity = dotProduct / (queryMagnitude * magnitude);

      // Strictly match active language or general algorithm patterns
      if (doc.metadata.language === language) {
        similarity *= 1.5;
      } else if (doc.metadata.language === "general") {
        similarity *= 1.0;
      } else {
        similarity = 0; // Strictly exclude documents of a different language
      }

      return { doc, score: similarity };
    });

    // Sort descending by score
    scores.sort((a, b) => b.score - a.score);

    // Return top-k matches with meaningful similarity (>= 0.15)
    return scores
      .filter(item => item.score >= 0.15)
      .slice(0, topK)
      .map(item => ({
        ...item.doc,
        relevanceScore: Math.min(0.99, Number(item.score.toFixed(3)))
      }));
  }
}

// Instantiate vector retriever with curated knowledge base
const vectorRetriever = new RagVectorRetriever(KNOWLEDGE_DOCS);

// Initialize LangChain ChatGroq model
const getGroqLlm = (temperature = 0.3) => {
  return new ChatGroq({
    apiKey: process.env.GROQ_API_KEY || "missing_key",
    model: process.env.GROQ_MODEL_ID || "llama-3.3-70b-versatile",
    temperature: temperature,
  });
};

/**
 * Define LangChain Agent Tools
 */
const executeCodeTool = tool(
  async ({ language, code, input }) => {
    try {
      const result = await executeCode(language, code, input || "");
      return `Execution Successful.\nSTDOUT:\n${result}`;
    } catch (err) {
      return `Execution Failed.\nError:\n${err.error || err.message || JSON.stringify(err)}`;
    }
  },
  {
    name: "executeCodeTool",
    description: "Executes code in Python ('py'), C++ ('cpp'), or Java ('java') with optional standard input. Returns the actual execution output (stdout) or compiler/runtime error. Use this whenever the user asks if their code works, asks to test an input, or when you need to verify whether a bug actually triggers.",
    schema: z.object({
      language: z.enum(["py", "cpp", "java", "python"]).describe("Programming language: 'py', 'cpp', or 'java'"),
      code: z.string().describe("The source code to compile and run"),
      input: z.string().optional().default("").describe("Optional standard input to pass to the running program")
    })
  }
);

const searchDocsTool = tool(
  async ({ query, language }) => {
    const docs = await vectorRetriever.retrieve(query, language || "general", 2);
    if (docs.length === 0) return "No specific documentation found for this query in local knowledge base.";
    return docs.map(d => `[${d.metadata.topic}]\n${d.pageContent}`).join("\n\n");
  },
  {
    name: "searchDocsTool",
    description: "Searches the curated RAG knowledge base for verified official language specifications, standard libraries (STL, Collections, itertools, heapq), and DSA algorithmic patterns.",
    schema: z.object({
      query: z.string().describe("Concept, error message, or library function to search for"),
      language: z.string().optional().default("general").describe("Language context: 'cpp', 'py', 'java', or 'general'")
    })
  }
);

/**
 * Main RAG & Agentic Chat Chain:
 * 1. Retrieves relevant official docs from vector space.
 * 2. Equips LLM with tools (executeCodeTool & searchDocsTool) for autonomous problem testing.
 * 3. Handles tool execution cycle if model decides to verify code.
 * 4. Produces grounded, mentor-style hints.
 */
const ragAiChat = async (messages, code, language) => {
  // Extract latest user inquiry
  const userMessages = messages.filter(m => m.role === "user");
  const latestInquiry = userMessages.length > 0 ? userMessages[userMessages.length - 1].content : "";
  const retrievalQuery = `${latestInquiry} ${language} ${code.slice(0, 500)}`;

  // Step 1: Direct Vector Search Retrieval
  const retrievedDocs = await vectorRetriever.retrieve(retrievalQuery, language, 2);

  let ragContext = "No specific documentation retrieved. Rely on standard language specifications.";
  const sources = [];

  if (retrievedDocs.length > 0) {
    ragContext = retrievedDocs.map((doc, idx) => {
      sources.push({
        topic: doc.metadata.topic,
        language: doc.metadata.language,
        relevance: doc.relevanceScore
      });
      return `[DOCUMENT ${idx + 1}: ${doc.metadata.topic}]\n${doc.pageContent}`;
    }).join("\n\n");
  }

  const langNameMap = {
    cpp: "C++",
    py: "Python",
    python: "Python",
    java: "Java"
  };
  const activeLangName = langNameMap[language] || language;

  // Step 2: System prompt with Ironclad Guardrails + Tool Capabilities
  const systemPrompt = `You are an expert programming tutor and strict AI mentor running inside the CompileVerse IDE.
Your goal is to guide the user to solve their coding problems and learn deeply.

=== OFFICIAL DOCUMENTATION & PATTERNS (RETRIEVED VIA RAG) ===
${ragContext}
=============================================================

AVAILABLE TOOLS:
- executeCodeTool: You can run code in ${activeLangName} to see the actual output or test an edge case!
- searchDocsTool: You can query the documentation database for extra topics.

STRICT GUARDRAILS & BOUNDARIES (MANDATORY & NON-NEGOTIABLE):
1. ACTIVE ENVIRONMENT: The user is currently coding in ${activeLangName}. Their current editor code context is:
\`\`\`${activeLangName}
${code || "// No code currently in editor"}
\`\`\`

2. STRICT LANGUAGE & CODE RELEVANCE (ABSOLUTE RULE):
- You must ONLY answer questions directly related to the user's current code context or ${activeLangName} concepts.
- If the user asks about a DIFFERENT programming language (e.g. asking about Python while active in Java/C++, or asking about Java while active in Python), YOU MUST NOT ANSWER THE QUESTION. You must decline immediately with:
  "You are currently working in ${activeLangName}. Please ask questions related to your current ${activeLangName} code."
- If the user asks any question unrelated to their current code or ${activeLangName}, DO NOT explain. Reply strictly with:
  "Please ask questions related to your current code in the editor."

3. NO FULL SOLUTIONS:
- NEVER provide the complete corrected code or full solutions.
- Only provide hints, explain concepts, point out bugs, or give very small snippets (e.g. 1-2 lines) to illustrate syntax.

4. TOOL USE:
- If the user asks whether their current code works or asks to test an input, use the 'executeCodeTool' to run it and report the actual findings.

5. FORMATTING:
- Do NOT use markdown headers like '#', '##', or '###'. Keep your formatting clean and plain. You may use backticks for code and ** for bold text, but NO headers.`;

  const chatMessages = [
    new SystemMessage(systemPrompt),
    ...messages.map(m => m.role === "assistant" ? new AIMessage(m.content) : new HumanMessage(m.content))
  ];

  const llm = getGroqLlm(0.3);
  const tools = [executeCodeTool, searchDocsTool];
  const llmWithTools = llm.bindTools(tools);

  const toolCallsRecord = [];

  try {
    // Step 3: Invoke model with tools
    const aiResponse = await llmWithTools.invoke(chatMessages);

    // If model requested tool calls, execute them
    if (aiResponse.tool_calls && aiResponse.tool_calls.length > 0) {
      chatMessages.push(aiResponse);

      for (const tc of aiResponse.tool_calls) {
        let toolOutput = "";
        try {
          if (tc.name === "executeCodeTool") {
            toolOutput = await executeCodeTool.invoke(tc.args);
            toolCallsRecord.push({
              name: "executeCode",
              args: { language: tc.args.language, input: tc.args.input || "" },
              summary: "Executed code to test behavior"
            });
          } else if (tc.name === "searchDocsTool") {
            toolOutput = await searchDocsTool.invoke(tc.args);
            toolCallsRecord.push({
              name: "searchDocs",
              args: { query: tc.args.query },
              summary: "Searched documentation knowledge base"
            });
          } else {
            toolOutput = "Tool not found.";
          }
        } catch (toolErr) {
          toolOutput = `Tool execution error: ${toolErr.message}`;
        }

        chatMessages.push(new ToolMessage({
          content: toolOutput,
          tool_call_id: tc.id
        }));
      }

      // Final response from LLM after receiving tool execution results
      const finalResponse = await llm.invoke(chatMessages);
      const reply = finalResponse.content;
      const isRefusal = /currently working in/i.test(reply) || /please ask questions related to/i.test(reply);

      return {
        reply,
        sources: isRefusal ? [] : sources,
        toolCalls: toolCallsRecord,
        ragEnabled: !isRefusal && sources.length > 0
      };
    }

    // No tool calls needed, return direct grounded answer
    const reply = aiResponse.content;
    const isRefusal = /currently working in/i.test(reply) || /please ask questions related to/i.test(reply);

    return {
      reply,
      sources: isRefusal ? [] : sources,
      toolCalls: [],
      ragEnabled: !isRefusal && sources.length > 0
    };
  } catch (error) {
    console.error("LangChain RAG Agent error:", error?.message);
    throw error;
  }
};

module.exports = {
  ragAiChat,
  vectorRetriever,
  executeCodeTool,
  searchDocsTool
};
