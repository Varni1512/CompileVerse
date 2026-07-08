const express = require("express");
const cors = require("cors");
const { executeCode, executeTests } = require("./executeCode");
const { aiCodeReview, getComplexityAnalysis, explainError } = require("./aiCodeReview");
const { formatCode } = require("./formatter");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Online Compiler Backend!" });
});

app.post("/run", async (req, res) => {
  const { language, code, input = "", analyzeComplexity = false } = req.body;

  if (!code) {
    return res.status(400).json({ success: false, error: "Code is required." });
  }

  try {
    const output = await executeCode(language, code, input);
    let complexity = "Analysis not requested";
    if (analyzeComplexity) {
      try {
        complexity = await getComplexityAnalysis(code);
      } catch (aiErr) {
        console.error("AI Complexity Analysis Error:", aiErr);
        if (aiErr.status === 429 || aiErr?.error?.error?.code === "rate_limit_exceeded") {
          complexity = "AI Limit Reached. Please try again later.";
        } else {
          complexity = "Analysis failed";
        }
      }
    }

    res.json({ output, complexity });
  } catch (err) {
    console.error("Execution Error:", err);
    res.status(500).json({ success: false, error: err.error || "Execution failed" });
  }
});

app.post("/run-tests", async (req, res) => {
  const { language, code, testCases = [], analyzeComplexity = false } = req.body;

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

    let complexity = "Analysis not requested";
    if (analyzeComplexity) {
      try {
        complexity = await getComplexityAnalysis(code);
      } catch (aiErr) {
        console.error("AI Complexity Analysis Error:", aiErr);
        if (aiErr.status === 429 || aiErr?.error?.error?.code === "rate_limit_exceeded") {
          complexity = "AI Limit Reached. Please try again later.";
        } else {
          complexity = "Analysis failed";
        }
      }
    }

    res.json({ results: formattedResults, complexity });
  } catch (err) {
    console.error("Execution Error:", err);
    res.status(500).json({ success: false, error: err.error || "Execution failed" });
  }
});

app.post("/ai-review", async (req, res) => {
  const { code } = req.body;
  if (!code || code.trim() === '') {
    return res.status(400).json({ success: false, error: "Code is required." });
  }
  try {
    const review = await aiCodeReview(code);
    res.status(200).json({ review });
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

app.post("/format", async (req, res) => {
  const { language, code } = req.body;
  if (!code) {
    return res.status(400).json({ success: false, error: "Code is required." });
  }
  try {
    const formattedCode = await formatCode(language, code);
    res.json({ formattedCode });
  } catch (error) {
    console.error("Format Error:", error);
    res.status(500).json({ success: false, error: error.error || "Formatting failed" });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});