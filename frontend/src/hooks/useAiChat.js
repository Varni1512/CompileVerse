import { useState, useRef, useEffect } from 'react';

export const useAiChat = (activeApiUrl, language, code, isDark) => {
  const [chatMessages, setChatMessages] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const chatScrollRef = useRef(null);

  // Initial greeting
  useEffect(() => {
    if (chatMessages.length === 0) {
      setChatMessages([
        { role: 'assistant', content: "Hi! I'm your AI Coding Tutor. How can I help you with your code today?" }
      ]);
    }
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isChatLoading]);

  const handleSendChat = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    
    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsChatLoading(true);

    try {
      const response = await fetch(`${activeApiUrl}/ai-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          language, 
          code,
          messages: [...chatMessages, { role: 'user', content: userMessage }]
        }),
      });
      
      const data = await response.json();
      
      if (data.review) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.review }]);
      } else {
        throw new Error(data.error || 'Failed to get AI response');
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return {
    chatMessages,
    setChatMessages,
    isChatLoading,
    chatInput,
    setChatInput,
    chatScrollRef,
    handleSendChat
  };
};
