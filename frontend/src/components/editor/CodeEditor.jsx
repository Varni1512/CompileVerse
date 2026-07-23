import React from 'react';
import Editor from '@monaco-editor/react';

export const CodeEditor = ({
  isDark,
  currentLang,
  code,
  setCode,
  editorTheme,
  handleEditorWillMount,
  editorRef
}) => {
  return (
    <div className={`flex-1 min-h-[300px] ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
      <Editor
        height="100%"
        language={currentLang.monaco}
        value={code}
        onChange={(value) => setCode(value || '')}
        theme={editorTheme}
        beforeMount={handleEditorWillMount}
        onMount={(editor) => { editorRef.current = editor; }}
        options={{
          fontSize: 14,
          fontFamily: 'JetBrains Mono, Monaco, Consolas, monospace',
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          automaticLayout: true,
          padding: { top: 12, bottom: 12 },
          lineNumbers: 'on',
        }}
      />
    </div>
  );
};
