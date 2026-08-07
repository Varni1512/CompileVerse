import { useState, useEffect } from 'react';

export const useCodeExecution = (activeApiUrl, language, code, input, mode, testCases, setActiveTab) => {
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [executionTime, setExecutionTime] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [complexity, setComplexity] = useState("Analysis not requested");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSubmit = async () => {
    setIsRunning(true);
    setOutput('');
    setExecutionTime(null);
    setTestResults(null);
    setActiveTab('output');

    try {
      const startTime = Date.now();

      // 1. Execute Code Only
      const payload = mode === 'custom'
        ? { language, code, input }
        : { language, code, testCases };

      const endpoint = mode === 'custom' ? '/run' : '/run-tests';

      const response = await fetch(`${activeApiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      const endTime = Date.now();
      setExecutionTime(endTime - startTime);

      if (mode === 'custom') {
        if (data.output !== undefined) {
          setOutput(data.output);
        } else {
          setOutput("Error: " + (data.error || 'Compilation failed'));
        }
      } else {
        if (data.results !== undefined) {
          setTestResults(data.results);
        } else {
          setOutput("Error: " + (data.error || 'Execution failed'));
        }
      }
    } catch (error) {
      setOutput("Error: " + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleManualAnalyze = async () => {
    setIsAnalyzing(true);
    setComplexity('Analyzing in background...');
    try {
      const response = await fetch(`${activeApiUrl}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await response.json();
      setComplexity(data.complexity || 'Analysis failed');
    } catch (err) {
      setComplexity('Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Listen for Ctrl+Enter to run code
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isRunning) {
          handleSubmit();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [language, code, input, mode, testCases, isRunning]);

  return {
    output,
    setOutput,
    isRunning,
    executionTime,
    setExecutionTime,
    testResults,
    setTestResults,
    complexity,
    setComplexity,
    isAnalyzing,
    handleSubmit,
    handleManualAnalyze
  };
};
