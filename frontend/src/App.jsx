import React, { useState } from 'react';
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
  Zap,
  Activity,
  Download // 1. Import the Download icon
} from 'lucide-react';
import Editor from '@monaco-editor/react';

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
  const [language, setLanguage] = useState('cpp');
  const [code, setCode] = useState(defaultTemplates['cpp']);
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

  const isDark = theme === 'dark';

  const handleSubmit = async () => {
    setIsRunning(true);
    setOutput('');
    setComplexity('');
    setExecutionTime(null);
    setActiveTab('output');
    const payload = { language, code, input };

    try {
      const startTime = Date.now();
      const response = await fetch('https://compileverse-backend.onrender.com/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      const endTime = Date.now();
      setExecutionTime(endTime - startTime);

      if (response.ok) {
        setOutput(data.output);
        if (data.complexity) setComplexity(data.complexity);
      } else {
        setOutput("Error: " + (data.error || 'Compilation failed'));
      }
    } catch (error) {
      setOutput("Error: " + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleAiReview = async () => {
    setIsReviewing(true);
    setAiReview('');
    setActiveTab('review');
    try {
      const response = await fetch('https://compileverse-backend.onrender.com/ai-review', {
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
    <div className={`min-h-screen w-full transition-all duration-300 ${isDark
      ? 'bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900'
      : 'bg-gradient-to-br from-blue-50 via-purple-50/30 to-pink-50/20'
      }`}>

      <div className="relative z-10 flex min-h-screen flex-col p-2 sm:p-4">
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
        <main className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">

          <section className="w-full lg:w-7/12 flex flex-col">
            <div className={`h-full flex flex-col rounded-xl p-2 sm:p-4 shadow-lg border ${isDark
              ? 'bg-gray-900/80 border-purple-500/30 shadow-purple-500/20'
              : 'bg-white/90 border-gray-200 shadow-gray-300/30'
              }`}>

              <div className="flex justify-between items-center mb-3 flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r ${currentLang.color} text-white`}>
                    {currentLang.name}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    value={language}
                    onChange={(e) => {
                      const selectedLang = e.target.value;
                      setLanguage(selectedLang);
                      setCode(defaultTemplates[selectedLang]);
                      setOutput(''); setComplexity(''); setAiReview(''); setExecutionTime(null);
                    }}
                    className={`px-3 py-2 rounded-lg border font-medium cursor-pointer text-sm sm:text-base ${isDark
                      ? 'bg-gray-800 text-white border-purple-500/30'
                      : 'bg-white text-gray-900 border-gray-300'
                      }`}
                  >
                    {Object.entries(languageConfig).map(([key, config]) => (
                      <option key={key} value={key}>{config.name}</option>
                    ))}
                  </select>

                  {/* 3. Add the Download button to the UI */}
                  <button
                    onClick={handleDownload}
                    title="Download code"
                    className={`p-2 rounded-lg cursor-pointer transition-all ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={copyToClipboard}
                    title="Copy code"
                    className={`p-2 rounded-lg cursor-pointer transition-all ${copied ? 'bg-green-500 text-white' : isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                      }`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className={`rounded-lg overflow-hidden border h-96 md:h-[32rem] lg:flex-1 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <Editor
                  height="100%"
                  language={currentLang.monaco}
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  theme={isDark ? 'vs-dark' : 'light'}
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
            </div>
          </section>

          <aside className="w-full lg:w-5/12 flex flex-col space-y-4">
            <div className={`rounded-xl p-4 shadow-lg border flex-shrink-0 ${isDark ? 'bg-gray-900/80 border-gray-700' : 'bg-white/90 border-gray-200'
              }`}>
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Terminal className="w-4 h-4 text-cyan-500" />
                  <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Input</h3>
                </div>
                <textarea
                  className={`w-full h-20 p-3 text-sm rounded-lg border resize-none ${isDark ? 'bg-gray-800 text-white border-gray-600' : 'bg-gray-50 text-gray-900 border-gray-300'
                    }`}
                  placeholder="Enter program input here..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={isRunning}
                  className={`flex items-center justify-center cursor-pointer space-x-2 py-3 px-4 rounded-lg font-bold text-white transition-all transform hover:scale-105 ${isRunning ? 'bg-gray-500 cursor-not-allowed scale-100' : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/25'
                    }`}
                >
                  {isRunning ? <><div className="w-4 h-4 border-2  border-white border-t-transparent rounded-full animate-spin"></div><span>Running</span></>
                    : <><Play className="w-4 h-4" /><span>Run</span></>}
                </button>

                <button
                  onClick={handleAiReview}
                  disabled={isReviewing}
                  className={`flex items-center justify-center cursor-pointer space-x-2 py-3 px-4 rounded-lg font-bold text-white transition-all transform hover:scale-105 ${isReviewing ? 'bg-gray-500 cursor-not-allowed scale-100' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25'
                    }`}
                >
                  {isReviewing ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>Reviewing</span></>
                    : <><Bot className="w-4 h-4" /><span>Review</span></>}
                </button>
              </div>
            </div>

            <div className={`flex-1 flex flex-col rounded-xl shadow-lg border ${isDark ? 'bg-gray-900/80 border-gray-700' : 'bg-white/90 border-gray-200'
              }`}>
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

              <div className="p-2 sm:p-4 flex-1 overflow-y-auto min-h-[20rem]">
                {activeTab === 'output' && (
                  <div>
                    {output ? (
                      <div className={`p-3 rounded-lg border-l-4 ${output.startsWith("Error") ? (isDark ? 'bg-red-900/20 border-red-500' : 'bg-red-50 border-red-500') : (isDark ? 'bg-green-900/20 border-green-500' : 'bg-green-50 border-green-500')}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className={`font-bold text-sm ${output.startsWith("Error") ? 'text-red-500' : 'text-green-500'}`}>{output.startsWith("Error") ? 'Error' : 'Output'}</h4>
                          {executionTime && !output.startsWith("Error") && (
                            <div className="flex items-center space-x-1"><Activity className="w-3 h-3 text-green-500" /><span className="text-xs text-green-500 font-mono">{executionTime}ms</span></div>
                          )}
                        </div>
                        <pre className={`text-sm whitespace-pre-wrap font-mono ${output.startsWith("Error") ? (isDark ? 'text-red-400' : 'text-red-700') : (isDark ? 'text-green-400' : 'text-green-700')}`}>{output}</pre>
                      </div>
                    ) : (
                      <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        <Terminal className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="font-medium">No output yet</p><p className="text-sm">Run your code to see results</p>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === 'complexity' && (
                  <div>
                    {complexity ? (
                      <div className={`p-3 rounded-lg border-l-4 ${isDark ? 'bg-indigo-900/20 border-indigo-500' : 'bg-indigo-50 border-indigo-500'}`}>
                        <h4 className="font-bold text-sm text-indigo-500 mb-2">Complexity Analysis</h4>
                        <pre className={`text-sm whitespace-pre-wrap font-mono ${isDark ? 'text-indigo-400' : 'text-indigo-700'}`}>{complexity}</pre>
                      </div>
                    ) : (
                      <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        <Cpu className="w-12 h-12 mx-auto mb-3 opacity-50" /><p className="font-medium">No analysis available</p><p className="text-sm">Run your code to get analysis</p>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === 'review' && (
                  <div>
                    {aiReview ? (
                      <div className="space-y-4">
                        {formatAiReview(aiReview)?.map((section, index) => (
                          <div key={index} className={`p-4 rounded-lg ${isDark ? 'bg-gray-800/60' : 'bg-gray-50/90'}`}>
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
        </main>
      </div>
    </div>
  );
}

export default SimpleCompiler;