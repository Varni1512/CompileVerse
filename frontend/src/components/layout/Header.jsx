import React from 'react';
import { Sun, Moon } from 'lucide-react';

export const Header = ({ serverStatus, theme, setTheme, isDark }) => {
  return (
    <header className="flex justify-between items-center mb-4 flex-shrink-0">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <img src="/icon.png" alt="Icon" className="w-8 h-8" />
        </div>
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              CompileVerse
            </span>
          </h1>
          <div className="flex items-center space-x-2 mt-1">
            {serverStatus === 'waking' && (
              <span className={`text-xs px-2 py-0.5 rounded-full flex items-center ${isDark ? 'bg-yellow-900/50 text-yellow-400' : 'bg-yellow-100 text-yellow-700'}`}>
                <span className="inline-block w-2 h-2 mr-1.5 bg-yellow-400 rounded-full animate-pulse"></span>
                Waking up backend... (~50s on first load)
              </span>
            )}
            {serverStatus === 'online' && (
              <span className={`text-xs px-2 py-0.5 rounded-full flex items-center ${isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700'}`}>
                <span className="inline-block w-2 h-2 mr-1.5 bg-green-400 rounded-full"></span>
                Server Online
              </span>
            )}
            {serverStatus === 'error' && (
              <span className={`text-xs px-2 py-0.5 rounded-full flex items-center ${isDark ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-700'}`}>
                <span className="inline-block w-2 h-2 mr-1.5 bg-red-400 rounded-full"></span>
                Server Error
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3">
        <Sun className={`w-4 h-4 ${!isDark ? 'text-yellow-500' : 'text-gray-500'}`} />
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className={`relative w-12 h-6 rounded-full cursor-pointer transition-colors duration-300 ${isDark ? 'bg-blue-600' : 'bg-gray-300'}`}
        >
          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${isDark ? 'translate-x-6' : 'translate-x-0'}`}></div>
        </button>
        <Moon className={`w-4 h-4 ${isDark ? 'text-blue-800' : 'text-gray-500'}`} />
      </div>
    </header>
  );
};
