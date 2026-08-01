require('dotenv').config();
const mongoose = require('mongoose');
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { executeCode, executeTests } = require("./executeCode");
const { aiChat, getComplexityAnalysis, explainError } = require("./aiCodeReview");
const { logUsage, getStats } = require("./analytics");
const {
  getClientIp,
  getStatus,
  checkAiLimit,
  incrementAiUsage,
  getAllLimits,
  updateIpLimit,
  resetIpUsage,
  updateGlobalLimit
} = require("./aiLimiter");

const app = express();

// Connect to MongoDB
if (process.env.MONGODB_URI && process.env.MONGODB_URI !== 'your_mongodb_connection_string_here') {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB Analytics Database'))
    .catch(err => console.error('MongoDB Connection Error:', err));
} else {
  console.log('MongoDB URI not found in .env. Analytics will not be saved.');
}

// Trust the first proxy in front of the application (e.g. Nginx, Render, Heroku)
// This is required for express-rate-limit to work correctly when deployed
app.set("trust proxy", 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. Helmet for HTTP header security
app.use(helmet());

// 2. Configure CORS (Allow localhost, Vercel, Netlify, Render, Railway, custom domains, or wildcard)
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || process.env.CORS_ORIGIN === '*' || !process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    const allowedPatterns = [
      'localhost',
      '127.0.0.1',
      'vercel.app',
      'netlify.app',
      'onrender.com',
      'railway.app',
      'github.io',
      'aymahajan.in',
      'codewithvarni.app'
    ];
    const isAllowed = allowedPatterns.some(pattern => origin.includes(pattern)) || (process.env.CORS_ORIGIN && origin.includes(process.env.CORS_ORIGIN));
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive fallback to prevent breaking cross-domain deployments
    }
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-password', 'x-requested-with', 'Accept'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// 3. Rate Limiting to prevent DDOS and general server flooding
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // limit each IP to 150 requests per windowMs
  message: { success: false, error: 'Too many requests from this IP, please try again after 15 minutes.' }
});
app.use(limiter);

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Online Compiler Backend!" });
});

// AI Usage Limit Status Endpoint for client
app.get("/ai-limit-status", async (req, res) => {
  try {
    const ip = getClientIp(req);
    const status = await getStatus(ip);
    res.json({ success: true, ...status });
  } catch (err) {
    console.error("Error fetching AI limit status:", err);
    res.status(500).json({ success: false, error: "Failed to get AI limit status" });
  }
});

app.post("/run", async (req, res) => {
  const { language, code, input = "" } = req.body;

  if (!code) {
    return res.status(400).json({ success: false, error: "Code is required." });
  }

  try {
    const output = await executeCode(language, code, input);
    logUsage(getClientIp(req), '/run', language, 'success', req.headers['user-agent']);
    res.json({ output });
  } catch (err) {
    console.error("Execution Error:", err);
    logUsage(getClientIp(req), '/run', language, 'error', req.headers['user-agent']);
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

    logUsage(getClientIp(req), '/run-tests', language, 'success', req.headers['user-agent']);

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
    logUsage(getClientIp(req), '/run-tests', language, 'error', req.headers['user-agent']);
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
    logUsage(getClientIp(req), '/analyze', 'unknown', 'success', req.headers['user-agent']);
    res.json({ complexity });
  } catch (aiErr) {
    console.error("AI Complexity Analysis Error:", aiErr);
    logUsage(getClientIp(req), '/analyze', 'unknown', 'error', req.headers['user-agent']);
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

  const clientIp = getClientIp(req);
  const limitCheck = await checkAiLimit(clientIp);

  if (!limitCheck.allowed) {
    logUsage(clientIp, '/ai-review', language, 'limit_exceeded', req.headers['user-agent']);
    return res.status(429).json({
      success: false,
      limitReached: true,
      error: `AI message limit reached (${limitCheck.used}/${limitCheck.limit} used). Please contact admin to increase your limit.`,
      usage: {
        used: limitCheck.used,
        limit: limitCheck.limit,
        remaining: 0,
        limitReached: true
      }
    });
  }

  try {
    const reply = await aiChat(messages, code, language);
    const updatedUsage = await incrementAiUsage(clientIp, req.headers['user-agent']);
    logUsage(clientIp, '/ai-review', language, 'success', req.headers['user-agent']);
    res.status(200).json({
      reply,
      usage: {
        used: updatedUsage.used,
        limit: updatedUsage.limit,
        remaining: updatedUsage.remaining,
        limitReached: updatedUsage.limitReached
      }
    });
  } catch (error) {
    logUsage(clientIp, '/ai-review', language, 'error', req.headers['user-agent']);
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
    logUsage(getClientIp(req), '/explain-error', language, 'success', req.headers['user-agent']);
    res.status(200).json({ success: true, explanation });
  } catch (error) {
    logUsage(getClientIp(req), '/explain-error', language, 'error', req.headers['user-agent']);
    if (error.status === 429 || error?.error?.error?.code === "rate_limit_exceeded") {
      return res.status(429).json({ success: false, error: "AI API limit reached. Please try again later." });
    }
    res.status(500).json({ success: false, error: error.message || 'An error occurred.' });
  }
});

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Admin authentication middleware
const verifyAdminAuth = (req, res, next) => {
  const authHeader = req.headers['x-admin-password'] || req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ success: false, error: 'Admin authentication required.' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  if (token !== ADMIN_PASSWORD) {
    return res.status(403).json({ success: false, error: 'Invalid admin password.' });
  }

  next();
};

// Admin Login verification endpoint
app.post("/api/admin/login", (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ success: false, error: "Password is required." });
  }
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, error: "Incorrect admin password." });
  }
  res.json({ success: true, message: "Authenticated successfully." });
});

app.get("/stats", verifyAdminAuth, async (req, res) => {
  const stats = await getStats();
  res.json(stats);
});

// Admin AI Rate Limit Management Endpoints (Password Protected)
app.get("/api/admin/ai-limits", verifyAdminAuth, async (req, res) => {
  try {
    const data = await getAllLimits();
    res.json({ success: true, ...data });
  } catch (err) {
    console.error("Error fetching AI limits for admin:", err);
    res.status(500).json({ success: false, error: "Failed to get AI limits" });
  }
});

app.post("/api/admin/ai-limits/update", verifyAdminAuth, async (req, res) => {
  try {
    const { ip, newLimit, resetCount } = req.body;
    if (!ip) {
      return res.status(400).json({ success: false, error: "IP address is required." });
    }
    const result = await updateIpLimit(ip, newLimit, resetCount);
    res.json(result);
  } catch (err) {
    console.error("Error updating IP limit:", err);
    res.status(500).json({ success: false, error: "Failed to update IP limit" });
  }
});

app.post("/api/admin/ai-limits/reset", verifyAdminAuth, async (req, res) => {
  try {
    const { ip } = req.body;
    if (!ip) {
      return res.status(400).json({ success: false, error: "IP address is required." });
    }
    const result = await resetIpUsage(ip);
    res.json(result);
  } catch (err) {
    console.error("Error resetting IP usage:", err);
    res.status(500).json({ success: false, error: "Failed to reset IP usage" });
  }
});

app.post("/api/admin/ai-limits/global", verifyAdminAuth, async (req, res) => {
  try {
    const { defaultLimit } = req.body;
    if (defaultLimit === undefined || defaultLimit === null || isNaN(defaultLimit)) {
      return res.status(400).json({ success: false, error: "A valid defaultLimit number is required." });
    }
    const result = await updateGlobalLimit(defaultLimit);
    res.json(result);
  } catch (err) {
    console.error("Error updating global AI limit:", err);
    res.status(500).json({ success: false, error: "Failed to update global AI limit" });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});