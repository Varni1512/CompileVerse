const express = require("express");
const cors = require("cors");
const { executeCode } = require("./executeCode");
const { aiCodeReview, getComplexityAnalysis, explainError } = require("./aiCodeReview");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

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
    const complexity = await getComplexityAnalysis(code);
    res.json({ output, complexity });
  } catch (err) {
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
    res.status(500).json({ success: false, error: error.message || 'An error occurred.' });
  }
});

// Render dynamically assigns a port, so we listen to process.env.PORT
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});