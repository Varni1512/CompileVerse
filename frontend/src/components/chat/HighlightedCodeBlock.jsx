import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import Editor from '@monaco-editor/react';

/**
 * A component to display a code block with proper syntax highlighting using Monaco Editor.
 * This is used for the AI Review section.
 */
export const HighlightedCodeBlock = ({ code, lang, isDark }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Dynamically calculate editor height based on code line count
  const lineCount = code.split('\n').length;
  const height = Math.max(80, Math.min(lineCount * 21, 400)); // Min 80px, max 400px

  return (
    <div className={`relative rounded-lg border overflow-hidden my-3 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
      <div className={`flex justify-between items-center px-3 py-2 ${isDark ? 'bg-gray-800 border-b border-gray-600' : 'bg-gray-50 border-b border-gray-200'}`}>
        <span className={`text-xs font-medium font-mono uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{lang || 'Code'}</span>
        <button
          onClick={handleCopy}
          title="Copy code"
          className={`p-1.5 rounded-md transition-all ${copied ? 'bg-green-500 text-white' : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <div style={{ height: `${height}px` }}>
        <Editor
          height="100%"
          language={lang}
          value={code}
          theme={isDark ? 'vs-dark' : 'light'}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            lineNumbers: 'off',
            folding: false,
            scrollbar: { vertical: 'hidden', horizontal: 'hidden' },
            padding: { top: 8, bottom: 8 }
          }}
        />
      </div>
    </div>
  );
};
