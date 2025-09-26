import React, { useState, useEffect } from 'react';
import { Play, Zap, Code, Terminal, Cpu, Settings, Sun, Moon, Bot, FileText, Copy, Check } from 'lucide-react';
import Editor from '@monaco-editor/react';


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
  cpp: { name: 'C++', color: 'from-blue-500 to-cyan-500', monaco: 'cpp' },
  c: { name: 'C', color: 'from-gray-500 to-slate-600', monaco: 'c' },
  java: { name: 'Java', color: 'from-orange-500 to-red-500', monaco: 'java' },
  py: { name: 'Python', color: 'from-green-500 to-emerald-500', monaco: 'python' }
};

// Function to clean markdown formatting from text
const cleanMarkdownText = (text) => {
  if (!text) return '';
  
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/#{1,6}\s*/g, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .trim();
};

// Function to detect and extract code blocks
const extractCodeBlocks = (text) => {
  const codeBlockRegex = /```[\w]*\n?([\s\S]*?)```/g;
  const codeBlocks = [];
  let match;
  
  while ((match = codeBlockRegex.exec(text)) !== null) {
    codeBlocks.push({
      fullMatch: match[0],
      code: match[1].trim(),
      startIndex: match.index,
      endIndex: match.index + match[0].length
    });
  }
  
  return codeBlocks;
};

// Function to format AI Review with colored headings and code formatting
const formatAiReview = (text, isDark, language) => {
  if (!text) return null;

  // Split by question numbers (1. or 2.)
  const sections = text.split(/(?=\d+\.\s)/);
  const colors = [
    { bg: 'bg-purple-500', text: 'text-purple-500', name: 'purple' },
    { bg: 'bg-emerald-500', text: 'text-emerald-500', name: 'emerald' }
  ];

  const formattedSections = [];

  sections.forEach((section, index) => {
    if (!section.trim()) return;

    const questionMatch = section.match(/^(\d+)\.\s*(.*)/s);
    if (questionMatch) {
      const questionNumber = parseInt(questionMatch[1]);
      const content = questionMatch[2];
      const colorIndex = (questionNumber - 1) % colors.length;
      
      // Extract code blocks from content
      const codeBlocks = extractCodeBlocks(content);
      
      formattedSections.push({
        number: questionNumber,
        content: content,
        color: colors[colorIndex],
        codeBlocks: codeBlocks,
        hasCodeBlocks: codeBlocks.length > 0
      });
    }
  });

  if (formattedSections.length === 0) {
    // Fallback if no numbered questions found
    const codeBlocks = extractCodeBlocks(text);
    formattedSections.push({
      number: 1,
      content: text,
      color: colors[0],
      codeBlocks: codeBlocks,
      isOptimizedCode: true
    });
  }

  return formattedSections;
};

// Code Block Component with copy functionality
const CodeBlock = ({ code, language, isDark, onCopy, copied }) => {
  const [localCopied, setLocalCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setLocalCopied(true);
    setTimeout(() => setLocalCopied(false), 2000);
    if (onCopy) onCopy();
  };

  return (
    <div className={`relative rounded-lg overflow-hidden border ${
      isDark ? 'border-gray-700 bg-gray-950' : 'border-gray-300 bg-gray-50'
    }`}>
      <div className={`flex items-center justify-between px-3 py-2 border-b ${
        isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-100'
      }`}>
        <div className="flex items-center space-x-2">
          <Code className="w-4 h-4 text-blue-500" />
          <span className={`text-xs font-medium ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {languageConfig[language]?.name || 'Code'}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs transition-all duration-200 ${
            isDark 
              ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200' 
              : 'hover:bg-gray-200 text-gray-600 hover:text-gray-800'
          }`}
        >
          {localCopied ? (
            <>
              <Check className="w-3 h-3 text-green-500" />
              <span className="text-green-500">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="relative">
        <pre className={`p-4 text-xs font-mono overflow-x-auto leading-relaxed ${
          isDark ? 'text-gray-300' : 'text-gray-800'
        }`}>
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

function AdvancedCompiler() {
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

  const isDark = theme === 'dark';

  const handleSubmit = async () => {
    setIsRunning(true);
    setOutput('');
    setComplexity('');
    setExecutionTime(null);
    const payload = { language, code, input };

    try {
      const startTime = Date.now();
      const response = await fetch('http://localhost:8000/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      const endTime = Date.now();
      setExecutionTime(endTime - startTime);

      if (response.ok) {
        setOutput(data.output);
        if (data.complexity) {
          setComplexity(data.complexity);
        }
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
    const payload = { code };

    try {
      const response = await fetch('http://localhost:8000/ai-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setAiReview(data.review); // Keep original formatting for code blocks
      } else {
        setAiReview('Error in AI review: ' + (data.error || 'Review failed'));
      }
    } catch (error) {
      setAiReview('Error in AI review: ' + error.message);
    } finally {
      setIsReviewing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentLang = languageConfig[language];

  return (
    <div className={`h-screen overflow-hidden transition-all duration-500 ${isDark
      ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900'
      : 'bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100'
      }`}>
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-10 ${isDark ? 'bg-purple-500' : 'bg-blue-500'
          } animate-pulse`}></div>
        <div className={`absolute -bottom-20 -left-20 w-48 h-48 rounded-full opacity-10 ${isDark ? 'bg-cyan-500' : 'bg-purple-500'
          } animate-pulse delay-1000`}></div>
      </div>

      <div className="relative z-10 h-full flex flex-col p-4">
        {/* Compact Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Cpu className={`w-8 h-8 ${isDark ? 'text-purple-400' : 'text-purple-600'} animate-spin-slow`} />
              <Zap className="w-4 h-4 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div>
              <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'
                } tracking-tight`}>
                <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 bg-clip-text text-transparent">
                  CompileVerse
                </span>
              </h1>
            </div>
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center space-x-2">
            <Sun className={`w-4 h-4 ${!isDark ? 'text-yellow-500' : 'text-gray-500'}`} />
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${isDark ? 'bg-purple-600' : 'bg-gray-300'
                }`}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${isDark ? 'translate-x-6' : 'translate-x-0'
                }`}></div>
            </button>
            <Moon className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-gray-500'}`} />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
          {/* Code Editor Section - 8 columns */}
          <div className="col-span-8">
            <div className={`h-full backdrop-blur-sm rounded-2xl p-4 shadow-xl border transition-all duration-300 ${isDark
              ? 'bg-gray-900/80 border-purple-500/30 shadow-purple-500/20'
              : 'bg-white/80 border-gray-200 shadow-gray-300/50'
              }`}>
              {/* Editor Header */}
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center space-x-2">
                  <Code className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                  <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Code Editor
                  </h2>
                  <div className={`px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${currentLang.color} text-white`}>
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
                      setOutput('');
                      setComplexity('');
                      setAiReview('');
                      setExecutionTime(null);
                    }}
                    className={`px-3 py-1 text-sm rounded-lg border focus:ring-2 focus:ring-purple-500 transition-all ${isDark
                      ? 'bg-gray-800 text-white border-purple-500/30'
                      : 'bg-white text-gray-900 border-gray-300'
                      }`}
                  >
                    {Object.entries(languageConfig).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={copyToClipboard}
                    className={`p-1.5 rounded-lg transition-all duration-200 ${isDark
                      ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                      }`}
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Code Editor */}
              <div className={`rounded-xl overflow-hidden border ${isDark ? 'border-gray-700' : 'border-gray-200'
                }`} style={{ height: 'calc(100% - 60px)' }}>
                <Editor
                  height="100%"
                  language={currentLang.monaco}
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  theme={isDark ? 'vs-dark' : 'light'}
                  options={{
                    fontSize: 13,
                    fontFamily: 'Fira Code, Monaco, Consolas, monospace',
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    automaticLayout: true,
                    cursorBlinking: 'smooth',
                    cursorSmoothCaretAnimation: true,
                    smoothScrolling: true,
                    padding: { top: 10, bottom: 10 },
                    lineNumbers: 'on',
                    renderLineHighlight: 'all',
                    selectOnLineNumbers: true,
                    roundedSelection: false,
                    readOnly: false,
                    cursorStyle: 'line',
                    folding: true,
                    showFoldingControls: 'mouseover',
                    matchBrackets: 'always',
                    autoIndent: 'full',
                    formatOnType: true,
                    formatOnPaste: true,
                    suggest: {
                      showKeywords: true,
                      showSnippets: true
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Right Panel - 4 columns */}
          <div className="col-span-4 flex flex-col space-y-3 min-h-0">
            {/* Input Section */}
            <div className={`backdrop-blur-sm rounded-xl p-3 shadow-lg border transition-all ${isDark
              ? 'bg-gray-900/80 border-gray-700'
              : 'bg-white/80 border-gray-200'
              }`}>
              <div className="flex items-center space-x-2 mb-2">
                <Terminal className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Input</h3>
              </div>
              <textarea
                className={`w-full h-16 p-2 text-sm rounded-lg border resize-none focus:ring-2 focus:ring-purple-500 transition-all ${isDark
                  ? 'bg-gray-800 text-white border-gray-600'
                  : 'bg-gray-50 text-gray-900 border-gray-300'
                  }`}
                placeholder="Enter program input..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={handleSubmit}
                disabled={isRunning}
                className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm rounded-xl font-bold transition-all duration-300 transform hover:scale-105 ${isRunning
                  ? 'bg-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/25'
                  } text-white`}
              >
                {isRunning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Running...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Run</span>
                  </>
                )}
              </button>

              <button
                onClick={handleAiReview}
                disabled={isReviewing}
                className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm rounded-xl font-bold transition-all duration-300 transform hover:scale-105 ${isReviewing
                  ? 'bg-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/25'
                  } text-white`}
              >
                {isReviewing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>AI...</span>
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4" />
                    <span>Review</span>
                  </>
                )}
              </button>
            </div>

            {/* Results Container */}
            <div className="flex-1 min-h-0 space-y-3 overflow-hidden">
              {/* Output Section */}
              {output && (
                <div className={`backdrop-blur-sm rounded-xl p-3 shadow-lg border transition-all ${output.startsWith("Error")
                  ? isDark
                    ? 'bg-red-900/20 border-red-500/50'
                    : 'bg-red-50/80 border-red-200'
                  : isDark
                    ? 'bg-green-900/20 border-green-500/50'
                    : 'bg-green-50/80 border-green-200'
                  }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full animate-pulse ${output.startsWith("Error") ? 'bg-red-500' : 'bg-green-500'
                        }`}></div>
                      <Terminal className={`w-4 h-4 ${output.startsWith("Error") ? 'text-red-500' : 'text-green-500'
                        }`} />
                      <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {output.startsWith("Error") ? 'Error' : 'Output'}
                      </h3>
                    </div>
                    {executionTime && !output.startsWith("Error") && (
                      <span className="text-xs text-green-500 font-mono bg-green-500/10 px-2 py-1 rounded-md">
                        ⚡ {executionTime}ms
                      </span>
                    )}
                  </div>
                  <div className={`rounded-lg max-h-32 overflow-y-auto ${isDark ? 'bg-gray-950/80' : 'bg-gray-50/80'
                    }`}>
                    <pre className={`font-mono text-xs whitespace-pre-wrap p-3 ${output.startsWith("Error")
                      ? isDark ? 'text-red-400' : 'text-red-700'
                      : isDark ? 'text-green-400' : 'text-green-700'
                      }`}>
                      {output}
                    </pre>
                  </div>
                </div>
              )}

              {/* Complexity Analysis Section */}
              {complexity && (
                <div className={`backdrop-blur-sm rounded-xl p-3 shadow-lg border transition-all ${isDark
                  ? 'bg-indigo-900/20 border-indigo-500/50'
                  : 'bg-indigo-50/80 border-indigo-200'
                  }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <Cpu className="w-4 h-4 text-indigo-500" />
                    <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Complexity
                    </h3>
                  </div>
                  <div className={`rounded-lg max-h-24 overflow-y-auto ${isDark ? 'bg-gray-950/80' : 'bg-gray-50/80'
                    }`}>
                    <pre className={`font-mono text-xs whitespace-pre-wrap p-3 ${isDark ? 'text-indigo-400' : 'text-indigo-700'
                      }`}>
                      {complexity}
                    </pre>
                  </div>
                </div>
              )}

              {/* AI Review Section */}
              {aiReview && (
                <div className={`flex-1 backdrop-blur-sm rounded-xl p-3 shadow-lg border transition-all min-h-0 ${isDark
                  ? 'bg-gray-900/80 border-blue-500/30'
                  : 'bg-white/80 border-blue-200'
                  }`}>
                  <div className="flex items-center space-x-2 mb-3">
                    <Bot className="w-4 h-4 text-blue-500" />
                    <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      AI Review
                    </h3>
                  </div>
                  
                  <div className="overflow-y-auto h-full max-h-56 space-y-4">
                    {formatAiReview(aiReview, isDark, language)?.map((section, index) => (
                      <div key={index} className={`p-3 rounded-lg border-l-4 ${
                        isDark ? 'bg-gray-950/50' : 'bg-gray-50/80'
                      }`} 
                           style={{ 
                             borderLeftColor: section.color.name === 'purple' ? '#8B5CF6' : '#10B981'
                           }}>
                        {/* Question Header */}
                        <div className="flex items-center space-x-2 mb-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs ${section.color.bg}`}>
                            {section.number}
                          </div>
                          <h4 className={`font-bold text-sm ${section.color.text}`}>
                            {section.number === 1 ? 'Optimized Code' : section.number === 2 ? 'Code Analysis' : `Question ${section.number}`}
                          </h4>
                        </div>

                        {/* Content with Code Blocks */}
                        <div className="space-y-3">
                          {section.codeBlocks.length > 0 ? (
                            // Process content with code blocks
                            (() => {
                              let lastIndex = 0;
                              const elements = [];
                              
                              section.codeBlocks.forEach((codeBlock, blockIndex) => {
                                // Add text before code block
                                const textBefore = section.content.slice(lastIndex, codeBlock.startIndex);
                                if (textBefore.trim()) {
                                  elements.push(
                                    <div key={`text-${blockIndex}`} className="mb-3">
                                      <pre className={`text-xs whitespace-pre-wrap leading-relaxed ${
                                        isDark ? 'text-gray-300' : 'text-gray-700'
                                      }`}>
                                        {textBefore.trim()}
                                      </pre>
                                    </div>
                                  );
                                }
                                
                                // Add code block
                                elements.push(
                                  <div key={`code-${blockIndex}`} className="mb-3">
                                    <CodeBlock
                                      code={codeBlock.code}
                                      language={language}
                                      isDark={isDark}
                                    />
                                  </div>
                                );
                                
                                lastIndex = codeBlock.endIndex;
                              });
                              
                              // Add remaining text after last code block
                              const textAfter = section.content.slice(lastIndex);
                              if (textAfter.trim()) {
                                elements.push(
                                  <div key="text-final">
                                    <pre className={`text-xs whitespace-pre-wrap leading-relaxed ${
                                      isDark ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                      {textAfter.trim()}
                                    </pre>
                                  </div>
                                );
                              }
                              
                              return elements;
                            })()
                          ) : (
                            // No code blocks, show as regular text
                            <pre className={`text-xs whitespace-pre-wrap leading-relaxed ${
                              isDark ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              {section.content}
                            </pre>
                          )}
                        </div>
                      </div>
                    )) || (
                      <pre
                        className={`font-mono text-xs whitespace-pre-wrap p-2 rounded-lg ${isDark ? 'bg-gray-950 text-blue-400' : 'bg-gray-50 text-blue-700'
                          }`}
                      >
                        {aiReview}
                      </pre>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    
  );
}

export default AdvancedCompiler;