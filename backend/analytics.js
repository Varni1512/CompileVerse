const fs = require('fs');
const path = require('path');
const UAParser = require('ua-parser-js');

const STATS_FILE = path.join(__dirname, 'stats.json');

// Initialize stats file if it doesn't exist
if (!fs.existsSync(STATS_FILE)) {
  fs.writeFileSync(STATS_FILE, JSON.stringify({ usage: [] }, null, 2));
}

function getStats() {
  try {
    const data = fs.readFileSync(STATS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return { usage: [] };
  }
}

function saveStats(stats) {
  try {
    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
  } catch (err) {
    console.error("Error saving stats:", err);
  }
}

function logUsage(ip, endpoint, language, status = 'success', userAgentString = '') {
  // Normalize local IPs
  let queryIp = ip;
  if (ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1') {
    queryIp = '127.0.0.1'; // Localhost
  }

  const parser = new UAParser(userAgentString);
  const browser = parser.getBrowser();
  const os = parser.getOS();

  const record = {
    ip: queryIp,
    browser: browser.name || 'Unknown',
    os: os.name || 'Unknown',
    endpoint,
    language: language || 'unknown',
    status,
    timestamp: new Date().toISOString()
  };

  const stats = getStats();
  // Keep only the last 1000 records to prevent file from growing indefinitely
  if (stats.usage.length > 1000) {
    stats.usage.shift(); 
  }
  stats.usage.push(record);
  
  saveStats(stats);
}

module.exports = {
  logUsage,
  getStats
};
