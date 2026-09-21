import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * useVoiceAi Hook
 * Provides browser-native Speech-to-Text (STT) and Text-to-Speech (TTS)
 * for CompileVerse Voice AI Mode.
 */
export const useVoiceAi = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMsgIdx, setSpeakingMsgIdx] = useState(null);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceMode, setVoiceMode] = useState(() => {
    return localStorage.getItem('compileverse_voice_mode') === 'true';
  });

  const recognitionRef = useRef(null);

  // Check browser support for SpeechRecognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const speechSynthesisSupported = 'speechSynthesis' in window;
    setVoiceSupported(Boolean(SpeechRecognition && speechSynthesisSupported));
  }, []);

  const toggleVoiceMode = useCallback(() => {
    setVoiceMode(prev => {
      const next = !prev;
      localStorage.setItem('compileverse_voice_mode', String(next));
      return next;
    });
  }, []);

  // Speech-to-Text: Start Listening
  const startListening = useCallback((onSpeechResult) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    // Stop speaking if currently speaking
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingMsgIdx(null);
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        if (onSpeechResult) {
          onSpeechResult(currentTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setIsListening(false);
    }
  }, []);

  // Speech-to-Text: Stop Listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  // Clean markdown and code blocks for natural speech synthesis
  const sanitizeTextForSpeech = (text) => {
    if (!text) return '';
    return text
      // Replace code blocks with descriptive phrase
      .replace(/```[\s\S]*?```/g, ' [Refer to the code snippet on screen] ')
      // Strip inline code backticks
      .replace(/`([^`]+)`/g, '$1')
      // Strip markdown headers
      .replace(/^#+\s+/gm, '')
      // Strip bold/italics
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      // Clean up whitespace
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Text-to-Speech: Speak text
  const speakText = useCallback((rawText, msgIdx = null) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    // If clicking on the same message that's currently speaking, stop it (toggle)
    if (isSpeaking && speakingMsgIdx === msgIdx) {
      setIsSpeaking(false);
      setSpeakingMsgIdx(null);
      return;
    }

    const cleanText = sanitizeTextForSpeech(rawText);
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05; // Slightly upbeat natural pace
    utterance.pitch = 1.0;

    // Pick best English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha")) && v.lang.startsWith("en")
    ) || voices.find(v => v.lang.startsWith("en"));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setSpeakingMsgIdx(msgIdx);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingMsgIdx(null);
    };

    utterance.onerror = (e) => {
      console.warn("Speech synthesis error:", e);
      setIsSpeaking(false);
      setSpeakingMsgIdx(null);
    };

    window.speechSynthesis.speak(utterance);
  }, [isSpeaking, speakingMsgIdx]);

  // Text-to-Speech: Stop Speaking
  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setSpeakingMsgIdx(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  return {
    isListening,
    isSpeaking,
    speakingMsgIdx,
    voiceSupported,
    voiceMode,
    toggleVoiceMode,
    startListening,
    stopListening,
    speakText,
    stopSpeaking
  };
};
