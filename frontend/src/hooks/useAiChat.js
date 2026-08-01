import { useState, useRef, useEffect, useCallback } from 'react';

export const useAiChat = (activeApiUrl, language, code, isDark) => {
  const [chatMessages, setChatMessages] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [aiUsage, setAiUsage] = useState({
    used: 0,
    limit: 5,
    remaining: 5,
    limitReached: false,
    loaded: false
  });
  const chatScrollRef = useRef(null);

  // Fetch current IP limit status from backend
  const fetchAiLimitStatus = useCallback(async () => {
    if (!activeApiUrl) return;
    try {
      const response = await fetch(`${activeApiUrl}/ai-limit-status`);
      const data = await response.json();
      if (data.success) {
        setAiUsage({
          used: data.used ?? 0,
          limit: data.limit ?? 5,
          remaining: data.remaining ?? 5,
          limitReached: Boolean(data.limitReached),
          loaded: true
        });
      }
    } catch (err) {
      console.warn("Could not fetch AI limit status:", err);
    }
  }, [activeApiUrl]);

  useEffect(() => {
    fetchAiLimitStatus();
  }, [fetchAiLimitStatus]);

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

    if (aiUsage.limitReached || (aiUsage.loaded && aiUsage.remaining <= 0)) {
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ **AI message limit reached (${aiUsage.used}/${aiUsage.limit} messages used)**. Please contact the administrator to request more messages.`
        }
      ]);
      return;
    }
    
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

      if (data.usage) {
        setAiUsage({
          used: data.usage.used,
          limit: data.usage.limit,
          remaining: data.usage.remaining,
          limitReached: Boolean(data.usage.limitReached),
          loaded: true
        });
      }
      
      if (response.status === 429 || data.limitReached) {
        setAiUsage(prev => ({
          ...prev,
          limitReached: true,
          remaining: 0,
          used: data.usage?.used || prev.limit,
          limit: data.usage?.limit || prev.limit,
          loaded: true
        }));
        setChatMessages(prev => [
          ...prev,
          { role: 'assistant', content: `⚠️ ${data.error || 'AI message limit reached. Please contact the administrator.'}` }
        ]);
        return;
      }

      if (data.reply) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
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
    handleSendChat,
    aiUsage,
    fetchAiLimitStatus
  };
};
