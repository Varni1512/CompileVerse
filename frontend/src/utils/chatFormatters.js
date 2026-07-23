export const extractCodeBlocks = (text) => {
  if (!text) return [];
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  const codeBlocks = [];
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    codeBlocks.push({
      lang: match[1] || 'plaintext',
      code: match[2].trim(),
      startIndex: match.index,
      endIndex: match.index + match[0].length
    });
  }

  return codeBlocks;
};

export const formatAiReview = (text) => {
  if (!text) return null;
  const codeBlocks = extractCodeBlocks(text);
  return [{
    content: text,
    codeBlocks: codeBlocks
  }];
};
