import React, { useState, useEffect, useRef } from 'react';
import { Play, Activity, GripHorizontal } from 'lucide-react';
import { customThemes } from './themes';
import { Header } from './components/layout/Header';
import { EditorToolbar } from './components/editor/EditorToolbar';
import { CodeEditor } from './components/editor/CodeEditor';
import { InputPanel } from './components/panels/InputPanel';
import { OutputPanel } from './components/panels/OutputPanel';
import { BulkAddModal } from './components/modals/BulkAddModal';
import { AnalyticsDashboard } from './components/dashboard/AnalyticsDashboard';
import { useCodeExecution } from './hooks/useCodeExecution';
import { useAiChat } from './hooks/useAiChat';

const defaultTemplates = {
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}`,
  java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
  py: `print("Hello, World!")`
};

const languageConfig = {
  cpp: { name: 'C++', color: 'from-blue-500 to-cyan-500', monaco: 'cpp', extension: 'cpp' },
  java: { name: 'Java', color: 'from-orange-500 to-red-500', monaco: 'java', extension: 'java' },
  py: { name: 'Python', color: 'from-green-500 to-emerald-500', monaco: 'python', extension: 'py' }
};

function App() {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('selectedLanguage');
    return languageConfig[saved] ? saved : 'cpp';
  });
  const [code, setCode] = useState('');
  const [input, setInput] = useState('');
  const [theme, setTheme] = useState('dark');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('output');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [serverStatus, setServerStatus] = useState('waking');
  const [showDashboard, setShowDashboard] = useState(window.location.hash === '#dashboard');

  const [mode, setMode] = useState('custom');
  const [testCases, setTestCases] = useState([{ input: '', expectedOutput: '' }]);
  const [editorTheme, setEditorTheme] = useState('vs-dark');
  const editorRef = useRef(null);

  // Vertical Draggable Resizer State (Right Column)
  const [splitPercent, setSplitPercent] = useState(() => {
    const saved = localStorage.getItem('compileverse_panel_split');
    return saved ? Number(saved) : 32; // Default 32% for top input, 68% for output/chat
  });
  const [isInputCollapsed, setIsInputCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const rightColumnRef = useRef(null);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleTouchStart = () => {
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMove = (clientY) => {
      if (!isDragging || !rightColumnRef.current) return;
      const rect = rightColumnRef.current.getBoundingClientRect();
      const relativeY = clientY - rect.top;
      const newPercent = (relativeY / rect.height) * 100;

      if (newPercent < 8) {
        setIsInputCollapsed(true);
      } else {
        setIsInputCollapsed(false);
        const clamped = Math.max(12, Math.min(85, newPercent));
        setSplitPercent(clamped);
        localStorage.setItem('compileverse_panel_split', String(clamped));
      }
    };

    const onMouseMove = (e) => handleMove(e.clientY);
    const onTouchMove = (e) => {
      if (e.touches && e.touches[0]) handleMove(e.touches[0].clientY);
    };

    const stopDragging = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', stopDragging);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', stopDragging);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', stopDragging);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', stopDragging);
    };
  }, [isDragging]);
  
  const [activeApiUrl, setActiveApiUrl] = useState(() => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8000';
    }
    const url = import.meta.env.VITE_FRIEND_API_URL || import.meta.env.VITE_API_URL || 'https://compileverse-backend.onrender.com';
    return url.replace(/\/+$/, '');
  });

  const {
    output, setOutput, isRunning, executionTime, setExecutionTime,
    testResults, setTestResults, complexity, setComplexity,
    isAnalyzing, handleSubmit, handleManualAnalyze
  } = useCodeExecution(activeApiUrl, language, code, input, mode, testCases, setActiveTab);

  const isDark = theme === 'dark';

  const {
    chatMessages, isChatLoading, chatInput, setChatInput, chatScrollRef, handleSendChat, setChatMessages, aiUsage, fetchAiLimitStatus
  } = useAiChat(activeApiUrl, language, code, isDark);

  useEffect(() => {
    const findActiveServer = async () => {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          await fetch('http://localhost:8000', { signal: controller.signal });
          clearTimeout(timeoutId);

          setActiveApiUrl('http://localhost:8000');
          setServerStatus('online');
          return;
        } catch {
          console.warn('Local backend is down. Falling back to other servers...');
        }
      }

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
    const onHashChange = () => setShowDashboard(window.location.hash === '#dashboard');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    setCode(defaultTemplates[language]);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('selectedLanguage', language);
  }, [language]);

  useEffect(() => {
    document.body.className = isDark ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900';
  }, [isDark]);

  const handleLanguageChange = (selectedLang) => {
    setLanguage(selectedLang);
    setOutput(''); 
    setComplexity(''); 
    setExecutionTime(null); 
    setTestResults(null);
  };

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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  if (showDashboard) {
    return (
      <div className={`min-h-screen lg:h-screen w-full lg:overflow-hidden transition-all duration-300 ${isDark
        ? 'bg-slate-900'
        : 'bg-slate-50'
        }`}>
        <AnalyticsDashboard isDark={isDark} activeApiUrl={activeApiUrl} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen lg:h-screen w-full lg:overflow-hidden transition-all duration-300 ${isDark
      ? 'bg-slate-900'
      : 'bg-slate-50'
      }`}>

      <div className="relative z-10 flex h-full flex-col p-2 sm:p-4">
        <Header 
          serverStatus={serverStatus}
          theme={theme}
          setTheme={setTheme}
          isDark={isDark}
        />

        <main className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 overflow-y-auto lg:overflow-hidden">

          <section className="w-full lg:w-7/12 flex flex-col min-h-0">
            <div className={`flex-1 min-h-0 flex flex-col rounded-xl shadow-lg border overflow-hidden ${isDark
              ? 'bg-gray-900/80 border-blue-500/30 shadow-blue-500/20'
              : 'bg-white/90 border-gray-200 shadow-gray-300/30'
              }`}>

              <EditorToolbar 
                currentLang={currentLang}
                languageConfig={languageConfig}
                language={language}
                handleLanguageChange={handleLanguageChange}
                editorTheme={editorTheme}
                setEditorTheme={setEditorTheme}
                theme={theme}
                setTheme={setTheme}
                isDark={isDark}
                handleDownload={handleDownload}
                copyToClipboard={copyToClipboard}
                copied={copied}
              />

              <CodeEditor 
                isDark={isDark}
                currentLang={currentLang}
                code={code}
                setCode={setCode}
                editorTheme={editorTheme}
                handleEditorWillMount={handleEditorWillMount}
                editorRef={editorRef}
              />

              {/* ACTION FOOTER (Desktop Only >= 1024px) */}
              <div className={`p-3 border-t hidden lg:flex flex-row items-center justify-end gap-3 flex-shrink-0 ${isDark ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center space-x-3 w-auto">
                  <button
                    onClick={() => {
                      if (activeTab === 'custom' || activeTab === 'tests') setActiveTab('output');
                      handleSubmit();
                    }}
                    disabled={isRunning}
                    className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-2 rounded-lg font-bold text-white shadow-lg transition-all transform hover:scale-[1.02] active:scale-95 ${isRunning
                        ? 'bg-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500'
                      }`}
                  >
                    {isRunning ? (
                      <Activity className="w-5 h-5 animate-spin" />
                    ) : (
                      <Play className="w-5 h-5 fill-current" />
                    )}
                    <span>{isRunning ? 'Running...' : 'Run Code'}</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Right Column: Resizable Top (Input) and Bottom (Output) */}
          <section 
            ref={rightColumnRef}
            className="w-full lg:w-5/12 flex flex-col min-h-[600px] lg:min-h-0 relative"
          >
            {/* Top Input Panel */}
            {!isInputCollapsed && (
              <InputPanel 
                style={{ flex: `${splitPercent} ${splitPercent} 0%` }}
                mode={mode}
                setMode={setMode}
                input={input}
                setInput={setInput}
                testCases={testCases}
                setTestCases={setTestCases}
                setShowBulkModal={setShowBulkModal}
                isDark={isDark}
              />
            )}

            {/* Draggable Divider Handle */}
            <div
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              className={`py-1.5 flex items-center justify-center cursor-row-resize select-none z-10 group relative transition-colors ${
                isDragging ? 'opacity-100' : 'opacity-85 hover:opacity-100'
              }`}
              title="Drag up/down to resize panels. Click button to collapse/expand input."
            >
              <div className={`w-full h-1 rounded-full transition-all flex items-center justify-center relative ${
                isDragging 
                  ? 'bg-blue-500 h-1.5 shadow-md ring-2 ring-blue-400/50' 
                  : isDark ? 'bg-gray-700/80 group-hover:bg-blue-500/60' : 'bg-gray-300 group-hover:bg-blue-400'
              }`}>
                <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1.5 shadow-sm border transition-all ${
                  isDark ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-600'
                }`}>
                  <GripHorizontal className="w-3.5 h-3.5 text-gray-400" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsInputCollapsed(!isInputCollapsed);
                    }}
                    className="hover:text-blue-400 font-semibold cursor-pointer transition-colors"
                    title={isInputCollapsed ? "Expand Input Panel" : "Collapse Input Panel for Full Chat / Output"}
                  >
                    {isInputCollapsed ? "▼ Expand Input" : "▲ Collapse Input"}
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Output / Chat Panel */}
            <OutputPanel 
              style={{ flex: isInputCollapsed ? '1 1 0%' : `${100 - splitPercent} ${100 - splitPercent} 0%` }}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              mode={mode}
              output={output}
              executionTime={executionTime}
              isDark={isDark}
              testResults={testResults}
              complexity={complexity}
              isAnalyzing={isAnalyzing}
              handleManualAnalyze={handleManualAnalyze}
              chatMessages={chatMessages}
              chatScrollRef={chatScrollRef}
              isChatLoading={isChatLoading}
              chatInput={chatInput}
              setChatInput={setChatInput}
              handleSendChat={handleSendChat}
              setChatMessages={setChatMessages}
              aiUsage={aiUsage}
            />
          </section>
        </main>
      </div>

      <BulkAddModal 
        showBulkModal={showBulkModal}
        setShowBulkModal={setShowBulkModal}
        bulkText={bulkText}
        setBulkText={setBulkText}
        handleBulkImport={handleBulkImport}
        isDark={isDark}
      />
    </div>
  );
}

export default App;