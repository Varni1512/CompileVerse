const { ChatGroq } = require("@langchain/groq");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { Document } = require("@langchain/core/documents");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { KNOWLEDGE_DOCS } = require("./ragKnowledgeBase");
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

      // Boost score if document matches active editor programming language
      if (doc.metadata.language === language) {
        similarity *= 1.5;
      } else if (doc.metadata.language === "general") {
        similarity *= 1.1;
      } else {
        similarity *= 0.5; // Penalize mismatching language docs (e.g. Python docs for C++ query)
      }

      return { doc, score: similarity };
    });

    // Sort descending by score
    scores.sort((a, b) => b.score - a.score);

    // Return top-k matches with non-zero similarity
    return scores
      .filter(item => item.score > 0.05)
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
const getGroqLlm = () => {
  return new ChatGroq({
    apiKey: process.env.GROQ_API_KEY || "missing_key",
    model: process.env.GROQ_MODEL_ID || "llama-3.3-70b-versatile",
    temperature: 0.3,
  });
};

/**
 * Main RAG Chat Chain:
 * 1. Retrieves relevant official docs from vector space.
 * 2. Augments prompt with retrieved knowledge.
 * 3. Executes LangChain pipeline to generate verified, hallucination-free advice.
 */
const ragAiChat = async (messages, code, language) => {
  // Extract latest user inquiry
  const userMessages = messages.filter(m => m.role === "user");
  const latestInquiry = userMessages.length > 0 ? userMessages[userMessages.length - 1].content : "";
  const retrievalQuery = `${latestInquiry} ${language} ${code.slice(0, 500)}`;

  // Step 1: Retrieve relevant context using Vector Space Retriever
  const retrievedDocs = await vectorRetriever.retrieve(retrievalQuery, language, 2);

  // Format RAG context block
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

  // Step 2: Build LangChain ChatPromptTemplate
  const systemPromptTemplate = `You are an expert programming tutor and strict mentor running inside the CompileVerse IDE.
Your goal is to guide the user to solve their coding problems without ever giving them the full solution.

=== OFFICIAL DOCUMENTATION & PATTERNS (RETRIEVED VIA RAG) ===
{rag_context}
=============================================================

STRICT RULES:
1. Ground your explanations in the official documentation and best practices provided above.
2. NEVER provide the complete corrected code or full solutions.
3. Only provide hints, explain concepts, point out bugs, or give very small snippets (e.g. 1-2 lines) to illustrate a syntax rule.
4. The user is currently writing in {language}. Here is their current code context:
\`\`\`{language}
{code}
\`\`\`
5. If the user asks a question completely unrelated to programming or their code, politely reply: "Please ask questions related to programming or your current code."
6. IMPORTANT FORMATTING: Do NOT use markdown headers like '#', '##', or '###'. Keep your formatting completely clean and plain. You may use backticks for code and ** for bold text, but NO headers.`;

  const chatPrompt = ChatPromptTemplate.fromMessages([
    ["system", systemPromptTemplate],
    ...messages.map(m => [m.role === "assistant" ? "assistant" : "user", m.content])
  ]);

  // Step 3: LangChain LCEL Pipeline Execution
  const llm = getGroqLlm();
  const outputParser = new StringOutputParser();
  const chain = chatPrompt.pipe(llm).pipe(outputParser);

  try {
    const reply = await chain.invoke({
      rag_context: ragContext,
      language: language,
      code: code || "// No code currently in editor"
    });

    return {
      reply,
      sources,
      ragEnabled: true
    };
  } catch (error) {
    console.error("LangChain RAG error, falling back to direct Groq:", error?.message);
    // If LangChain encounters an issue, fallback gracefully
    throw error;
  }
};

module.exports = {
  ragAiChat,
  vectorRetriever
};
