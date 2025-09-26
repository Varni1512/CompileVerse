const { GoogleGenAI } = require("@google/genai");
const dotenv = require("dotenv");

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const aiCodeReview = async (code) => {
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `You are an expert code optimizer.
Your task:
1. Provide an optimized version of the following code.
2. After the optimized code, output exactly TWO lines:
Time Complexity: <big-O>
Space Complexity: <big-O>

Return **nothing** else—no explanations, no bullet points.

Here is the code:
${code}`,
    });

    console.log(response.text);
    return response.text;
};

// New function for complexity analysis only
const getComplexityAnalysis = async (code) => {
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Analyze the following code and provide ONLY the time and space complexity in this exact format:

Time Complexity: [your answer]
Space Complexity: [your answer]

Do not provide any explanations, examples, or additional text. Only the complexity analysis in the format above.

Here is the code:
        ${code}`
    });

    console.log(response.text);
    return response.text;
};

// New function for error explanation
const explainError = async (errorMessage, code = null, language = null) => {
    const codeContext = code ? `\n\nCode context:\n${code}` : '';
    const languageContext = language ? `\nProgramming Language: ${language}` : '';
    
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `You are an expert programming tutor specializing in error analysis and debugging.

Your task is to explain the following error message in a clear, educational way:

Error Message:
${errorMessage}${languageContext}${codeContext}

Please provide:
1. **What the error means**: Explain the error in simple terms
2. **Why it occurred**: Identify the root cause
3. **How to fix it**: Provide specific steps or suggestions to resolve the error
4. **Prevention tips**: Brief advice on how to avoid this error in the future

Keep your explanation clear, concise, and beginner-friendly. Focus on helping the user understand and learn from the error.`
    });

    console.log(response.text);
    return response.text;
};

module.exports = {
    aiCodeReview,
    getComplexityAnalysis,
    explainError,
};