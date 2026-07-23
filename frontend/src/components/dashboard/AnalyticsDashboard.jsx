import React, { useState, useEffect, useMemo } from 'react';
import { Activity, Users, ArrowLeft, CheckCircle, Monitor, LayoutDashboard } from 'lucide-react';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  Legend,
  AreaChart, Area
} from 'recharts';

const COLORS = ['#3b82f6', '#06b6d4', '#6366f1', '#ec4899', '#8b5cf6'];
const DONUT_COLORS = ['#22c55e', '#ef4444'];

export const AnalyticsDashboard = ({ isDark, activeApiUrl }) => {
  const [stats, setStats] = useState({ usage: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${activeApiUrl}/stats`);
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
    
    // Auto refresh every 10 seconds
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [activeApiUrl]);

  // Data processing for charts
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
      '/ai-review': 'AI Chat',
      '/explain-error': 'Explain Error'
    };
    const featureCounts = usage.reduce((acc, curr) => {
      const featureName = endpointMapping[curr.endpoint] || curr.endpoint;
      acc[featureName] = (acc[featureName] || 0) + 1;
      return acc;
    }, {});
    const featureData = Object.keys(featureCounts).map(key => ({ name: key, value: featureCounts[key] })).sort((a,b) => b.value - a.value);

    // Browser Distribution
    const browserCounts = usage.reduce((acc, curr) => {
      const browser = curr.browser || 'Unknown';
      acc[browser] = (acc[browser] || 0) + 1;
      return acc;
    }, {});
    const browserData = Object.keys(browserCounts).map(key => ({ name: key, value: browserCounts[key] })).sort((a,b) => b.value - a.value);

    // Status (Success vs Error)
    const statusData = [
      { name: 'Success', value: successes },
      { name: 'Error', value: totalRuns - successes }
    ];

    return { totalRuns, uniqueIps, successRate, langData, featureData, browserData, statusData };
  }, [stats]);

  const cardClass = `p-6 rounded-2xl shadow-lg border flex flex-col justify-center ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`;

  return (
    <div className={`flex flex-col h-full w-full p-4 sm:p-8 overflow-y-auto custom-scrollbar ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
      <div className="flex items-center space-x-4 mb-8">
        <button 
          onClick={() => window.location.hash = ''} 
          className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-slate-800 bg-slate-800/50' : 'hover:bg-slate-200 bg-slate-100'}`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
               <LayoutDashboard className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics Overview</h1>
        </div>
      </div>

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
                  <p className={`text-sm font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Executions</p>
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
                  <p className={`text-sm font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Unique Users (IPs)</p>
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
    </div>
  );
};
