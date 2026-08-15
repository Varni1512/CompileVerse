import React from 'react';
import { AlignLeft, FlaskConical, Trash2, Plus, RotateCcw } from 'lucide-react';

export const InputPanel = ({
  mode,
  setMode,
  input,
  setInput,
  testCases,
  setTestCases,
  setShowBulkModal,
  isDark
}) => {
  const handleClearSingleTestCase = (idx) => {
    if (testCases.length > 1) {
      setTestCases(testCases.filter((_, i) => i !== idx));
    } else {
      setTestCases([{ input: '', expectedOutput: '' }]);
    }
  };

  const handleClearAllTestCases = () => {
    setTestCases([{ input: '', expectedOutput: '' }]);
  };

  return (
    <div className={`flex-[4] flex flex-col min-h-0 rounded-xl shadow-lg border p-2 sm:p-4 ${isDark ? 'bg-gray-900/80 border-gray-700' : 'bg-white/90 border-gray-200'}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setMode('custom')}
            className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${mode === 'custom'
                ? isDark ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
                : isDark ? 'bg-gray-800 text-gray-400 hover:text-gray-300' : 'bg-gray-100 text-gray-600 hover:text-gray-800'
              }`}
          >
            <AlignLeft className="w-4 h-4" />
            <span>Custom Input</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('tests')}
            className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${mode === 'tests'
                ? isDark ? 'bg-slate-700 text-white' : 'bg-slate-700 text-white'
                : isDark ? 'bg-gray-800 text-gray-400 hover:text-gray-300' : 'bg-gray-100 text-gray-600 hover:text-gray-800'
              }`}
          >
            <FlaskConical className="w-4 h-4" />
            <span>Test Cases</span>
          </button>
        </div>

        {mode === 'custom' && input.length > 0 && (
          <button
            type="button"
            onClick={() => setInput('')}
            className="text-xs flex items-center space-x-1 text-gray-400 hover:text-red-400 transition-colors cursor-pointer p-1 rounded hover:bg-red-500/10"
            title="Clear Custom Input"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span className="text-red-400 font-medium">Clear</span>
          </button>
        )}

        {mode === 'tests' && (testCases.length > 1 || testCases[0].input || testCases[0].expectedOutput) && (
          <button
            type="button"
            onClick={handleClearAllTestCases}
            className="text-xs flex items-center space-x-1 text-gray-400 hover:text-red-400 transition-colors cursor-pointer p-1 rounded hover:bg-red-500/10"
            title="Reset/Clear all test cases"
          >
            <RotateCcw className="w-3.5 h-3.5 text-red-400" />
            <span className="text-red-400 font-medium">Clear All</span>
          </button>
        )}
      </div>

      {mode === 'custom' ? (
        <textarea
          className={`w-full flex-1 min-h-0 p-3 text-sm rounded-lg border resize-none ${isDark ? 'bg-gray-800 text-white border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' : 'bg-gray-50 text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'} outline-none transition-all`}
          placeholder="Enter program input here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      ) : (
        <div className="flex flex-col flex-1 min-h-0 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
          {testCases.map((tc, idx) => (
            <div key={idx} className={`p-3 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex justify-between items-center mb-2">
                <span className={`text-xs font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>TEST CASE {idx + 1}</span>
                <button
                  type="button"
                  onClick={() => handleClearSingleTestCase(idx)}
                  className="p-1 rounded text-red-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                  title={testCases.length > 1 ? `Delete Test Case ${idx + 1}` : "Clear Test Case"}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                <textarea
                  className={`w-full h-12 p-2 text-xs rounded border resize-none ${isDark ? 'bg-gray-900 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'} outline-none`}
                  placeholder="Input"
                  value={tc.input}
                  onChange={(e) => {
                    const newTc = [...testCases];
                    newTc[idx].input = e.target.value;
                    setTestCases(newTc);
                  }}
                />
                <textarea
                  className={`w-full h-12 p-2 text-xs rounded border resize-none ${isDark ? 'bg-gray-900 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'} outline-none`}
                  placeholder="Expected Output"
                  value={tc.expectedOutput}
                  onChange={(e) => {
                    const newTc = [...testCases];
                    newTc[idx].expectedOutput = e.target.value;
                    setTestCases(newTc);
                  }}
                />
              </div>
            </div>
          ))}
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setTestCases([...testCases, { input: '', expectedOutput: '' }])}
              className={`flex-1 flex items-center justify-center space-x-1 py-2 rounded-lg border border-dashed transition-colors cursor-pointer ${isDark ? 'border-gray-600 text-gray-400 hover:text-white hover:border-gray-500 hover:bg-gray-800' : 'border-gray-300 text-gray-500 hover:text-gray-800 hover:border-gray-400 hover:bg-gray-100'}`}
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-semibold">Add Test Case</span>
            </button>
            <button
              type="button"
              onClick={() => setShowBulkModal(true)}
              className={`flex-1 flex items-center justify-center space-x-1 py-2 rounded-lg border border-dashed transition-colors cursor-pointer ${isDark ? 'border-gray-600 text-gray-400 hover:text-white hover:border-gray-500 hover:bg-gray-800' : 'border-gray-300 text-gray-500 hover:text-gray-800 hover:border-gray-400 hover:bg-gray-100'}`}
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-semibold">Bulk Add</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
