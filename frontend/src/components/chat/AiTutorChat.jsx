import React from 'react';
import { ArrowRight } from 'lucide-react';
import { HighlightedCodeBlock } from './HighlightedCodeBlock';
import { formatAiReview } from '../../utils/chatFormatters';

export const AiTutorChat = ({ 
  chatMessages, 
  isDark, 
  chatScrollRef, 
  isChatLoading, 
  chatInput, 
  setChatInput, 
  handleSendChat 
}) => {
  return (
    <div className="flex flex-col h-full w-full relative">
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
      <div className={`p-2 flex-shrink-0 flex items-end space-x-2 border-t ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
        <textarea 
          className={`flex-1 min-h-[44px] max-h-32 p-2 text-sm bg-transparent outline-none resize-none ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
          placeholder="Ask your tutor about the code..."
          value={chatInput}
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
          disabled={isChatLoading || !chatInput.trim()}
          className={`p-2 rounded-lg mb-1 flex-shrink-0 transition-all ${!chatInput.trim() || isChatLoading ? 'opacity-50 cursor-not-allowed text-gray-400' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'}`}
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
