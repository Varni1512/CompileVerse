export const customThemes = {
  dracula: {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { background: '282a36' },
      { token: 'comment', foreground: '6272a4' },
      { token: 'string', foreground: 'f1fa8c' },
      { token: 'number', foreground: 'bd93f9' },
      { token: 'keyword', foreground: 'ff79c6', fontStyle: 'bold' },
      { token: 'variable', foreground: 'f8f8f2' },
      { token: 'type', foreground: '8be9fd', fontStyle: 'italic' },
      { token: 'function', foreground: '50fa7b' },
    ],
    colors: {
      'editor.background': '#282a36',
      'editor.foreground': '#f8f8f2',
      'editor.selectionBackground': '#44475a',
      'editor.lineHighlightBackground': '#44475a',
      'editorCursor.foreground': '#f8f8f0',
      'editorWhitespace.foreground': '#3B3A32',
    }
  },
  monokai: {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { background: '272822' },
      { token: 'comment', foreground: '75715e' },
      { token: 'string', foreground: 'e6db74' },
      { token: 'number', foreground: 'ae81ff' },
      { token: 'keyword', foreground: 'f92672', fontStyle: 'bold' },
      { token: 'variable', foreground: 'f8f8f2' },
      { token: 'type', foreground: '66d9ef', fontStyle: 'italic' },
      { token: 'function', foreground: 'a6e22e' },
    ],
    colors: {
      'editor.background': '#272822',
      'editor.foreground': '#f8f8f2',
      'editor.selectionBackground': '#49483e',
      'editor.lineHighlightBackground': '#3e3d32',
      'editorCursor.foreground': '#f8f8f0',
      'editorWhitespace.foreground': '#3B3A32',
    }
  },
  githubDark: {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { background: '24292e' },
      { token: 'comment', foreground: '6a737d' },
      { token: 'string', foreground: '9ecbff' },
      { token: 'number', foreground: '79b8ff' },
      { token: 'keyword', foreground: 'd73a49', fontStyle: 'bold' },
      { token: 'variable', foreground: 'e1e4e8' },
      { token: 'type', foreground: 'f9826c', fontStyle: 'italic' },
      { token: 'function', foreground: 'b392f0' },
    ],
    colors: {
      'editor.background': '#24292e',
      'editor.foreground': '#e1e4e8',
      'editor.selectionBackground': '#3392FF22',
      'editor.lineHighlightBackground': '#2b3036',
      'editorCursor.foreground': '#c8e1ff',
      'editorWhitespace.foreground': '#444d56',
    }
  }
};
