import React from 'react';

export const BulkAddModal = ({ 
  showBulkModal, 
  setShowBulkModal, 
  bulkText, 
  setBulkText, 
  handleBulkImport, 
  isDark 
}) => {
  if (!showBulkModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`w-full max-w-2xl flex flex-col rounded-xl shadow-2xl ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
        <div className={`p-4 border-b flex justify-between items-center ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Bulk Import Test Cases</h3>
          <button onClick={() => setShowBulkModal(false)} className={`p-1 rounded-md ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-4 flex flex-col space-y-4">
          <div className={`text-sm p-3 rounded-lg ${isDark ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
            <strong>Format Instructions:</strong><br />
            Use <code>---</code> to separate Input and Expected Output.<br />
            Use <code>===</code> to separate different Test Cases.<br /><br />
            <em>Example:</em><br />
            Input 1<br />
            ---<br />
            Output 1<br />
            ===<br />
            Input 2<br />
            ---<br />
            Output 2
          </div>
          <textarea
            className={`w-full h-64 p-3 font-mono text-sm rounded-lg border resize-none outline-none ${isDark ? 'bg-gray-900 text-gray-300 border-gray-700 focus:border-purple-500' : 'bg-gray-50 text-gray-800 border-gray-300 focus:border-purple-500'}`}
            placeholder="Paste bulk test cases here..."
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
          />
        </div>
        <div className={`p-4 border-t flex justify-end space-x-3 ${isDark ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'} rounded-b-xl`}>
          <button onClick={() => setShowBulkModal(false)} className={`px-4 py-2 rounded-lg font-semibold ${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}>Cancel</button>
          <button onClick={handleBulkImport} className="px-4 py-2 rounded-lg font-semibold bg-purple-600 text-white hover:bg-purple-700">Import</button>
        </div>
      </div>
    </div>
  );
};
