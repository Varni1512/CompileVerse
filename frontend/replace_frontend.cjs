const fs = require('fs');
const file = '/Users/varnikumarpatel/Study/Placement/Projects/CompileVerse-main/CompileVerse-main/frontend/src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add states
const stateTarget = "const [analyzeComplexity, setAnalyzeComplexity] = useState(false);";
const stateReplacement = `const [analyzeComplexity, setAnalyzeComplexity] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');`;
content = content.replace(stateTarget, stateReplacement);

// 2. Replace handleSubmit
const submitStart = content.indexOf('const handleSubmit = async () => {');
const submitEnd = content.indexOf('useEffect(() => {', submitStart);
const oldSubmit = content.substring(submitStart, submitEnd);

const newSubmit = `const handleSubmit = async () => {
    setIsRunning(true);
    setOutput('');
    setComplexity('');
    setExecutionTime(null);
    setTestResults(null);
    setActiveTab('output');
    
    if (analyzeComplexity) {
      setIsAnalyzing(true);
      setComplexity('Analyzing in background...');
    }

    try {
      const startTime = Date.now();
      
      // 1. Execute Code
      const payload = mode === 'custom' 
        ? { language, code, input } 
        : { language, code, testCases };
        
      const endpoint = mode === 'custom' ? '/run' : '/run-tests';
      
      const runPromise = fetch(\`\${API_URL}\${endpoint}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(res => res.json());

      // 2. Analyze Complexity (Background)
      let analyzePromise = null;
      if (analyzeComplexity) {
        analyzePromise = fetch(\`\${API_URL}/analyze\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        }).then(res => res.json()).catch(err => ({ complexity: 'Analysis failed' }));
      }

      // Wait for execution
      const data = await runPromise;
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
      setIsRunning(false);

      // Wait for analysis
      if (analyzePromise) {
        const analyzeData = await analyzePromise;
        setComplexity(analyzeData.complexity || 'Analysis failed');
        setIsAnalyzing(false);
      }

    } catch (error) {
      setOutput("Error: " + error.message);
      setIsRunning(false);
      setIsAnalyzing(false);
      setComplexity('Analysis failed');
    }
  };\n\n  `;

content = content.replace(oldSubmit, newSubmit);

// 3. Add handleBulkImport logic
const handleFormatTarget = "const handleFormat = async () => {";
const handleBulkImport = `const handleBulkImport = () => {
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
  };\n\n  `;
content = content.replace(handleFormatTarget, handleBulkImport + handleFormatTarget);

fs.writeFileSync(file, content);
console.log("Successfully updated App.jsx states and logic.");
