import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Code,
  Terminal,
  Cpu,
  Sun,
  Moon,
  Bot,
  Copy,
  Check,
  Activity,
  Download,
  FlaskConical,
  Plus,
  Trash2,
  AlignLeft
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { customThemes } from './themes';

// --- HELPER FUNCTIONS & CONFIGURATION ---

const defaultTemplates = {
  cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`,
  c: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`,
  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
  py: `print("Hello, World!")`
};

const languageConfig = {
  cpp: { name: 'C++', color: 'from-blue-500 to-cyan-500', monaco: 'cpp', extension: 'cpp' },
  c: { name: 'C', color: 'from-gray-500 to-slate-600', monaco: 'c', extension: 'c' },
  java: { name: 'Java', color: 'from-orange-500 to-red-500', monaco: 'java', extension: 'java' },
  py: { name: 'Python', color: 'from-green-500 to-emerald-500', monaco: 'python', extension: 'py' }
};

const extractCodeBlocks = (text) => {
  if (!text) return [];
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  const codeBlocks = [];
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    codeBlocks.push({
      lang: match[1] || 'plaintext',
      code: match[2].trim(),
      startIndex: match.index,
      endIndex: match.index + match[0].length
    });
  }

  if (codeBlocks.length === 0 && text.trim().length > 0) {
    return [{
      lang: 'plaintext',
      code: text.trim(),
      startIndex: 0,
      endIndex: text.length
    }];
  }

  return codeBlocks;
};

const formatAiReview = (text) => {
  if (!text) return null;
  const codeBlocks = extractCodeBlocks(text);
  return [{
    content: text,
    codeBlocks: codeBlocks
  }];
};


// --- REACT COMPONENTS ---

/**
 * A component to display a code block with proper syntax highlighting using Monaco Editor.
 * This is used for the AI Review section.
 */
const HighlightedCodeBlock = ({ code, lang, isDark }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Dynamically calculate editor height based on code line count
  const lineCount = code.split('\n').length;
  const height = Math.max(80, Math.min(lineCount * 21, 400)); // Min 80px, max 400px

  return (
    <div className={`relative rounded-lg border overflow-hidden my-3 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
      <div className={`flex justify-between items-center px-3 py-2 ${isDark ? 'bg-gray-800 border-b border-gray-600' : 'bg-gray-50 border-b border-gray-200'}`}>
        <span className={`text-xs font-medium font-mono uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{lang || 'Code'}</span>
        <button
          onClick={handleCopy}
          title="Copy code"
          className={`p-1.5 rounded-md transition-all ${copied ? 'bg-green-500 text-white' : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <div style={{ height: `${height}px` }}>
        <Editor
          height="100%"
          language={lang}
          value={code}
          theme={isDark ? 'vs-dark' : 'light'}
          options={{
            readOnly: true,
            fontSize: 13,
            fontFamily: 'JetBrains Mono, Monaco, Consolas, monospace',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            padding: { top: 12, bottom: 12 },
            lineNumbers: 'off',
            renderLineHighlight: 'none',
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            scrollbar: { vertical: 'auto', horizontal: 'auto' },
            overviewRulerBorder: false,
          }}
        />
      </div>
    </div>
  );
};

function SimpleCompiler() {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('selectedLanguage') || 'cpp';
  });
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [input, setInput] = useState('');
  const [aiReview, setAiReview] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [copied, setCopied] = useState(false);
  const [executionTime, setExecutionTime] = useState(null);
  const [complexity, setComplexity] = useState('');
  const [activeTab, setActiveTab] = useState('output');
  const [analyzeComplexity, setAnalyzeComplexity] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [serverStatus, setServerStatus] = useState('waking'); // 'waking', 'online', 'error'

  const [mode, setMode] = useState('custom'); // 'custom' or 'tests'
  const [testCases, setTestCases] = useState([{ input: '', expectedOutput: '' }]);
  const [testResults, setTestResults] = useState(null);

  const [editorTheme, setEditorTheme] = useState('vs-dark');
  const editorRef = useRef(null);

  const [activeApiUrl, setActiveApiUrl] = useState(() => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8000';
    }
    const url = import.meta.env.VITE_FRIEND_API_URL || import.meta.env.VITE_API_URL || 'https://compileverse-backend.onrender.com';
    return url.replace(/\/+$/, '');
  });

  useEffect(() => {
    const findActiveServer = async () => {
      // 1. Local environment check
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          await fetch('http://localhost:8000', { signal: controller.signal });
          clearTimeout(timeoutId);

          setActiveApiUrl('http://localhost:8000');
          setServerStatus('online');
          return; // If local is running, stop here and use it
        } catch {
          console.warn('Local backend is down. Falling back to other servers...');
        }
      }

      // 2. Friend's server check (if configured in .env as VITE_FRIEND_API_URL)
      const friendUrl = import.meta.env.VITE_FRIEND_API_URL;
      if (friendUrl) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          await fetch(friendUrl, { signal: controller.signal });
          clearTimeout(timeoutId);

          setActiveApiUrl(friendUrl.replace(/\/+$/, ''));
          setServerStatus('online');
          return;
        } catch {
          console.warn('Friend server is unreachable. Falling back to Render...');
        }
      }

      // 3. Production server (Render)
      const renderUrl = import.meta.env.VITE_API_URL || 'https://compileverse-backend.onrender.com';
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(renderUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (response.ok) {
          setActiveApiUrl(renderUrl.replace(/\/+$/, ''));
          setServerStatus('online');
          return;
        }
      } catch (err) {
        console.warn(`Render server is unreachable.`);
      }
      
      setActiveApiUrl(renderUrl.replace(/\/+$/, ''));
      setServerStatus('error');
    };

    findActiveServer();
  }, []);

  useEffect(() => {
    setCode(defaultTemplates[language]);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('selectedLanguage', language);
  }, [language]);

  const handleEditorWillMount = (monaco) => {
    Object.keys(customThemes).forEach(themeName => {
      monaco.editor.defineTheme(themeName, customThemes[themeName]);
    });
  };

  const handleBulkImport = () => {
    if (!bulkText.trim()) return;

    const cases = bulkText.split('===').map(tc => tc.trim()).filter(tc => tc);
    const newTestCases = [];

    cases.forEach(tc => {
      const parts = tc.split('---');
      if (parts.length >= 1) {
        newTestCases.push({
          input: parts[0].trim(),
          expectedOutput: (parts[1] || '').trim()
        });
      }
    });

    if (newTestCases.length > 0) {
      setTestCases(newTestCases);
    }
    setShowBulkModal(false);
    setBulkText('');
  };

  const handleFormat = async () => {
    if (['c', 'cpp', 'java', 'py'].includes(language)) {
      try {
        const response = await fetch(`${activeApiUrl}/format`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language, code }),
        });
        const data = await response.json();
        if (response.ok && data.formattedCode) {
          setCode(data.formattedCode);
        } else {
          if (editorRef.current) editorRef.current.getAction('editor.action.formatDocument').run();
        }
      } catch (err) {
        if (editorRef.current) editorRef.current.getAction('editor.action.formatDocument').run();
      }
    } else {
      if (editorRef.current) {
        editorRef.current.getAction('editor.action.formatDocument').run();
      }
    }
  };

  const isDark = theme === 'dark';

  const handleSubmit = async () => {
    setIsRunning(true);
    setOutput('');
    setComplexity('');
    setExecutionTime(null);
    setTestResults(null);
    setActiveTab('output');

    if (analyzeComplexity) {
      setIsAnalyzing(true);
      setComplexity('Analyzing in background...');
    }

    try {
      const startTime = Date.now();

      // 1. Execute Code
      const payload = mode === 'custom'
        ? { language, code, input }
        : { language, code, testCases };

      const endpoint = mode === 'custom' ? '/run' : '/run-tests';

      const runPromise = fetch(`${activeApiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(res => res.json());

      // 2. Analyze Complexity (Background)
      let analyzePromise = null;
      if (analyzeComplexity) {
        analyzePromise = fetch(`${activeApiUrl}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        }).then(res => res.json()).catch(err => ({ complexity: 'Analysis failed' }));
      }

      // Wait for execution
      const data = await runPromise;
      const endTime = Date.now();
      setExecutionTime(endTime - startTime);

      if (mode === 'custom') {
        if (data.output !== undefined) {
          setOutput(data.output);
        } else {
          setOutput("Error: " + (data.error || 'Compilation failed'));
        }
      } else {
        if (data.results !== undefined) {
          setTestResults(data.results);
        } else {
          setOutput("Error: " + (data.error || 'Execution failed'));
        }
      }
      setIsRunning(false);

      // Wait for analysis
      if (analyzePromise) {
        const analyzeData = await analyzePromise;
        setComplexity(analyzeData.complexity || 'Analysis failed');
        setIsAnalyzing(false);
      }

    } catch (error) {
      setOutput("Error: " + error.message);
      setIsRunning(false);
      setIsAnalyzing(false);
      setComplexity('Analysis failed');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isRunning) {
          handleSubmit();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [language, code, input, mode, testCases, isRunning]);

  const handleManualAnalyze = async () => {
    setIsAnalyzing(true);
    setComplexity('Analyzing in background...');
    try {
      const response = await fetch(`${activeApiUrl}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await response.json();
      setComplexity(data.complexity || 'Analysis failed');
    } catch (err) {
      setComplexity('Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAiReview = async () => {
    setIsReviewing(true);
    setAiReview('');
    setActiveTab('review');
    try {
      const response = await fetch(`${activeApiUrl}/ai-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await response.json();
      setAiReview(response.ok ? data.review : 'Error: ' + (data.error || 'Review failed'));
    } catch (error) {
      setAiReview('Error: ' + error.message);
    } finally {
      setIsReviewing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 2. Function to handle downloading the code file
  const handleDownload = () => {
    const langDetails = languageConfig[language];
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `main.${langDetails.extension}`; // e.g., main.cpp
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const currentLang = languageConfig[language];

  return (
    // **SCROLL FIX**: Changed `h-screen` `overflow-hidden` to `min-h-screen`
    // This allows the whole page to scroll if content overflows, especially on smaller screens.
    <div className={`h-screen w-full lg:overflow-hidden transition-all duration-300 ${isDark
      ? 'bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900'
      : 'bg-gradient-to-br from-blue-50 via-purple-50/30 to-pink-50/20'
      }`}>

      <div className="relative z-10 flex h-full flex-col p-2 sm:p-4">
        <header className="flex justify-between items-center mb-4 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src="/icon.png"
                alt="Icon"
                className="w-8 h-8"
              />
              {/* <Zap className="w-4 h-4 text-yellow-400 absolute -top-1 -right-1 animate-pulse" /> */}
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 bg-clip-text text-transparent">
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
              className={`relative w-12 h-6 rounded-full cursor-pointer transition-colors duration-300 ${isDark ? 'bg-purple-600' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${isDark ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
            <Moon className={`w-4 h-4 ${isDark ? 'text-purple-800' : 'text-gray-500'}`} />
          </div>
        </header>

        {/* **RESPONSIVE LAYOUT**: Uses flex-col on mobile and lg:flex-row for larger screens */}
        <main className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 overflow-y-auto lg:overflow-hidden">

          <section className="w-full lg:w-7/12 flex flex-col min-h-0">
            <div className={`flex-1 min-h-0 flex flex-col rounded-xl shadow-lg border overflow-hidden ${isDark
              ? 'bg-gray-900/80 border-purple-500/30 shadow-purple-500/20'
              : 'bg-white/90 border-gray-200 shadow-gray-300/30'
              }`}>

              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center p-2 sm:p-4 border-b flex-shrink-0 gap-3 bg-opacity-50">
                <div className="flex items-center space-x-3">
                  <div className={`px-3 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r ${currentLang.color} text-white`}>
                    {currentLang.name}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={language}
                    onChange={(e) => {
                      const selectedLang = e.target.value;
                      setLanguage(selectedLang);
                      setOutput(''); setComplexity(''); setAiReview(''); setExecutionTime(null); setTestResults(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg border font-medium cursor-pointer text-sm ${isDark
                      ? 'bg-gray-800 text-white border-purple-500/30'
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
                      ? 'bg-gray-800 text-white border-purple-500/30'
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
                    onClick={handleFormat}
                    title="Format code"
                    className={`p-1.5 rounded-lg cursor-pointer transition-all ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                  >
                    <AlignLeft className="w-4 h-4" />
                  </button>

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

              <div className={`flex-1 min-h-[300px] ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <Editor
                  height="100%"
                  language={currentLang.monaco}
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  theme={editorTheme}
                  beforeMount={handleEditorWillMount}
                  onMount={(editor) => { editorRef.current = editor; }}
                  options={{
                    fontSize: 14,
                    fontFamily: 'JetBrains Mono, Monaco, Consolas, monospace',
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    automaticLayout: true,
                    padding: { top: 12, bottom: 12 },
                    lineNumbers: 'on',
                  }}
                />
              </div>

              {/* ACTION FOOTER (Desktop Only >= 1024px) */}
              <div className={`p-3 border-t hidden lg:flex flex-row items-center justify-end gap-3 flex-shrink-0 ${isDark ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center space-x-3 w-auto">
                  <button
                    onClick={() => {
                      if (activeTab === 'custom' || activeTab === 'tests') setActiveTab('output');
                      handleSubmit();
                    }}
                    disabled={isRunning}
                    className={`flex-none flex items-center justify-center cursor-pointer space-x-2 py-2 px-6 rounded-lg font-bold text-white transition-all transform hover:scale-105 ${isRunning ? 'bg-gray-500 cursor-not-allowed scale-100' : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-md shadow-purple-500/25'}`}
                  >
                    {isRunning ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>Running</span></>
                      : <><Play className="w-4 h-4" /><span>Run</span></>}
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('review');
                      handleAiReview();
                    }}
                    disabled={isReviewing}
                    className={`flex-none flex items-center justify-center cursor-pointer space-x-2 py-2 px-6 rounded-lg font-bold text-white transition-all transform hover:scale-105 ${isReviewing ? 'bg-gray-500 cursor-not-allowed scale-100' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-500/25'}`}
                  >
                    {isReviewing ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>Reviewing</span></>
                      : <><Bot className="w-4 h-4" /><span>Review</span></>}
                  </button>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS (Mobile/Tablet Only < 1024px - Moved outside to prevent flexbox clipping bugs) */}
            <div className="flex lg:hidden items-center space-x-3 w-full mt-2 flex-shrink-0">
              <button
                onClick={() => {
                  if (activeTab === 'custom' || activeTab === 'tests') setActiveTab('output');
                  handleSubmit();
                }}
                disabled={isRunning}
                className={`flex-1 flex items-center justify-center cursor-pointer space-x-2 py-3 px-4 sm:px-6 rounded-xl font-bold text-white transition-all transform hover:scale-[1.02] active:scale-95 ${isRunning ? 'bg-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/25'}`}
              >
                {isRunning ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span className="text-sm sm:text-base">Running...</span></>
                  : <><Play className="w-5 h-5 fill-current" /><span className="text-sm sm:text-base">Run Code</span></>}
              </button>

              <button
                onClick={() => {
                  setActiveTab('review');
                  handleAiReview();
                }}
                disabled={isReviewing}
                className={`flex-1 flex items-center justify-center cursor-pointer space-x-2 py-3 px-4 sm:px-6 rounded-xl font-bold text-white transition-all transform hover:scale-[1.02] active:scale-95 ${isReviewing ? 'bg-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25'}`}
              >
                {isReviewing ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span className="text-sm sm:text-base">Reviewing...</span></>
                  : <><Bot className="w-5 h-5" /><span className="text-sm sm:text-base">AI Review</span></>}
              </button>
            </div>
          </section>

          <aside className="w-full lg:w-5/12 flex flex-col space-y-4 min-h-0">
            {/* TOP BOX: Input / Tests */}
            <div className={`flex-[4] flex flex-col min-h-0 rounded-xl p-2 sm:p-3 shadow-lg border ${isDark ? 'bg-gray-900/80 border-gray-700' : 'bg-white/90 border-gray-200'}`}>
              <div className="mb-3">
                <div className={`inline-flex items-center space-x-1 p-1 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <button
                    onClick={() => setMode('custom')}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${mode === 'custom' ? (isDark ? 'bg-gray-700 text-white shadow' : 'bg-white text-gray-900 shadow') : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')}`}
                  >
                    <Terminal className="w-4 h-4" />
                    <span>Custom Input</span>
                  </button>
                  <button
                    onClick={() => setMode('tests')}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${mode === 'tests' ? (isDark ? 'bg-gray-700 text-white shadow' : 'bg-white text-gray-900 shadow') : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')}`}
                  >
                    <FlaskConical className="w-4 h-4" />
                    <span>Test Cases</span>
                  </button>
                </div>
              </div>

              {mode === 'custom' ? (
                <textarea
                  className={`w-full flex-1 min-h-0 p-3 text-sm rounded-lg border resize-none ${isDark ? 'bg-gray-800 text-white border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500' : 'bg-gray-50 text-gray-900 border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'} outline-none transition-all`}
                  placeholder="Enter program input here..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
              ) : (
                <div className="flex flex-col flex-1 min-h-0 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                  {testCases.map((tc, idx) => (
                    <div key={idx} className={`p-3 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-xs font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>TEST CASE {idx + 1}</span>
                        {testCases.length > 1 && (
                          <button
                            onClick={() => setTestCases(testCases.filter((_, i) => i !== idx))}
                            className="text-red-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <textarea
                          className={`w-full h-12 p-2 text-xs rounded border resize-none ${isDark ? 'bg-gray-900 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'} outline-none`}
                          placeholder="Input"
                          value={tc.input}
                          onChange={(e) => {
                            const newTc = [...testCases];
                            newTc[idx].input = e.target.value;
                            setTestCases(newTc);
                          }}
                        />
                        <textarea
                          className={`w-full h-12 p-2 text-xs rounded border resize-none ${isDark ? 'bg-gray-900 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'} outline-none`}
                          placeholder="Expected Output"
                          value={tc.expectedOutput}
                          onChange={(e) => {
                            const newTc = [...testCases];
                            newTc[idx].expectedOutput = e.target.value;
                            setTestCases(newTc);
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setTestCases([...testCases, { input: '', expectedOutput: '' }])}
                      className={`flex-1 flex items-center justify-center space-x-1 py-2 rounded-lg border border-dashed transition-colors ${isDark ? 'border-gray-600 text-gray-400 hover:text-white hover:border-gray-500 hover:bg-gray-800' : 'border-gray-300 text-gray-500 hover:text-gray-800 hover:border-gray-400 hover:bg-gray-100'}`}
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-sm font-semibold">Add Test Case</span>
                    </button>
                    <button
                      onClick={() => setShowBulkModal(true)}
                      className={`flex-1 flex items-center justify-center space-x-1 py-2 rounded-lg border border-dashed transition-colors ${isDark ? 'border-gray-600 text-gray-400 hover:text-white hover:border-gray-500 hover:bg-gray-800' : 'border-gray-300 text-gray-500 hover:text-gray-800 hover:border-gray-400 hover:bg-gray-100'}`}
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-sm font-semibold">Bulk Add</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* BOTTOM BOX: Output / Analysis */}
            <div className={`flex-[6] flex flex-col min-h-0 rounded-xl shadow-lg border ${isDark ? 'bg-gray-900/80 border-gray-700' : 'bg-white/90 border-gray-200'}`}>
              <div className={`flex border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                {[
                  { id: 'output', label: 'Output', icon: Terminal },
                  { id: 'complexity', label: 'Analysis', icon: Cpu },
                  { id: 'review', label: 'AI Review', icon: Bot }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center cursor-pointer justify-center space-x-2 py-3 font-semibold text-sm transition-all border-b-2 ${activeTab === tab.id
                      ? isDark ? 'text-purple-400 border-purple-400 bg-purple-400/10' : 'text-purple-600 border-purple-600 bg-purple-50'
                      : isDark ? 'text-gray-400 border-transparent hover:text-gray-300' : 'text-gray-600 border-transparent hover:text-gray-800'
                      }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="p-2 sm:p-4 flex-1 overflow-y-auto min-h-0">
                {activeTab === 'output' && (
                  <div>
                    {mode === 'custom' && output && (
                      <div className={`p-3 rounded-lg border-l-4 ${output.startsWith("Error") ? (isDark ? 'bg-red-900/20 border-red-500' : 'bg-red-50 border-red-500') : (isDark ? 'bg-green-900/20 border-green-500' : 'bg-green-50 border-green-500')}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className={`font-bold text-sm ${output.startsWith("Error") ? 'text-red-500' : 'text-green-500'}`}>{output.startsWith("Error") ? 'Error' : 'Output'}</h4>
                          {executionTime && !output.startsWith("Error") && (
                            <div className="flex items-center space-x-1"><Activity className="w-3 h-3 text-green-500" /><span className="text-xs text-green-500 font-mono">{executionTime}ms</span></div>
                          )}
                        </div>
                        <pre className={`text-sm whitespace-pre-wrap font-mono ${output.startsWith("Error") ? (isDark ? 'text-red-400' : 'text-red-700') : (isDark ? 'text-green-400' : 'text-green-700')}`}>{output}</pre>
                      </div>
                    )}

                    {mode === 'tests' && testResults && (
                      <div className="space-y-3">
                        {testResults.every(res => res.passed) ? (
                          <div className={`p-4 text-center rounded-lg border-l-4 ${isDark ? 'bg-green-900/20 border-green-500' : 'bg-green-50 border-green-500'}`}>
                            <div className="flex justify-center mb-2"><Check className="w-10 h-10 text-green-500" /></div>
                            <h3 className="text-lg font-bold text-green-500">All {testResults.length} Test Cases Passed!</h3>
                            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Great job, your code is working perfectly.</p>
                          </div>
                        ) : (
                          <>
                            <div className={`p-3 rounded-lg border-l-4 ${isDark ? 'bg-red-900/20 border-red-500' : 'bg-red-50 border-red-500'}`}>
                              <h3 className="font-bold text-red-500 text-sm">
                                {testResults.filter(r => !r.passed).length} out of {testResults.length} test cases failed
                              </h3>
                            </div>
                            {testResults.map((res, idx) => !res.passed && (
                              <div key={idx} className={`p-3 rounded-lg border-l-4 ${isDark ? 'bg-red-900/20 border-red-500' : 'bg-red-50 border-red-500'}`}>
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-bold text-sm text-red-500">Test Case {idx + 1}: FAILED</h4>
                                </div>
                                {res.error ? (
                                  <pre className={`text-sm whitespace-pre-wrap font-mono ${isDark ? 'text-red-400' : 'text-red-700'}`}>{res.error}</pre>
                                ) : (
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <span className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Your Output:</span>
                                      <pre className={`mt-1 text-xs whitespace-pre-wrap font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{res.actualOutput || ' '}</pre>
                                    </div>
                                    <div>
                                      <span className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Expected:</span>
                                      <pre className={`mt-1 text-xs whitespace-pre-wrap font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{res.expectedOutput || ' '}</pre>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    )}

                    {!output && !testResults && (
                      <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        <Terminal className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="font-medium">No output yet</p><p className="text-sm">Run your code to see results</p>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === 'complexity' && (
                  <div>
                    {complexity && complexity !== "Analysis not requested" ? (
                      <div className={`p-3 rounded-lg border-l-4 ${isDark ? 'bg-indigo-900/20 border-indigo-500' : 'bg-indigo-50 border-indigo-500'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-sm text-indigo-500">Complexity Analysis</h4>
                          {isAnalyzing && <Activity className="w-4 h-4 text-indigo-500 animate-pulse" />}
                        </div>
                        <pre className={`text-sm whitespace-pre-wrap font-mono ${isDark ? 'text-indigo-400' : 'text-indigo-700'}`}>{complexity}</pre>
                      </div>
                    ) : (
                      <div className={`text-center py-8 flex flex-col items-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        <Cpu className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="font-medium mb-1">No analysis available</p>
                        <p className="text-sm mb-4">Click below to analyze time & space complexity for this code</p>
                        <button
                          onClick={handleManualAnalyze}
                          disabled={isAnalyzing}
                          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all shadow flex items-center space-x-2 ${isDark ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'} ${isAnalyzing ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                          {isAnalyzing ? (
                            <>
                              <Activity className="w-4 h-4 animate-spin" />
                              <span>Analyzing...</span>
                            </>
                          ) : (
                            <>
                              <Cpu className="w-4 h-4" />
                              <span>Check Time & Space Complexity</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === 'review' && (
                  <div>
                    {aiReview ? (
                      typeof aiReview === 'object' ? (
                        <div className="space-y-4">
                          {aiReview.optimizedCode === "ALREADY_OPTIMIZED" ? (
                            <div className={`p-4 mt-3 rounded-xl border flex items-center space-x-3 ${isDark ? 'bg-green-900/20 border-green-800 text-green-400' : 'bg-green-50 border-green-200 text-green-700'}`}>
                              <Check className="w-5 h-5 flex-shrink-0" />
                              <p className="font-medium text-sm">Your code is already fully optimized! Great job! ✨</p>
                            </div>
                          ) : (
                            <HighlightedCodeBlock code={aiReview.optimizedCode} lang={currentLang.monaco} isDark={isDark} />
                          )}
                          <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
                            <p className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              Time Complexity: <span className="text-purple-500 font-normal">{aiReview.timeComplexity}</span>
                            </p>
                            <p className={`font-semibold mt-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              Space Complexity: <span className="text-pink-500 font-normal">{aiReview.spaceComplexity}</span>
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {formatAiReview(aiReview)?.map((section, index) => (
                            <div key={index} className="py-1">
                              <div className="space-y-3">
                                {(() => {
                                  let lastIndex = 0;
                                  const elements = [];

                                  section.codeBlocks.forEach((codeBlock, blockIndex) => {
                                    const textBefore = section.content.slice(lastIndex, codeBlock.startIndex);
                                    if (textBefore.trim()) {
                                      elements.push(
                                        <div key={`text-${blockIndex}`} className={`text-sm leading-relaxed whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                          {textBefore.trim()}
                                        </div>
                                      );
                                    }
                                    elements.push(
                                      <HighlightedCodeBlock key={`code-${blockIndex}`} code={codeBlock.code} lang={codeBlock.lang} isDark={isDark} />
                                    );
                                    lastIndex = codeBlock.endIndex;
                                  });

                                  const textAfter = section.content.slice(lastIndex);
                                  if (textAfter.trim()) {
                                    elements.push(
                                      <div key="text-final" className={`text-sm leading-relaxed whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        {textAfter.trim()}
                                      </div>
                                    );
                                  }
                                  return elements;
                                })()}
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    ) : (
                      <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" /><p className="font-medium">No AI review yet</p><p className="text-sm">Click "Review" for AI analysis</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </aside>


          {/* BULK ADD MODAL */}
          {showBulkModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className={`w-full max-w-2xl flex flex-col rounded-xl shadow-2xl ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                <div className={`p-4 border-b flex justify-between items-center ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Bulk Import Test Cases</h3>
                  <button onClick={() => setShowBulkModal(false)} className={`p-1 rounded-md ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="p-4 flex flex-col space-y-4">
                  <div className={`text-sm p-3 rounded-lg ${isDark ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
                    <strong>Format Instructions:</strong><br />
                    Use <code>---</code> to separate Input and Expected Output.<br />
                    Use <code>===</code> to separate different Test Cases.<br /><br />
                    <em>Example:</em><br />
                    Input 1<br />
                    ---<br />
                    Output 1<br />
                    ===<br />
                    Input 2<br />
                    ---<br />
                    Output 2
                  </div>
                  <textarea
                    className={`w-full h-64 p-3 font-mono text-sm rounded-lg border resize-none outline-none ${isDark ? 'bg-gray-900 text-gray-300 border-gray-700 focus:border-purple-500' : 'bg-gray-50 text-gray-800 border-gray-300 focus:border-purple-500'}`}
                    placeholder="Paste bulk test cases here..."
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                  />
                </div>
                <div className={`p-4 border-t flex justify-end space-x-3 ${isDark ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'} rounded-b-xl`}>
                  <button onClick={() => setShowBulkModal(false)} className={`px-4 py-2 rounded-lg font-semibold ${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}>Cancel</button>
                  <button onClick={handleBulkImport} className="px-4 py-2 rounded-lg font-semibold bg-purple-600 text-white hover:bg-purple-700">Import</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default SimpleCompiler;