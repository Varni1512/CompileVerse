import React from 'react';
import { ArrowRight, Bot, Sparkles, AlertCircle, ShieldAlert, ArrowUpRight, Trash2 } from 'lucide-react';
import { HighlightedCodeBlock } from './HighlightedCodeBlock';
import { formatAiReview } from '../../utils/chatFormatters';

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

  const handleClearChat = () => {
    if (setChatMessages) {
      setChatMessages([
        { role: 'assistant', content: "Hi! I'm your AI Coding Tutor. How can I help you with your code today?" }
      ]);
    }
  };

  return (
    <div className="flex flex-col h-full w-full relative">
      {/* Header Bar with Usage Badge */}
      <div className={`px-4 py-2.5 flex items-center justify-between border-b flex-shrink-0 text-xs font-medium ${
        isDark ? 'bg-gray-800/60 border-gray-700/80 text-gray-300' : 'bg-gray-50/90 border-gray-200 text-gray-600'
      }`}>
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded-md bg-blue-500/20 text-blue-400">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <span className="font-semibold">AI Coding Tutor</span>
        </div>

        {/* Dynamic Usage Pill & Clear Action */}
        <div className="flex items-center space-x-2">
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

      {/* Input Section */}
      <div className={`p-2 flex-shrink-0 flex items-end space-x-2 border-t ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
        <textarea 
          className={`flex-1 min-h-[44px] max-h-32 p-2 text-sm bg-transparent outline-none resize-none transition-opacity ${
            isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
          } ${isLimitReached ? 'opacity-50 cursor-not-allowed' : ''}`}
          placeholder={isLimitReached ? `Message limit reached (${used}/${limit}). Contact administrator.` : "Ask your tutor about the code..."}
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
