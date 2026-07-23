import React, { useState, useEffect, useRef } from 'react';
import { Play, Activity } from 'lucide-react';
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
  const [analyzeComplexity, setAnalyzeComplexity] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [serverStatus, setServerStatus] = useState('waking');
  const [showDashboard, setShowDashboard] = useState(window.location.hash === '#dashboard');

  const [mode, setMode] = useState('custom');
  const [testCases, setTestCases] = useState([{ input: '', expectedOutput: '' }]);
  const [editorTheme, setEditorTheme] = useState('vs-dark');
  const editorRef = useRef(null);
  
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
  } = useCodeExecution(activeApiUrl, language, code, input, mode, testCases, analyzeComplexity, setActiveTab);

  const isDark = theme === 'dark';

  const {
    chatMessages, isChatLoading, chatInput, setChatInput, chatScrollRef, handleSendChat, setChatMessages
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
        ? 'bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900'
        : 'bg-gradient-to-br from-blue-50 via-purple-50/30 to-pink-50/20'
        }`}>
        <AnalyticsDashboard isDark={isDark} activeApiUrl={activeApiUrl} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen lg:h-screen w-full lg:overflow-hidden transition-all duration-300 ${isDark
      ? 'bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900'
      : 'bg-gradient-to-br from-blue-50 via-purple-50/30 to-pink-50/20'
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
              ? 'bg-gray-900/80 border-purple-500/30 shadow-purple-500/20'
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
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500'
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

          {/* Right Column: Split into Top (Input) and Bottom (Output) */}
          <section className="w-full lg:w-5/12 flex flex-col gap-4 min-h-[600px] lg:min-h-0">
            <InputPanel 
              mode={mode}
              setMode={setMode}
              input={input}
              setInput={setInput}
              testCases={testCases}
              setTestCases={setTestCases}
              setShowBulkModal={setShowBulkModal}
              isDark={isDark}
            />

            <OutputPanel 
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