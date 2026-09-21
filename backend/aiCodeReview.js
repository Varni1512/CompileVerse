const Groq = require("groq-sdk");
const dotenv = require("dotenv");
const { ragAiChat, vectorRetriever } = require("./langchainRag");

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "missing_key" });

const aiChat = async (messages, code, language) => {
    try {
        // Primary: Execute LangChain RAG pipeline with Vector Search
        return await ragAiChat(messages, code, language);
    } catch (ragError) {
        console.warn("RAG pipeline fallback triggered:", ragError.message);
        
        // Graceful fallback to direct Groq API completion
        const langMap = { cpp: "C++", py: "Python", python: "Python", java: "Java" };
        const activeLang = langMap[language] || language;

        const systemPrompt = {
            role: "system",
            content: `You are an expert programming tutor and strict mentor running inside the CompileVerse IDE.
Your goal is to guide the user to solve their coding problems without ever giving them the full solution.

STRICT GUARDRAILS & RULES:
1. The user is currently writing in ${activeLang}. Here is their current code context:
\`\`\`${activeLang}
${code || "// No code in editor"}
\`\`\`
2. STRICT LANGUAGE & CODE RELEVANCE:
- You must ONLY answer questions directly related to the user's current code context or ${activeLang} programming.
- If the user asks about a DIFFERENT programming language (e.g. asking about Python while active in Java/C++, or asking about Java while in Python), DO NOT ANSWER. Immediately reply:
  "You are currently working in ${activeLang}. Please ask questions related to your current ${activeLang} code."
- If the user asks a question completely unrelated to the current code or ${activeLang}, DO NOT answer. Reply with:
  "Please ask questions related to your current code in the editor."
3. NEVER provide the complete corrected code or full solutions. Only provide hints, explain concepts, or point out bugs.
4. IMPORTANT FORMATTING: Do NOT use markdown headers like '#', '##', or '###'. Keep your formatting clean and plain. You may use backticks for code and ** for bold text, but NO headers.`
        };

        const completion = await groq.chat.completions.create({
            messages: [systemPrompt, ...messages],
            model: process.env.GROQ_MODEL_ID || "llama-3.3-70b-versatile",
        });

        return {
            reply: completion.choices[0]?.message?.content || "",
            sources: [],
            ragEnabled: false
        };
    }
};

// New function for complexity analysis only
const getComplexityAnalysis = async (code) => {
    const completion = await groq.chat.completions.create({
        messages: [
            {
                role: "user",
                content: `Analyze the following code and provide ONLY the time and space complexity in this exact format:

Time Complexity: [your answer]
Space Complexity: [your answer]

Do not provide any explanations, examples, or additional text. Only the complexity analysis in the format above.

Here is the code:
        ${code}`
            }
        ],
        model: process.env.GROQ_MODEL_ID || "openai/gpt-oss-120b",
    });

    const responseText = completion.choices[0]?.message?.content || "";
    console.log(responseText);
    return responseText;
};

// New function for error explanation with RAG grounding
const explainError = async (errorMessage, code = null, language = null) => {
    const codeContext = code ? `\n\nCode context:\n${code}` : '';
    const languageContext = language ? `\nProgramming Language: ${language}` : '';
    
    let ragDocContext = '';
    try {
        const retrievedDocs = await vectorRetriever.retrieve(`${errorMessage} ${code || ''}`, language || 'general', 1);
        if (retrievedDocs.length > 0) {
            ragDocContext = `\n\nRelevant Official Documentation / Reference:\n${retrievedDocs[0].pageContent}`;
        }
    } catch (e) {
        console.warn("Vector retrieval for error explanation skipped:", e.message);
    }

    const completion = await groq.chat.completions.create({
        messages: [
            {
                role: "system",
                content: "You are an expert programming tutor specializing in error analysis and debugging."
            },
            {
                role: "user",
                content: `Your task is to explain the following error message in a clear, educational way:

Error Message:
${errorMessage}${languageContext}${codeContext}${ragDocContext}

Please provide:
1. **What the error means**: Explain the error in simple terms
2. **Why it occurred**: Identify the root cause
3. **How to fix it**: Provide specific steps or suggestions to resolve the error
4. **Prevention tips**: Brief advice on how to avoid this error in the future

Keep your explanation clear, concise, and beginner-friendly. Focus on helping the user understand and learn from the error.`
            }
        ],
        model: process.env.GROQ_MODEL_ID || "llama-3.3-70b-versatile",
    });

    const responseText = completion.choices[0]?.message?.content || "";
    return responseText;
};

module.exports = {
    aiChat,
    getComplexityAnalysis,
    explainError,
};