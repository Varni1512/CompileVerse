import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Activity, Users, ArrowLeft, CheckCircle, Monitor, LayoutDashboard, 
  Bot, Sliders, Plus, RotateCcw, Search, Save, AlertTriangle, 
  ShieldCheck, Zap, Sparkles, Check, RefreshCw, Lock, Key, LogOut
} from 'lucide-react';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  Legend
} from 'recharts';

const COLORS = ['#3b82f6', '#06b6d4', '#6366f1', '#ec4899', '#8b5cf6'];
const DONUT_COLORS = ['#22c55e', '#ef4444'];

export const AnalyticsDashboard = ({ isDark, activeApiUrl }) => {
  // Authentication State
  const [adminPassword, setAdminPassword] = useState(() => sessionStorage.getItem('compileverse_admin_auth') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(sessionStorage.getItem('compileverse_admin_auth')));
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState('limits');
  const [stats, setStats] = useState({ usage: [] });
  const [aiLimitsData, setAiLimitsData] = useState({ defaultLimit: 5, totalTrackedIps: 0, ips: [] });
  const [loading, setLoading] = useState(true);
  const [limitsLoading, setLimitsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit states for IP and Global limits
  const [globalLimitInput, setGlobalLimitInput] = useState('5');
  const [editingIp, setEditingIp] = useState(null);
  const [customLimitInput, setCustomLimitInput] = useState('');
  const [actionMessage, setActionMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New IP manual add
  const [manualIp, setManualIp] = useState('');
  const [manualLimit, setManualLimit] = useState('10');
  const [showAddModal, setShowAddModal] = useState(false);

  const showNotification = (text, type = 'success') => {
    setActionMessage({ text, type });
    setTimeout(() => {
      setActionMessage(null);
    }, 4000);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('compileverse_admin_auth');
    setAdminPassword('');
    setIsAuthenticated(false);
    setPasswordInput('');
    setLoginError('');
  };

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setLoginError("Please enter the admin password.");
      return;
    }

    setIsLoggingIn(true);
    setLoginError('');

    try {
      const res = await fetch(`${activeApiUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem('compileverse_admin_auth', passwordInput.trim());
        setAdminPassword(passwordInput.trim());
        setIsAuthenticated(true);
        setPasswordInput('');
      } else {
        setLoginError(data.error || "Incorrect password. Access denied.");
      }
    } catch (err) {
      setLoginError("Failed to connect to backend server.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const authHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    'x-admin-password': adminPassword
  }), [adminPassword]);

  const fetchStats = useCallback(async () => {
    if (!isAuthenticated || !adminPassword) return;
    try {
      const res = await fetch(`${activeApiUrl}/stats`, {
        headers: { 'x-admin-password': adminPassword }
      });
      if (res.status === 401 || res.status === 403) {
        handleLogout();
        return;
      }
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch analytics stats:", err);
    } finally {
      setLoading(false);
    }
  }, [activeApiUrl, isAuthenticated, adminPassword]);

  const fetchAiLimits = useCallback(async () => {
    if (!isAuthenticated || !adminPassword) return;
    try {
      setLimitsLoading(true);
      const res = await fetch(`${activeApiUrl}/api/admin/ai-limits`, {
        headers: { 'x-admin-password': adminPassword }
      });
      if (res.status === 401 || res.status === 403) {
        handleLogout();
        return;
      }
      const data = await res.json();
      if (data.success) {
        setAiLimitsData({
          defaultLimit: data.defaultLimit ?? 5,
          totalTrackedIps: data.totalTrackedIps ?? 0,
          ips: data.ips || []
        });
        setGlobalLimitInput(String(data.defaultLimit ?? 5));
      }
    } catch (err) {
      console.error("Failed to fetch AI limits:", err);
    } finally {
      setLimitsLoading(false);
    }
  }, [activeApiUrl, isAuthenticated, adminPassword]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
      fetchAiLimits();

      const interval = setInterval(() => {
        fetchStats();
        fetchAiLimits();
      }, 12000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchStats, fetchAiLimits]);

  // Handler: Update Global Default Limit
  const handleUpdateGlobalLimit = async (e) => {
    e.preventDefault();
    const newLimit = parseInt(globalLimitInput, 10);
    if (isNaN(newLimit) || newLimit < 1) {
      showNotification("Please enter a valid limit number (at least 1)", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${activeApiUrl}/api/admin/ai-limits/global`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ defaultLimit: newLimit })
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`Global default AI limit updated to ${newLimit} messages`);
        fetchAiLimits();
      } else {
        showNotification(data.error || "Failed to update global limit", "error");
      }
    } catch (err) {
      showNotification("Network error updating global limit", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Quick Boost +5 Limit
  const handleQuickBoost = async (ip, currentLimit) => {
    const newLimit = (currentLimit || aiLimitsData.defaultLimit) + 5;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${activeApiUrl}/api/admin/ai-limits/update`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ ip, newLimit })
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`Boosted limit for IP ${ip} to ${newLimit} messages!`);
        fetchAiLimits();
      }
    } catch (err) {
      showNotification("Failed to boost limit", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Set Specific Custom Limit
  const handleSaveCustomLimit = async (ip) => {
    const newLimit = parseInt(customLimitInput, 10);
    if (isNaN(newLimit) || newLimit < 0) {
      showNotification("Please enter a valid number", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${activeApiUrl}/api/admin/ai-limits/update`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ ip, newLimit })
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`Custom limit for IP ${ip} set to ${newLimit}`);
        setEditingIp(null);
        setCustomLimitInput('');
        fetchAiLimits();
      }
    } catch (err) {
      showNotification("Failed to update limit", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Reset IP Usage Count to 0
  const handleResetUsage = async (ip) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${activeApiUrl}/api/admin/ai-limits/reset`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ ip })
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`Reset message count to 0 for IP ${ip}`);
        fetchAiLimits();
      }
    } catch (err) {
      showNotification("Failed to reset usage", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Remove Custom Limit Override (revert to global default)
  const handleRemoveCustomLimit = async (ip) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${activeApiUrl}/api/admin/ai-limits/update`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ ip, newLimit: null })
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`Reverted IP ${ip} to global default limit (${aiLimitsData.defaultLimit})`);
        fetchAiLimits();
      }
    } catch (err) {
      showNotification("Failed to revert custom limit", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Add Manual Custom IP
  const handleAddManualIp = async (e) => {
    e.preventDefault();
    if (!manualIp.trim()) return;
    const limit = parseInt(manualLimit, 10);
    if (isNaN(limit) || limit < 1) {
      showNotification("Please enter a valid limit", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${activeApiUrl}/api/admin/ai-limits/update`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ ip: manualIp.trim(), newLimit: limit })
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`Custom rule added for IP ${manualIp.trim()} with limit ${limit}`);
        setManualIp('');
        setShowAddModal(false);
        fetchAiLimits();
      }
    } catch (err) {
      showNotification("Failed to add custom rule", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered IPs list
  const filteredIps = useMemo(() => {
    const list = aiLimitsData.ips || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(item => 
      item.ip.toLowerCase().includes(q) ||
      (item.browser && item.browser.toLowerCase().includes(q)) ||
      (item.os && item.os.toLowerCase().includes(q))
    );
  }, [aiLimitsData.ips, searchQuery]);

  // AI Usage Statistics
  const aiStats = useMemo(() => {
    const list = aiLimitsData.ips || [];
    const totalMessages = list.reduce((sum, item) => sum + (item.usedCount || 0), 0);
    const limitReachedCount = list.filter(item => item.isLimitReached).length;
    const customLimitCount = list.filter(item => item.hasCustomLimit).length;
    return { totalMessages, limitReachedCount, customLimitCount };
  }, [aiLimitsData.ips]);

  // Data processing for analytics charts
  const metrics = useMemo(() => {
    const usage = stats.usage || [];
    const totalRuns = usage.length;
    const uniqueIps = new Set(usage.map(u => u.ip)).size;

    const successes = usage.filter(u => u.status === 'success').length;
    const successRate = totalRuns > 0 ? Math.round((successes / totalRuns) * 100) : 0;

    // Language Distribution
    const langCounts = usage.reduce((acc, curr) => {
      const lang = curr.language && curr.language !== 'unknown' ? curr.language : 'Other';
      acc[lang] = (acc[lang] || 0) + 1;
      return acc;
    }, {});
    const langData = Object.keys(langCounts).map(key => ({ name: key, value: langCounts[key] }));

    // Feature Usage (Endpoints)
    const endpointMapping = {
      '/run': 'Code Execution',
      '/run-tests': 'Run Tests',
      '/analyze': 'Time/Space Analysis',
      '/ai-review': 'AI Tutor Chat',
      '/explain-error': 'Explain Error'
    };
    const featureCounts = usage.reduce((acc, curr) => {
      const featureName = endpointMapping[curr.endpoint] || curr.endpoint;
      acc[featureName] = (acc[featureName] || 0) + 1;
      return acc;
    }, {});
    const featureData = Object.keys(featureCounts).map(key => ({ name: key, value: featureCounts[key] })).sort((a, b) => b.value - a.value);

    // Browser Distribution
    const browserCounts = usage.reduce((acc, curr) => {
      const browser = curr.browser || 'Unknown';
      acc[browser] = (acc[browser] || 0) + 1;
      return acc;
    }, {});
    const browserData = Object.keys(browserCounts).map(key => ({ name: key, value: browserCounts[key] })).sort((a, b) => b.value - a.value);

    // Status (Success vs Error)
    const statusData = [
      { name: 'Success', value: successes },
      { name: 'Error', value: totalRuns - successes }
    ];

    return { totalRuns, uniqueIps, successRate, langData, featureData, browserData, statusData };
  }, [stats]);

  const cardClass = `p-5 sm:p-6 rounded-2xl shadow-lg border flex flex-col justify-center ${
    isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'
  }`;

  // IF NOT AUTHENTICATED -> SHOW PASSWORD SCREEN
  if (!isAuthenticated) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-full p-4 ${
        isDark ? 'text-slate-200 bg-slate-900' : 'text-slate-800 bg-slate-50'
      }`}>
        <div className="w-full max-w-md">
          {/* Return button */}
          <button
            onClick={() => window.location.hash = ''}
            className={`mb-6 p-2 rounded-xl transition-all cursor-pointer flex items-center space-x-2 text-xs font-semibold ${
              isDark ? 'hover:bg-slate-800 bg-slate-800/60 border border-slate-700 text-slate-300' : 'hover:bg-slate-200 bg-slate-100 border border-slate-200 text-slate-700'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Editor</span>
          </button>

          {/* Password Login Card */}
          <div className={`p-8 rounded-3xl border shadow-2xl ${
            isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200'
          }`}>
            <div className="flex flex-col items-center text-center mb-6">
              <div className="p-3.5 bg-blue-500/20 text-blue-400 rounded-2xl mb-3 shadow-inner">
                <Lock className="w-8 h-8 text-blue-500" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Admin Authentication</h2>
              <p className={`text-xs sm:text-sm mt-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Enter admin password to access system analytics and AI limit management.
              </p>
            </div>

            {loginError && (
              <div className={`mb-4 p-3 rounded-xl border flex items-center space-x-2 text-xs ${
                isDark ? 'bg-red-950/80 border-red-800 text-red-300' : 'bg-red-50 border-red-300 text-red-800'
              }`}>
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">
                  Admin Password
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3.5 top-3 opacity-50" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border outline-none transition-all ${
                      isDark 
                        ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500' 
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500'
                    }`}
                    autoFocus
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Unlock Dashboard</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // AUTHENTICATED ADMIN DASHBOARD
  return (
    <div className={`flex flex-col h-full w-full p-4 sm:p-8 overflow-y-auto custom-scrollbar ${
      isDark ? 'text-slate-200' : 'text-slate-800'
    }`}>
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.location.hash = ''}
            className={`p-2.5 rounded-xl transition-all cursor-pointer ${
              isDark ? 'hover:bg-slate-800 bg-slate-800/60 border border-slate-700' : 'hover:bg-slate-200 bg-slate-100 border border-slate-200'
            }`}
            title="Return to Editor"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Admin & Analytics Control</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Authenticated
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Monitor usage, compiler performance & manage IP-based AI limits
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher & Logout Button */}
        <div className="flex items-center space-x-2">
          <div className={`flex p-1 rounded-xl border ${
            isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setActiveTab('limits')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'limits'
                  ? 'bg-blue-600 text-white shadow-md'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>AI Limits & Users ({aiLimitsData.totalTrackedIps})</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-blue-600 text-white shadow-md'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Analytics & Charts</span>
            </button>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              isDark ? 'bg-slate-800/80 hover:bg-red-950/60 border-slate-700 text-slate-300 hover:text-red-400 hover:border-red-800' : 'bg-white hover:bg-red-50 border-slate-200 text-slate-700 hover:text-red-600 hover:border-red-200'
            }`}
            title="Lock & Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating Action / Toast Notification */}
      {actionMessage && (
        <div className={`mb-6 p-3.5 rounded-xl border flex items-center justify-between text-sm shadow-md animate-fade-in ${
          actionMessage.type === 'error'
            ? isDark ? 'bg-red-950/80 border-red-800 text-red-300' : 'bg-red-50 border-red-300 text-red-800'
            : isDark ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-800'
        }`}>
          <div className="flex items-center space-x-2">
            {actionMessage.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            ) : (
              <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
        </div>
      )}

      {/* TAB 1: AI RATE LIMITS & IP CONTROLS */}
      {activeTab === 'limits' && (
        <div className="space-y-6">
          {/* AI KPI Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Global Default Limit */}
            <div className={cardClass}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Global Default Limit
                  </p>
                  <h2 className="text-3xl font-bold mt-1 text-blue-500">{aiLimitsData.defaultLimit} <span className="text-sm font-normal opacity-70">msgs / IP</span></h2>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-400">
                  <Sliders className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Total AI Messages Sent */}
            <div className={cardClass}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Total AI Messages
                  </p>
                  <h2 className="text-3xl font-bold mt-1 text-purple-500">{aiStats.totalMessages}</h2>
                </div>
                <div className="p-3 bg-purple-500/20 rounded-2xl text-purple-400">
                  <Sparkles className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Active AI Users / IPs */}
            <div className={cardClass}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Tracked IPs
                  </p>
                  <h2 className="text-3xl font-bold mt-1 text-cyan-500">{aiLimitsData.totalTrackedIps}</h2>
                </div>
                <div className="p-3 bg-cyan-500/20 rounded-2xl text-cyan-400">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* IPs at Limit */}
            <div className={cardClass}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Users At Limit
                  </p>
                  <h2 className={`text-3xl font-bold mt-1 ${aiStats.limitReachedCount > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {aiStats.limitReachedCount}
                  </h2>
                </div>
                <div className={`p-3 rounded-2xl ${
                  aiStats.limitReachedCount > 0 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Global Limit Configuration Card */}
          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'} shadow-lg`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold flex items-center space-x-2">
                  <Sliders className="w-5 h-5 text-blue-500" />
                  <span>Configure Global AI Message Limit</span>
                </h3>
                <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  This is the default message allowance applied to every user/IP unless an admin sets a custom limit.
                </p>
              </div>

              <form onSubmit={handleUpdateGlobalLimit} className="flex items-center space-x-3">
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={globalLimitInput}
                    onChange={(e) => setGlobalLimitInput(e.target.value)}
                    className={`w-28 px-3 py-2 text-sm font-semibold rounded-xl border outline-none text-center ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                  />
                  <span className="absolute right-2.5 top-2.5 text-xs opacity-50 font-medium pointer-events-none">msgs</span>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center space-x-1.5 shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Global Limit</span>
                </button>
              </form>
            </div>
          </div>

          {/* IP Limits Table Section */}
          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'} shadow-lg`}>
            {/* Table Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-lg font-bold flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  <span>Tracked IPs & Custom Limit Management</span>
                </h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Monitor individual user message counts and increase limits or reset counts per IP.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 opacity-50" />
                  <input
                    type="text"
                    placeholder="Search IP, browser, OS..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-xl border outline-none w-48 sm:w-64 ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>

                <button
                  onClick={fetchAiLimits}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    isDark ? 'hover:bg-slate-700 border-slate-700 text-slate-300' : 'hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                  title="Refresh Table"
                >
                  <RefreshCw className={`w-4 h-4 ${limitsLoading ? 'animate-spin' : ''}`} />
                </button>

                {/* Add Custom IP Override Button */}
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all flex items-center space-x-1.5 shadow cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add IP Rule</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className={`border-b text-xs uppercase tracking-wider font-semibold ${
                    isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'
                  }`}>
                    <th className="pb-3 px-3">IP Address</th>
                    <th className="pb-3 px-3">Device / Browser</th>
                    <th className="pb-3 px-3">Usage / Limit</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3">Last Active</th>
                    <th className="pb-3 px-3 text-right">Actions (Increase Limit / Reset)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60 font-medium">
                  {filteredIps.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">
                        {searchQuery ? "No IP matches your search filter." : "No AI message requests recorded yet."}
                      </td>
                    </tr>
                  ) : (
                    filteredIps.map((row) => {
                      const percent = Math.min(100, Math.round(((row.usedCount || 0) / (row.effectiveLimit || 5)) * 100));
                      const isOver = row.isLimitReached;
                      const isEditing = editingIp === row.ip;

                      return (
                        <tr key={row.ip} className={`transition-colors ${
                          isDark ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'
                        }`}>
                          {/* IP Address */}
                          <td className="py-3.5 px-3">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-sm">{row.ip}</span>
                              {row.ip === '127.0.0.1' && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                  isDark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  Localhost
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Device / Browser */}
                          <td className="py-3.5 px-3">
                            <div className="flex flex-col text-xs">
                              <span className="font-medium">{row.browser || 'Unknown Browser'}</span>
                              <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{row.os || 'Unknown OS'}</span>
                            </div>
                          </td>

                          {/* Usage / Limit Progress */}
                          <td className="py-3.5 px-3 min-w-[160px]">
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs font-mono font-semibold">
                                <span className={isOver ? 'text-red-500 font-bold' : ''}>
                                  {row.usedCount} / {row.effectiveLimit}
                                </span>
                                <span className={`text-[11px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                  {row.remaining} left
                                </span>
                              </div>
                              <div className={`w-full h-1.5 rounded-full overflow-hidden ${
                                isDark ? 'bg-slate-700' : 'bg-slate-200'
                              }`}>
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isOver ? 'bg-red-500' : percent > 75 ? 'bg-amber-500' : 'bg-blue-500'
                                  }`} 
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="py-3.5 px-3">
                            {isOver ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center space-x-1 w-fit">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                                <span>Limit Reached</span>
                              </span>
                            ) : row.hasCustomLimit ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center space-x-1 w-fit">
                                <Zap className="w-3 h-3 text-purple-400" />
                                <span>Custom ({row.customLimit})</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1 w-fit">
                                <CheckCircle className="w-3 h-3 text-emerald-400" />
                                <span>Active</span>
                              </span>
                            )}
                          </td>

                          {/* Last Active Timestamp */}
                          <td className="py-3.5 px-3 text-xs text-slate-400">
                            {row.lastUsed ? new Date(row.lastUsed).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Never'}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-3 text-right">
                            {isEditing ? (
                              <div className="flex items-center justify-end space-x-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  max="10000"
                                  placeholder="Limit"
                                  value={customLimitInput}
                                  onChange={(e) => setCustomLimitInput(e.target.value)}
                                  className={`w-16 px-2 py-1 text-xs rounded-lg border outline-none text-center ${
                                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                                  }`}
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleSaveCustomLimit(row.ip)}
                                  className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                                  title="Save Limit"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => { setEditingIp(null); setCustomLimitInput(''); }}
                                  className="p-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                                  title="Cancel"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end space-x-1.5 flex-wrap gap-y-1">
                                {/* +5 Quick Boost Button */}
                                <button
                                  onClick={() => handleQuickBoost(row.ip, row.effectiveLimit)}
                                  disabled={isSubmitting}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all cursor-pointer shadow-sm ${
                                    isDark ? 'bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40' : 'bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-200'
                                  }`}
                                  title="Add +5 messages to limit"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>+5 Boost</span>
                                </button>

                                {/* Edit Custom Limit */}
                                <button
                                  onClick={() => { setEditingIp(row.ip); setCustomLimitInput(String(row.effectiveLimit)); }}
                                  className={`px-2 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                                    isDark ? 'bg-slate-700/60 hover:bg-slate-700 text-slate-200 border-slate-600' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                                  }`}
                                  title="Set specific limit"
                                >
                                  Set Limit
                                </button>

                                {/* Reset Usage Count to 0 */}
                                <button
                                  onClick={() => handleResetUsage(row.ip)}
                                  disabled={isSubmitting}
                                  className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer border ${
                                    isDark ? 'hover:bg-amber-950/60 text-amber-400 border-amber-900/60' : 'hover:bg-amber-50 text-amber-600 border-amber-200'
                                  }`}
                                  title="Reset used count to 0"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>

                                {/* Revert to Global Default if custom */}
                                {row.hasCustomLimit && (
                                  <button
                                    onClick={() => handleRemoveCustomLimit(row.ip)}
                                    disabled={isSubmitting}
                                    className={`px-1.5 py-1 rounded-lg text-[10px] transition-all cursor-pointer ${
                                      isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                    title="Revert to global default"
                                  >
                                    Revert
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ANALYTICS & EXECUTION CHARTS */}
      {activeTab === 'analytics' && (
        <>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Activity className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : (
            <>
              {/* Top Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <div className={cardClass}>
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-500/20 rounded-xl text-blue-500">
                      <Activity className="w-6 h-6" />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Code Executions</p>
                      <h2 className="text-3xl font-bold">{metrics.totalRuns}</h2>
                    </div>
                  </div>
                </div>

                <div className={cardClass}>
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-cyan-500/20 rounded-xl text-cyan-500">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Unique IPs Active</p>
                      <h2 className="text-3xl font-bold">{metrics.uniqueIps}</h2>
                    </div>
                  </div>
                </div>

                <div className={cardClass}>
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-green-500/20 rounded-xl text-green-500">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Success Rate</p>
                      <h2 className="text-3xl font-bold">{metrics.successRate}%</h2>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Feature Usage Bar Chart */}
                <div className={cardClass}>
                  <h3 className="text-lg font-bold mb-6">Feature Popularity</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metrics.featureData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#94a3b8' : '#64748b' }} />
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: '8px', border: 'none', color: isDark ? '#fff' : '#000' }}
                          itemStyle={{ color: '#3b82f6' }}
                        />
                        <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Language Distribution Pie Chart */}
                <div className={cardClass}>
                  <h3 className="text-lg font-bold mb-6">Language Distribution</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={metrics.langData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {metrics.langData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: '8px', border: 'none' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Success vs Error Donut Chart */}
                <div className={cardClass}>
                  <h3 className="text-lg font-bold mb-6">Execution Status</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={metrics.statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {metrics.statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: '8px', border: 'none' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Browser Usage List */}
                <div className={cardClass}>
                  <h3 className="text-lg font-bold mb-6 flex items-center space-x-2">
                    <Monitor className="w-5 h-5 text-blue-500" />
                    <span>Top Browsers</span>
                  </h3>
                  <div className="flex-1 overflow-y-auto pr-2">
                    {metrics.browserData.length > 0 ? metrics.browserData.map((browser, idx) => (
                      <div key={idx} className={`flex justify-between items-center p-3 mb-2 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                        <span className="font-medium">{browser.name}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                          {browser.value} hits
                        </span>
                      </div>
                    )) : (
                      <div className="text-center text-slate-500 mt-10">No data available</div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Modal: Add Manual IP Rule */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl ${
            isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="text-lg font-bold mb-2 flex items-center space-x-2">
              <Plus className="w-5 h-5 text-blue-500" />
              <span>Add Custom IP Limit Rule</span>
            </h3>
            <p className={`text-xs mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Assign a custom message limit for a specific IP address before or after they connect.
            </p>

            <form onSubmit={handleAddManualIp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase mb-1">IP Address</label>
                <input
                  type="text"
                  placeholder="e.g. 192.168.1.100 or 127.0.0.1"
                  value={manualIp}
                  onChange={(e) => setManualIp(e.target.value)}
                  className={`w-full px-3 py-2 text-sm rounded-xl border outline-none ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase mb-1">Custom Message Limit</label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  placeholder="e.g. 20"
                  value={manualLimit}
                  onChange={(e) => setManualLimit(e.target.value)}
                  className={`w-full px-3 py-2 text-sm rounded-xl border outline-none ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                    isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow cursor-pointer disabled:opacity-50"
                >
                  Create Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
