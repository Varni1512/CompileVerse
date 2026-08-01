const mongoose = require('mongoose');
const UAParser = require('ua-parser-js');

// Schema for tracking IP-specific AI message usage and custom limits
const aiUsageLimitSchema = new mongoose.Schema({
  ip: { type: String, required: true, unique: true, index: true },
  usedCount: { type: Number, default: 0 },
  customLimit: { type: Number, default: null }, // null means use global default limit
  lastUsed: { type: Date, default: Date.now },
  browser: { type: String, default: 'Unknown' },
  os: { type: String, default: 'Unknown' },
  userAgent: { type: String, default: '' }
}, { timestamps: true });

// Schema for global AI configuration (e.g. global default limit)
const aiConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: 'global_config' },
  defaultLimit: { type: Number, default: 5 }
}, { timestamps: true });

const AiUsageLimit = mongoose.model('AiUsageLimit', aiUsageLimitSchema);
const AiConfig = mongoose.model('AiConfig', aiConfigSchema);

// In-memory fallback in case MongoDB is offline or disconnected
const memoryLimits = new Map();
let memoryDefaultLimit = 5;

/**
 * Normalize client IP address (handle localhost, IPv6 prefixes, proxy comma chains)
 */
function normalizeIp(ip) {
  if (!ip) return '127.0.0.1';
  let cleanIp = ip;
  if (typeof cleanIp === 'string' && cleanIp.includes(',')) {
    cleanIp = cleanIp.split(',')[0].trim();
  }
  if (cleanIp === '::1' || cleanIp === '127.0.0.1' || cleanIp === '::ffff:127.0.0.1') {
    return '127.0.0.1';
  }
  return cleanIp;
}

/**
 * Extract client IP from Express request
 */
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return normalizeIp(forwarded);
  }
  return normalizeIp(req.ip || req.socket?.remoteAddress || '127.0.0.1');
}

/**
 * Get global default AI message limit (default: 5)
 */
async function getGlobalDefaultLimit() {
  try {
    if (mongoose.connection.readyState === 1) {
      let config = await AiConfig.findOne({ key: 'global_config' }).lean();
      if (!config) {
        config = await AiConfig.create({ key: 'global_config', defaultLimit: memoryDefaultLimit });
      }
      memoryDefaultLimit = config.defaultLimit;
      return config.defaultLimit;
    }
  } catch (err) {
    console.error("Error reading AiConfig from DB:", err);
  }
  return memoryDefaultLimit;
}

/**
 * Get status of AI usage for a specific IP
 */
async function getStatus(ip) {
  const normIp = normalizeIp(ip);
  const defaultLimit = await getGlobalDefaultLimit();

  try {
    if (mongoose.connection.readyState === 1) {
      const record = await AiUsageLimit.findOne({ ip: normIp }).lean();
      const used = record ? record.usedCount : 0;
      const customLimit = record ? record.customLimit : null;
      const effectiveLimit = (customLimit !== null && customLimit !== undefined) ? customLimit : defaultLimit;
      const remaining = Math.max(0, effectiveLimit - used);

      return {
        ip: normIp,
        used,
        limit: effectiveLimit,
        customLimit,
        defaultLimit,
        remaining,
        limitReached: used >= effectiveLimit
      };
    }
  } catch (err) {
    console.error("Error fetching AI status from DB:", err);
  }

  // In-memory fallback
  const mem = memoryLimits.get(normIp) || { usedCount: 0, customLimit: null };
  const effectiveLimit = mem.customLimit !== null ? mem.customLimit : defaultLimit;
  const remaining = Math.max(0, effectiveLimit - mem.usedCount);

  return {
    ip: normIp,
    used: mem.usedCount,
    limit: effectiveLimit,
    customLimit: mem.customLimit,
    defaultLimit,
    remaining,
    limitReached: mem.usedCount >= effectiveLimit
  };
}

/**
 * Check if the IP is allowed to send an AI message
 */
async function checkAiLimit(ip) {
  const status = await getStatus(ip);
  return {
    allowed: !status.limitReached,
    ...status
  };
}

/**
 * Increment AI usage count for an IP after a successful AI interaction
 */
async function incrementAiUsage(ip, userAgentString = '') {
  const normIp = normalizeIp(ip);
  const defaultLimit = await getGlobalDefaultLimit();

  const parser = new UAParser(userAgentString);
  const browser = parser.getBrowser().name || 'Unknown';
  const os = parser.getOS().name || 'Unknown';

  try {
    if (mongoose.connection.readyState === 1) {
      const record = await AiUsageLimit.findOneAndUpdate(
        { ip: normIp },
        {
          $inc: { usedCount: 1 },
          $set: {
            lastUsed: new Date(),
            browser,
            os,
            userAgent: userAgentString
          },
          $setOnInsert: {
            customLimit: null
          }
        },
        { upsert: true, new: true, lean: true }
      );

      const effectiveLimit = record.customLimit !== null && record.customLimit !== undefined
        ? record.customLimit
        : defaultLimit;

      return {
        ip: normIp,
        used: record.usedCount,
        limit: effectiveLimit,
        remaining: Math.max(0, effectiveLimit - record.usedCount),
        limitReached: record.usedCount >= effectiveLimit
      };
    }
  } catch (err) {
    console.error("Error incrementing AI usage in DB:", err);
  }

  // In-memory fallback
  let mem = memoryLimits.get(normIp) || { usedCount: 0, customLimit: null, browser, os, lastUsed: new Date() };
  mem.usedCount += 1;
  mem.lastUsed = new Date();
  mem.browser = browser;
  mem.os = os;
  memoryLimits.set(normIp, mem);

  const effectiveLimit = mem.customLimit !== null ? mem.customLimit : defaultLimit;
  return {
    ip: normIp,
    used: mem.usedCount,
    limit: effectiveLimit,
    remaining: Math.max(0, effectiveLimit - mem.usedCount),
    limitReached: mem.usedCount >= effectiveLimit
  };
}

/**
 * Admin: Get all IP limit records and overall statistics
 */
async function getAllLimits() {
  const defaultLimit = await getGlobalDefaultLimit();

  try {
    if (mongoose.connection.readyState === 1) {
      const records = await AiUsageLimit.find().sort({ lastUsed: -1 }).limit(500).lean();
      const ipList = records.map(r => {
        const effectiveLimit = (r.customLimit !== null && r.customLimit !== undefined) ? r.customLimit : defaultLimit;
        return {
          ip: r.ip,
          usedCount: r.usedCount || 0,
          customLimit: r.customLimit,
          effectiveLimit,
          remaining: Math.max(0, effectiveLimit - (r.usedCount || 0)),
          isLimitReached: (r.usedCount || 0) >= effectiveLimit,
          hasCustomLimit: r.customLimit !== null && r.customLimit !== undefined,
          browser: r.browser || 'Unknown',
          os: r.os || 'Unknown',
          lastUsed: r.lastUsed || r.updatedAt || new Date()
        };
      });

      return {
        defaultLimit,
        totalTrackedIps: ipList.length,
        ips: ipList
      };
    }
  } catch (err) {
    console.error("Error fetching all AI limits from DB:", err);
  }

  // In-memory fallback
  const ipList = Array.from(memoryLimits.entries()).map(([ip, data]) => {
    const effectiveLimit = data.customLimit !== null ? data.customLimit : defaultLimit;
    return {
      ip,
      usedCount: data.usedCount || 0,
      customLimit: data.customLimit,
      effectiveLimit,
      remaining: Math.max(0, effectiveLimit - (data.usedCount || 0)),
      isLimitReached: (data.usedCount || 0) >= effectiveLimit,
      hasCustomLimit: data.customLimit !== null,
      browser: data.browser || 'Unknown',
      os: data.os || 'Unknown',
      lastUsed: data.lastUsed || new Date()
    };
  });

  return {
    defaultLimit,
    totalTrackedIps: ipList.length,
    ips: ipList
  };
}

/**
 * Admin: Update custom limit for a specific IP and optionally reset count
 */
async function updateIpLimit(ip, newLimit, resetCount = false) {
  const normIp = normalizeIp(ip);
  const parsedLimit = newLimit === null || newLimit === '' ? null : Number(newLimit);

  const updateFields = {
    customLimit: parsedLimit
  };

  if (resetCount) {
    updateFields.usedCount = 0;
  }

  try {
    if (mongoose.connection.readyState === 1) {
      const updated = await AiUsageLimit.findOneAndUpdate(
        { ip: normIp },
        { $set: updateFields },
        { upsert: true, new: true, lean: true }
      );
      return { success: true, record: updated };
    }
  } catch (err) {
    console.error("Error updating IP limit in DB:", err);
  }

  // Memory fallback
  let mem = memoryLimits.get(normIp) || { usedCount: 0, customLimit: null };
  mem.customLimit = parsedLimit;
  if (resetCount) mem.usedCount = 0;
  memoryLimits.set(normIp, mem);

  return { success: true, record: { ip: normIp, ...mem } };
}

/**
 * Admin: Reset used count for an IP back to 0
 */
async function resetIpUsage(ip) {
  const normIp = normalizeIp(ip);

  try {
    if (mongoose.connection.readyState === 1) {
      const updated = await AiUsageLimit.findOneAndUpdate(
        { ip: normIp },
        { $set: { usedCount: 0 } },
        { upsert: true, new: true, lean: true }
      );
      return { success: true, record: updated };
    }
  } catch (err) {
    console.error("Error resetting IP usage in DB:", err);
  }

  let mem = memoryLimits.get(normIp) || { usedCount: 0, customLimit: null };
  mem.usedCount = 0;
  memoryLimits.set(normIp, mem);
  return { success: true, record: { ip: normIp, ...mem } };
}

/**
 * Admin: Update global default limit for all users without custom limits
 */
async function updateGlobalLimit(newDefaultLimit) {
  const defaultLimit = Number(newDefaultLimit) || 5;
  memoryDefaultLimit = defaultLimit;

  try {
    if (mongoose.connection.readyState === 1) {
      const updated = await AiConfig.findOneAndUpdate(
        { key: 'global_config' },
        { $set: { defaultLimit } },
        { upsert: true, new: true, lean: true }
      );
      return { success: true, defaultLimit: updated.defaultLimit };
    }
  } catch (err) {
    console.error("Error updating global limit in DB:", err);
  }

  return { success: true, defaultLimit };
}

module.exports = {
  getClientIp,
  normalizeIp,
  getGlobalDefaultLimit,
  getStatus,
  checkAiLimit,
  incrementAiUsage,
  getAllLimits,
  updateIpLimit,
  resetIpUsage,
  updateGlobalLimit
};
