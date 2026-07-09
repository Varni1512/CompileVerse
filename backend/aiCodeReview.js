const Groq = require("groq-sdk");
const dotenv = require("dotenv");

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "missing_key" });

const aiCodeReview = async (code) => {
    const completion = await groq.chat.completions.create({
        messages: [
            {
                role: "system",
                content: "You are an expert code optimizer."
            },
            {
                role: "user",
                content: `Your task:
1. Provide an optimized version of the following code. IF the code is already fully optimized and cannot be meaningfully improved, write exactly "ALREADY_OPTIMIZED" inside the code block.
2. Provide the Time Complexity and Space Complexity.

Format your response EXACTLY like this:

\`\`\`
[your optimized code here with preserved indentation and newlines, OR "ALREADY_OPTIMIZED"]
\`\`\`
TIME_COMPLEXITY: [your time complexity, e.g. O(n)]
SPACE_COMPLEXITY: [your space complexity, e.g. O(1)]

Here is the code:
${code}`
            }
        ],
        model: "llama-3.3-70b-versatile",
    });

    const responseText = completion.choices[0]?.message?.content || "";
    console.log(responseText);
    
    // Parse the markdown response
    const codeMatch = responseText.match(/```[\w]*\n([\s\S]*?)```/);
    const tcMatch = responseText.match(/TIME_COMPLEXITY:\s*(.*)/);
    const scMatch = responseText.match(/SPACE_COMPLEXITY:\s*(.*)/);

    let optimizedCode = codeMatch ? codeMatch[1].trim() : responseText.replace(/```[\s\S]*/, '').trim();

    // If the LLM returned the exact same code (ignoring whitespace), it means no improvements were made.
    if (
        optimizedCode === "ALREADY_OPTIMIZED" || 
        optimizedCode.replace(/\s+/g, '') === code.replace(/\s+/g, '')
    ) {
        optimizedCode = "ALREADY_OPTIMIZED";
    }

    return {
        optimizedCode: optimizedCode,
        timeComplexity: tcMatch ? tcMatch[1].trim() : "Unknown",
        spaceComplexity: scMatch ? scMatch[1].trim() : "Unknown"
    };
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
        model: "llama-3.3-70b-versatile",
    });

    const responseText = completion.choices[0]?.message?.content || "";
    console.log(responseText);
    return responseText;
};

// New function for error explanation
const explainError = async (errorMessage, code = null, language = null) => {
    const codeContext = code ? `\n\nCode context:\n${code}` : '';
    const languageContext = language ? `\nProgramming Language: ${language}` : '';
    
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
${errorMessage}${languageContext}${codeContext}

Please provide:
1. **What the error means**: Explain the error in simple terms
2. **Why it occurred**: Identify the root cause
3. **How to fix it**: Provide specific steps or suggestions to resolve the error
4. **Prevention tips**: Brief advice on how to avoid this error in the future

Keep your explanation clear, concise, and beginner-friendly. Focus on helping the user understand and learn from the error.`
            }
        ],
        model: "llama-3.3-70b-versatile",
    });

    const responseText = completion.choices[0]?.message?.content || "";
    console.log(responseText);
    return responseText;
};

module.exports = {
    aiCodeReview,
    getComplexityAnalysis,
    explainError,
};