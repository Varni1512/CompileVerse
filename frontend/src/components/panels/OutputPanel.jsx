import React from 'react';
import { Terminal, Cpu, Bot, Check, Activity } from 'lucide-react';
import { AiTutorChat } from '../chat/AiTutorChat';

export const OutputPanel = ({
  activeTab,
  setActiveTab,
  mode,
  output,
  executionTime,
  isDark,
  testResults,
  complexity,
  isAnalyzing,
  handleManualAnalyze,
  chatMessages,
  chatScrollRef,
  isChatLoading,
  chatInput,
  setChatInput,
  handleSendChat
}) => {
  return (
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

      <div className={`flex-1 min-h-0 ${activeTab === 'review' ? 'flex flex-col' : 'p-2 sm:p-4 overflow-y-auto'}`}>
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
          <AiTutorChat 
            chatMessages={chatMessages}
            isDark={isDark}
            chatScrollRef={chatScrollRef}
            isChatLoading={isChatLoading}
            chatInput={chatInput}
            setChatInput={setChatInput}
            handleSendChat={handleSendChat}
          />
        )}
      </div>
    </div>
  );
};
