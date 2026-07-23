const mongoose = require('mongoose');
const UAParser = require('ua-parser-js');

const analyticsSchema = new mongoose.Schema({
  ip: { type: String, required: true },
  browser: { type: String, default: 'Unknown' },
  os: { type: String, default: 'Unknown' },
  endpoint: { type: String, required: true },
  language: { type: String, default: 'unknown' },
  status: { type: String, default: 'success' },
  timestamp: { type: Date, default: Date.now }
});

const Analytics = mongoose.model('Analytics', analyticsSchema);

async function getStats() {
  try {
    // Return latest 1000 records
    const usage = await Analytics.find().sort({ timestamp: -1 }).limit(1000).lean();
    return { usage };
  } catch (err) {
    console.error("Error fetching stats from MongoDB:", err);
    return { usage: [] };
  }
}

async function logUsage(ip, endpoint, language, status = 'success', userAgentString = '') {
  try {
    // Normalize local IPs
    let queryIp = ip;
    if (ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1') {
      queryIp = '127.0.0.1'; // Localhost
    }

    const parser = new UAParser(userAgentString);
    const browser = parser.getBrowser();
    const os = parser.getOS();

    await Analytics.create({
      ip: queryIp,
      browser: browser.name || 'Unknown',
      os: os.name || 'Unknown',
      endpoint,
      language: language || 'unknown',
      status
    });
  } catch (err) {
    console.error("Error saving stats to MongoDB:", err);
  }
}

module.exports = {
  logUsage,
  getStats
};
