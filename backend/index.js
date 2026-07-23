const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { executeCode, executeTests } = require("./executeCode");
const { aiChat, getComplexityAnalysis, explainError } = require("./aiCodeReview");

const app = express();

// Trust the first proxy in front of the application (e.g. Nginx, Render, Heroku)
// This is required for express-rate-limit to work correctly when deployed
app.set("trust proxy", 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. Helmet for HTTP header security
app.use(helmet());

// 2. Restrict CORS (Allow localhost, Vercel, and custom domains)
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || origin.includes('localhost') || origin.includes('vercel.app') || origin.includes('aymahajan.in') || origin.includes('codewithvarni.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST']
}));

// 3. Rate Limiting to prevent DDOS and AI API abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, error: 'Too many requests from this IP, please try again after 15 minutes.' }
});
app.use(limiter);

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Online Compiler Backend!" });
});

app.post("/run", async (req, res) => {
  const { language, code, input = "" } = req.body;

  if (!code) {
    return res.status(400).json({ success: false, error: "Code is required." });
  }

  try {
    const output = await executeCode(language, code, input);
    res.json({ output });
  } catch (err) {
    console.error("Execution Error:", err);
    res.status(500).json({ success: false, error: err.error || "Execution failed" });
  }
});

app.post("/run-tests", async (req, res) => {
  const { language, code, testCases = [] } = req.body;

  if (!code) {
    return res.status(400).json({ success: false, error: "Code is required." });
  }

  try {
    const inputs = testCases.map(tc => tc.input);
    const results = await executeTests(language, code, inputs);

    const formattedResults = results.map((result, index) => {
      if (!result.success) {
        return { passed: false, error: result.error, expectedOutput: testCases[index].expectedOutput };
      }
      const actualOutput = result.output.trim();
      const expectedOutput = (testCases[index].expectedOutput || "").trim();
      return {
        passed: actualOutput === expectedOutput,
        actualOutput,
        expectedOutput
      };
    });

    res.json({ results: formattedResults });
  } catch (err) {
    console.error("Execution Error:", err);
    res.status(500).json({ success: false, error: err.error || "Execution failed" });
  }
});

app.post("/analyze", async (req, res) => {
  const { code } = req.body;
  if (!code || code.trim() === '') {
    return res.status(400).json({ success: false, error: "Code is required." });
  }
  try {
    const complexity = await getComplexityAnalysis(code);
    res.json({ complexity });
  } catch (aiErr) {
    console.error("AI Complexity Analysis Error:", aiErr);
    if (aiErr.status === 429 || aiErr?.error?.error?.code === "rate_limit_exceeded") {
      res.json({ complexity: "AI Limit Reached. Please try again later." });
    } else {
      res.json({ complexity: "Analysis failed" });
    }
  }
});

app.post("/ai-review", async (req, res) => {
  const { messages, code, language } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ success: false, error: "Messages array is required." });
  }
  try {
    const reply = await aiChat(messages, code, language);
    res.status(200).json({ reply });
  } catch (error) {
    if (error.status === 429 || error?.error?.error?.code === "rate_limit_exceeded") {
      return res.status(429).json({ success: false, error: "AI API limit reached. Please wait a few minutes before trying again." });
    }
    res.status(500).json({ success: false, error: error.message || 'An error occurred.' });
  }
});

app.post("/explain-error", async (req, res) => {
  const { errorMessage, code, language } = req.body;
  if (!errorMessage || errorMessage.trim() === '') {
    return res.status(400).json({ success: false, error: "Error message is required." });
  }
  try {
    const explanation = await explainError(errorMessage, code, language);
    res.status(200).json({ success: true, explanation });
  } catch (error) {
    if (error.status === 429 || error?.error?.error?.code === "rate_limit_exceeded") {
      return res.status(429).json({ success: false, error: "AI API limit reached. Please try again later." });
    }
    res.status(500).json({ success: false, error: error.message || 'An error occurred.' });
  }
});



const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});