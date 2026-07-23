import React, { useState, useEffect } from 'react';
import { Activity, Globe, Users, Clock, ArrowLeft } from 'lucide-react';

export const AnalyticsDashboard = ({ isDark, activeApiUrl }) => {
  const [stats, setStats] = useState({ usage: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${activeApiUrl}/stats`);
        const data = await res.json();
        // reverse to show newest first
        if (data.usage) {
          data.usage.reverse();
        }
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

  const uniqueIps = new Set(stats.usage.map(u => u.ip)).size;
  const totalRuns = stats.usage.length;

  return (
    <div className={`flex flex-col h-full w-full p-4 sm:p-8 overflow-y-auto custom-scrollbar ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
      <div className="flex items-center space-x-4 mb-8">
        <button 
          onClick={() => window.location.hash = ''} 
          className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
          Analytics Dashboard
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className={`p-6 rounded-xl shadow-lg border flex items-center space-x-4 ${isDark ? 'bg-gray-900/80 border-gray-700' : 'bg-white/90 border-gray-200'}`}>
          <div className="p-3 bg-blue-500/20 rounded-lg text-blue-500">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Unique Users (IPs)</p>
            <h2 className="text-3xl font-bold">{uniqueIps}</h2>
          </div>
        </div>
        
        <div className={`p-6 rounded-xl shadow-lg border flex items-center space-x-4 ${isDark ? 'bg-gray-900/80 border-gray-700' : 'bg-white/90 border-gray-200'}`}>
          <div className="p-3 bg-cyan-500/20 rounded-lg text-cyan-500">
            <Activity className="w-8 h-8" />
          </div>
          <div>
            <p className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Executions</p>
            <h2 className="text-3xl font-bold">{totalRuns}</h2>
          </div>
        </div>
      </div>

      <div className={`flex-1 rounded-xl shadow-lg border overflow-hidden flex flex-col ${isDark ? 'bg-gray-900/80 border-gray-700' : 'bg-white/90 border-gray-200'}`}>
        <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className="text-lg font-bold flex items-center space-x-2">
            <Globe className="w-5 h-5 text-blue-500" />
            <span>Recent Activity</span>
          </h3>
        </div>
        <div className="overflow-x-auto flex-1">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Activity className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className={`text-sm uppercase tracking-wider ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                  <th className="p-4 font-semibold">IP Address</th>
                  <th className="p-4 font-semibold">Location</th>
                  <th className="p-4 font-semibold">Language</th>
                  <th className="p-4 font-semibold">Endpoint</th>
                  <th className="p-4 font-semibold">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/20">
                {stats.usage.map((record, idx) => {
                  const date = new Date(record.timestamp);
                  return (
                    <tr key={idx} className={`transition-colors ${isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}`}>
                      <td className="p-4 font-mono text-sm">{record.ip}</td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <Globe className="w-4 h-4 text-gray-400" />
                          <span>{record.city}, {record.country}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                          {record.language}
                        </span>
                      </td>
                      <td className="p-4 text-sm">{record.endpoint}</td>
                      <td className="p-4 text-sm flex items-center space-x-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{date.toLocaleTimeString()} - {date.toLocaleDateString()}</span>
                      </td>
                    </tr>
                  );
                })}
                {stats.usage.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">
                      No activity recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
