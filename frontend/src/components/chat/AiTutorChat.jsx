import React, { useEffect } from 'react';
import { ArrowRight, Bot, Sparkles, AlertCircle, ShieldAlert, Trash2, Mic, MicOff, Volume2, VolumeX, Wrench } from 'lucide-react';
import { HighlightedCodeBlock } from './HighlightedCodeBlock';
import { formatAiReview } from '../../utils/chatFormatters';
import { useVoiceAi } from '../../hooks/useVoiceAi';

export const AiTutorChat = ({ 
  chatMessages, 
  isDark, 
  chatScrollRef, 
  isChatLoading, 
  chatInput, 
  setChatInput, 
  handleSendChat,
  setChatMessages,
  aiUsage
}) => {
  const isLimitReached = aiUsage && (aiUsage.limitReached || (aiUsage.loaded && aiUsage.remaining <= 0));
  const used = aiUsage?.used ?? 0;
  const limit = aiUsage?.limit ?? 5;
  const remaining = aiUsage?.remaining ?? Math.max(0, limit - used);

  const {
    isListening,
    isSpeaking,
    speakingMsgIdx,
    voiceMode,
    toggleVoiceMode,
    startListening,
    stopListening,
    speakText,
    stopSpeaking
  } = useVoiceAi();

  // Auto-speak new assistant responses when Voice Mode is enabled
  useEffect(() => {
    if (voiceMode && chatMessages.length > 1 && !isChatLoading) {
      const lastIdx = chatMessages.length - 1;
      const lastMsg = chatMessages[lastIdx];
      if (lastMsg && lastMsg.role === 'assistant') {
        speakText(lastMsg.content, lastIdx);
      }
    }
  }, [chatMessages, voiceMode, isChatLoading, speakText]);

  const handleClearChat = () => {
    stopSpeaking();
    stopListening();
    if (setChatMessages) {
      setChatMessages([
        { role: 'assistant', content: "Hi! I'm your AI Coding Tutor. How can I help you with your code today?" }
      ]);
    }
  };

  return (
    <div className="flex flex-col h-full w-full relative">
      {/* Header Bar with Model info, Voice Mode Toggle, and Usage Badge */}
      <div className={`px-4 py-2.5 flex items-center justify-between border-b flex-shrink-0 text-xs font-medium ${
        isDark ? 'bg-gray-800/60 border-gray-700/80 text-gray-300' : 'bg-gray-50/90 border-gray-200 text-gray-600'
      }`}>
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded-md bg-blue-500/20 text-blue-400">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <span className="font-semibold">AI Coding Tutor</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium border flex items-center gap-1 ${
            isDark 
              ? 'bg-purple-950/40 border-purple-800/60 text-purple-300' 
              : 'bg-purple-50 border-purple-200 text-purple-700'
          }`}>
            <span>Groq</span>
            <span>•</span>
            <span>RAG Verified</span>
          </span>
        </div>

        {/* Dynamic Usage Pill, Voice Mode & Clear Action */}
        <div className="flex items-center space-x-2">
          {/* Voice Mode Audio Toggle */}
          <button
            type="button"
            onClick={toggleVoiceMode}
            title={voiceMode ? "Voice Mode: Active (Click to mute auto-speech)" : "Voice Mode: Disabled (Click to enable audio speech responses)"}
            className={`px-2 py-1 rounded-full font-mono text-[10px] flex items-center gap-1 border transition-all cursor-pointer ${
              voiceMode 
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 font-semibold' 
                : isDark ? 'bg-gray-800/80 border-gray-700 text-gray-400 hover:text-gray-200' : 'bg-gray-100 border-gray-300 text-gray-600 hover:text-gray-900'
            }`}
          >
            <Volume2 className={`w-3 h-3 ${voiceMode ? 'text-emerald-400 animate-pulse' : ''}`} />
            <span>{voiceMode ? "Voice: ON" : "Voice: OFF"}</span>
          </button>

          <div className={`px-2.5 py-1 rounded-full flex items-center space-x-1.5 transition-colors border ${
            isLimitReached 
              ? isDark ? 'bg-red-950/60 text-red-400 border-red-800/80' : 'bg-red-50 text-red-600 border-red-200'
              : remaining <= 1 
                ? isDark ? 'bg-amber-950/60 text-amber-300 border-amber-800/80' : 'bg-amber-50 text-amber-700 border-amber-200'
                : isDark ? 'bg-blue-950/60 text-blue-300 border-blue-800/80' : 'bg-blue-50 text-blue-700 border-blue-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              isLimitReached ? 'bg-red-500 animate-pulse' : remaining <= 1 ? 'bg-amber-500' : 'bg-blue-500'
            }`} />
            <span className="font-mono font-semibold">
              {used}/{limit}
            </span>
            <span className="opacity-80">
              ({isLimitReached ? 'Limit reached' : `${remaining} left`})
            </span>
          </div>

          {chatMessages.length > 1 && (
            <button
              type="button"
              onClick={handleClearChat}
              className="p-1 rounded text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              title="Clear chat history"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 custom-scrollbar space-y-4" ref={chatScrollRef}>
        {chatMessages.filter(m => m.role !== 'system').map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2 ${msg.role === 'user' 
              ? 'bg-blue-600 text-white rounded-br-sm' 
              : isDark ? 'bg-gray-800 text-gray-200 border border-gray-700 rounded-bl-sm' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm'}`}>
              {msg.role === 'assistant' ? (
                <div className="space-y-2">
                  {/* Header action inside assistant bubble: Read Aloud Speaker */}
                  <div className="flex justify-between items-center pb-1 border-b border-gray-700/30">
                    <span className="text-[11px] font-semibold text-blue-400 flex items-center gap-1">
                      <Bot className="w-3.5 h-3.5" />
                      <span>CompileVerse Mentor</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => speakText(msg.content, idx)}
                      title={isSpeaking && speakingMsgIdx === idx ? "Stop speaking" : "Listen to answer (Read Aloud)"}
                      className={`p-1 rounded-md transition-all cursor-pointer ${
                        isSpeaking && speakingMsgIdx === idx
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
                          : isDark ? 'text-gray-400 hover:text-blue-300 hover:bg-gray-700' : 'text-gray-500 hover:text-blue-600 hover:bg-gray-100'
                      }`}
                    >
                      {isSpeaking && speakingMsgIdx === idx ? (
                        <VolumeX className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Agentic Tool Calls Badge if Agent executed tools */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 py-1">
                      {msg.toolCalls.map((t, tIdx) => (
                        <div 
                          key={tIdx}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 border ${
                            t.name === 'executeCode'
                              ? isDark ? 'bg-amber-950/40 border-amber-800/60 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
                              : isDark ? 'bg-blue-950/40 border-blue-800/60 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-800'
                          }`}
                        >
                          <Wrench className="w-3 h-3 text-amber-400" />
                          <span className="font-semibold">{t.name === 'executeCode' ? 'Agent Tool: Executed Code' : 'Agent Tool: Docs Search'}</span>
                          <span className="opacity-75">({t.summary})</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Content with code blocks */}
                  {formatAiReview(msg.content)?.map((section, sIndex) => (
                    <div key={sIndex} className="py-1">
                      <div className="space-y-2">
                        {(() => {
                          let lastIndex = 0;
                          const elements = [];
                          section.codeBlocks.forEach((codeBlock, blockIndex) => {
                            const textBefore = section.content.slice(lastIndex, codeBlock.startIndex);
                            if (textBefore.trim()) {
                              const formatted = textBefore.trim().replace(/^#+\s*/gm, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                              elements.push(<div key={`text-${blockIndex}`} className="text-sm leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formatted }} />);
                            }
                            elements.push(<HighlightedCodeBlock key={`code-${blockIndex}`} code={codeBlock.code} lang={codeBlock.lang} isDark={isDark} />);
                            lastIndex = codeBlock.endIndex;
                          });
                          const textAfter = section.content.slice(lastIndex);
                          if (textAfter.trim()) {
                            const formatted = textAfter.trim().replace(/^#+\s*/gm, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                            elements.push(<div key="text-final" className="text-sm leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formatted }} />);
                          }
                          return elements;
                        })()}
                      </div>
                    </div>
                  ))}

                  {/* RAG Citations */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className={`mt-2.5 pt-2 border-t flex flex-wrap items-center gap-1.5 text-[11px] ${
                      isDark ? 'border-gray-700/80 text-purple-300' : 'border-gray-200 text-purple-700'
                    }`}>
                      <span className="font-medium flex items-center gap-1">
                        <span>📚 RAG Verified:</span>
                      </span>
                      {msg.sources.map((s, sIdx) => (
                        <span 
                          key={sIdx}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                            isDark 
                              ? 'bg-purple-900/40 border-purple-700/60 text-purple-200' 
                              : 'bg-purple-50 border-purple-200 text-purple-800'
                          }`}
                          title={`Relevance score: ${(s.relevance * 100).toFixed(0)}%`}
                        >
                          {s.topic}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
              )}
            </div>
          </div>
        ))}
        {isChatLoading && (
          <div className="flex justify-start">
            <div className={`rounded-2xl px-4 py-3 rounded-bl-sm flex space-x-2 items-center ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
      </div>

      {/* Limit Reached Warning Banner */}
      {isLimitReached && (
        <div className={`mx-3 mb-2 p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
          isDark 
            ? 'bg-red-950/40 border-red-800/80 text-red-300' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center space-x-2.5">
            <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0" />
            <div>
              <span className="font-semibold">AI message limit reached ({used}/{limit} messages).</span>
              <span className="block text-[11px] opacity-80 mt-0.5">Please contact the administrator to request an increase.</span>
            </div>
          </div>
        </div>
      )}

      {/* Live Voice Listening Pulse Banner */}
      {isListening && (
        <div className={`mx-3 mb-2 px-3 py-1.5 rounded-lg border flex items-center space-x-2 text-xs transition-all ${
          isDark ? 'bg-red-950/40 border-red-800/80 text-red-300' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
          <span className="font-medium">Listening... Speak your coding doubt or error</span>
        </div>
      )}

      {/* Input Section */}
      <div className={`p-2 flex-shrink-0 flex items-end space-x-2 border-t ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
        <textarea 
          className={`flex-1 min-h-[44px] max-h-32 p-2 text-sm bg-transparent outline-none resize-none transition-opacity ${
            isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
          } ${isLimitReached ? 'opacity-50 cursor-not-allowed' : ''}`}
          placeholder={isLimitReached ? `Message limit reached (${used}/{limit}). Contact administrator.` : "Ask your tutor or speak your question..."}
          value={chatInput}
          disabled={isLimitReached || isChatLoading}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendChat();
            }
          }}
        />

        {/* Microphone STT Voice Input Button */}
        <button
          type="button"
          onClick={() => {
            if (isListening) {
              stopListening();
            } else {
              startListening((spokenTranscript) => {
                setChatInput(spokenTranscript);
              });
            }
          }}
          disabled={isLimitReached || isChatLoading}
          title={isListening ? "Stop listening (Recording in progress)" : "Click to speak your question (Voice Input)"}
          className={`p-2 rounded-lg mb-1 flex-shrink-0 transition-all cursor-pointer border ${
            isListening
              ? 'bg-red-600 text-white border-red-500 shadow-md animate-pulse ring-2 ring-red-400/50'
              : isDark
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700 hover:text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-200 hover:text-gray-900'
          } ${isLimitReached || isChatLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Send Button */}
        <button 
          onClick={handleSendChat}
          disabled={isChatLoading || !chatInput.trim() || isLimitReached}
          className={`p-2 rounded-lg mb-1 flex-shrink-0 transition-all cursor-pointer ${
            !chatInput.trim() || isChatLoading || isLimitReached
              ? 'opacity-50 cursor-not-allowed text-gray-400' 
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
          }`}
          title={isLimitReached ? 'Limit reached' : 'Send message'}
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
