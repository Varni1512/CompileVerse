import React from 'react';
import { Download, Copy, Check } from 'lucide-react';

export const EditorToolbar = ({
  currentLang,
  languageConfig,
  language,
  handleLanguageChange,
  editorTheme,
  setEditorTheme,
  theme,
  setTheme,
  isDark,
  handleDownload,
  copyToClipboard,
  copied
}) => {
  return (
    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center p-2 sm:p-4 border-b flex-shrink-0 gap-3 bg-opacity-50">
      <div className="flex items-center space-x-3">
        <div className={`px-3 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r ${currentLang.color} text-white`}>
          {currentLang.name}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className={`px-3 py-1.5 rounded-lg border font-medium cursor-pointer text-sm ${isDark
            ? 'bg-gray-800 text-white border-blue-500/30'
            : 'bg-white text-gray-900 border-gray-300'
            }`}
        >
          {Object.entries(languageConfig).map(([key, config]) => (
            <option key={key} value={key}>{config.name}</option>
          ))}
        </select>

        <select
          value={editorTheme}
          onChange={(e) => {
            setEditorTheme(e.target.value);
            if (e.target.value !== 'light' && theme !== 'dark') setTheme('dark');
            else if (e.target.value === 'light' && theme !== 'light') setTheme('light');
          }}
          className={`px-3 py-1.5 rounded-lg border font-medium cursor-pointer text-sm hidden sm:block ${isDark
            ? 'bg-gray-800 text-white border-blue-500/30'
            : 'bg-white text-gray-900 border-gray-300'
            }`}
        >
          <option value="vs-dark">Dark</option>
          <option value="dracula">Dracula</option>
          <option value="monokai">Monokai</option>
          <option value="githubDark">GitHub Dark</option>
          <option value="light">Light</option>
        </select>

        <button
          onClick={handleDownload}
          title="Download code"
          className={`p-1.5 rounded-lg cursor-pointer transition-all hidden sm:block ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
        >
          <Download className="w-4 h-4" />
        </button>

        <button
          onClick={copyToClipboard}
          title="Copy code"
          className={`p-1.5 rounded-lg cursor-pointer transition-all ${copied ? 'bg-green-500 text-white' : isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
