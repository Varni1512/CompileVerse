import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Plus, Minus, Search, Trash2, Settings } from 'lucide-react';

const TreeVisualizationPlatform = () => {
  const [selectedTree, setSelectedTree] = useState('binary');
  const [isAnimating, setIsAnimating] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [trees, setTrees] = useState({
    binary: null,
    bst: null,
    avl: null,
    redblack: null,
    heap: null,
    trie: null,
    segment: null,
    fenwick: null
  });
  const [animationSpeed, setAnimationSpeed] = useState(1000);
  const [theme, setTheme] = useState('dark');

  // Tree Node Classes
  class TreeNode {
    constructor(value, x = 0, y = 0) {
      this.value = value;
      this.left = null;
      this.right = null;
      this.x = x;
      this.y = y;
      this.height = 1;
      this.color = 'red'; // for red-black trees
      this.highlighted = false;
      this.visited = false;
    }
  }

  class TrieNode {
    constructor() {
      this.children = {};
      this.isEndOfWord = false;
      this.x = 0;
      this.y = 0;
      this.highlighted = false;
    }
  }

  // Tree operations
  const insertBST = (root, value) => {
    if (!root) return new TreeNode(value);
    
    if (value < root.value) {
      root.left = insertBST(root.left, value);
    } else if (value > root.value) {
      root.right = insertBST(root.right, value);
    }
    return root;
  };

  const insertAVL = (root, value) => {
    if (!root) return new TreeNode(value);
    
    if (value < root.value) {
      root.left = insertAVL(root.left, value);
    } else if (value > root.value) {
      root.right = insertAVL(root.right, value);
    } else {
      return root;
    }

    root.height = 1 + Math.max(getHeight(root.left), getHeight(root.right));
    const balance = getBalance(root);

    if (balance > 1 && value < root.left.value) {
      return rightRotate(root);
    }
    if (balance < -1 && value > root.right.value) {
      return leftRotate(root);
    }
    if (balance > 1 && value > root.left.value) {
      root.left = leftRotate(root.left);
      return rightRotate(root);
    }
    if (balance < -1 && value < root.right.value) {
      root.right = rightRotate(root.right);
      return leftRotate(root);
    }

    return root;
  };

  const getHeight = (node) => node ? node.height : 0;
  const getBalance = (node) => node ? getHeight(node.left) - getHeight(node.right) : 0;

  const rightRotate = (y) => {
    const x = y.left;
    const T2 = x.right;
    x.right = y;
    y.left = T2;
    y.height = Math.max(getHeight(y.left), getHeight(y.right)) + 1;
    x.height = Math.max(getHeight(x.left), getHeight(x.right)) + 1;
    return x;
  };

  const leftRotate = (x) => {
    const y = x.right;
    const T2 = y.left;
    y.left = x;
    x.right = T2;
    x.height = Math.max(getHeight(x.left), getHeight(x.right)) + 1;
    y.height = Math.max(getHeight(y.left), getHeight(y.right)) + 1;
    return y;
  };

  const insertHeap = (heap, value) => {
    const newHeap = [...heap, value];
    heapifyUp(newHeap, newHeap.length - 1);
    return newHeap;
  };

  const heapifyUp = (heap, index) => {
    if (index === 0) return;
    const parentIndex = Math.floor((index - 1) / 2);
    if (heap[parentIndex] < heap[index]) {
      [heap[parentIndex], heap[index]] = [heap[index], heap[parentIndex]];
      heapifyUp(heap, parentIndex);
    }
  };

  const insertTrie = (root, word) => {
    if (!root) root = new TrieNode();
    let current = root;
    
    for (let char of word) {
      if (!current.children[char]) {
        current.children[char] = new TrieNode();
      }
      current = current.children[char];
    }
    current.isEndOfWord = true;
    return root;
  };

  // Position calculation for tree layout
  const calculatePositions = (node, x = 400, y = 80, level = 0, offset = 200) => {
    if (!node) return;
    
    node.x = x;
    node.y = y;
    
    const nextOffset = offset * 0.6;
    if (node.left) {
      calculatePositions(node.left, x - offset, y + 80, level + 1, nextOffset);
    }
    if (node.right) {
      calculatePositions(node.right, x + offset, y + 80, level + 1, nextOffset);
    }
  };

  const calculateTriePositions = (node, x = 400, y = 80, level = 0) => {
    if (!node) return;
    
    node.x = x;
    node.y = y;
    
    const children = Object.keys(node.children);
    const startX = x - (children.length - 1) * 30;
    
    children.forEach((char, index) => {
      calculateTriePositions(
        node.children[char], 
        startX + index * 60, 
        y + 80, 
        level + 1
      );
    });
  };

  const calculateHeapPositions = (heap) => {
    const positions = [];
    for (let i = 0; i < heap.length; i++) {
      const level = Math.floor(Math.log2(i + 1));
      const posInLevel = i - (Math.pow(2, level) - 1);
      const totalInLevel = Math.pow(2, level);
      const x = 400 + (posInLevel - totalInLevel / 2) * (400 / totalInLevel);
      const y = 80 + level * 80;
      positions.push({ x, y, value: heap[i] });
    }
    return positions;
  };

  // Handle tree operations
  const handleInsert = () => {
    if (!inputValue.trim()) return;
    
    setIsAnimating(true);
    const value = selectedTree === 'trie' ? inputValue : parseInt(inputValue);
    
    setTimeout(() => {
      setTrees(prev => {
        const newTrees = { ...prev };
        
        switch (selectedTree) {
          case 'binary':
          case 'bst':
            newTrees[selectedTree] = insertBST(prev[selectedTree], value);
            calculatePositions(newTrees[selectedTree]);
            break;
          case 'avl':
            newTrees[selectedTree] = insertAVL(prev[selectedTree], value);
            calculatePositions(newTrees[selectedTree]);
            break;
          case 'heap':
            newTrees[selectedTree] = insertHeap(prev[selectedTree] || [], value);
            break;
          case 'trie':
            newTrees[selectedTree] = insertTrie(prev[selectedTree], value);
            calculateTriePositions(newTrees[selectedTree]);
            break;
        }
        
        return newTrees;
      });
      
      setInputValue('');
      setIsAnimating(false);
    }, animationSpeed / 2);
  };

  const handleClear = () => {
    setTrees(prev => ({ ...prev, [selectedTree]: null }));
  };

  const renderTreeNode = (node, parentX = null, parentY = null) => {
    if (!node) return null;
    
    return (
      <g key={`${node.x}-${node.y}-${node.value}`}>
        {/* Connection line to parent */}
        {parentX !== null && parentY !== null && (
          <line
            x1={parentX}
            y1={parentY}
            x2={node.x}
            y2={node.y}
            stroke={theme === 'dark' ? '#4f46e5' : '#6366f1'}
            strokeWidth="2"
            className="transition-all duration-500"
            opacity={node.highlighted ? 1 : 0.7}
          />
        )}
        
        {/* Node circle */}
        <circle
          cx={node.x}
          cy={node.y}
          r="25"
          fill={node.highlighted ? '#fbbf24' : (theme === 'dark' ? '#1e293b' : '#f8fafc')}
          stroke={node.color === 'red' ? '#ef4444' : '#4f46e5'}
          strokeWidth="3"
          className="transition-all duration-500 hover:stroke-width-4 cursor-pointer"
          style={{
            filter: node.highlighted ? 'drop-shadow(0 0 10px #fbbf24)' : 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
            transform: `scale(${node.visited ? 1.1 : 1})`
          }}
        />
        
        {/* Node value */}
        <text
          x={node.x}
          y={node.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={theme === 'dark' ? '#f1f5f9' : '#0f172a'}
          fontSize="14"
          fontWeight="bold"
          className="pointer-events-none select-none"
        >
          {node.value}
        </text>
        
        {/* Recursive render for children */}
        {renderTreeNode(node.left, node.x, node.y)}
        {renderTreeNode(node.right, node.x, node.y)}
      </g>
    );
  };

  const renderTrieNode = (node, parentX = null, parentY = null, char = '') => {
    if (!node) return null;
    
    return (
      <g key={`${node.x}-${node.y}-${char}`}>
        {/* Connection line to parent */}
        {parentX !== null && parentY !== null && (
          <>
            <line
              x1={parentX}
              y1={parentY}
              x2={node.x}
              y2={node.y}
              stroke={theme === 'dark' ? '#4f46e5' : '#6366f1'}
              strokeWidth="2"
              className="transition-all duration-500"
            />
            {/* Character label on the line */}
            <text
              x={(parentX + node.x) / 2}
              y={(parentY + node.y) / 2 - 5}
              textAnchor="middle"
              fill={theme === 'dark' ? '#fbbf24' : '#f59e0b'}
              fontSize="12"
              fontWeight="bold"
            >
              {char}
            </text>
          </>
        )}
        
        {/* Node circle */}
        <circle
          cx={node.x}
          cy={node.y}
          r="20"
          fill={node.isEndOfWord ? '#10b981' : (theme === 'dark' ? '#1e293b' : '#f8fafc')}
          stroke={theme === 'dark' ? '#4f46e5' : '#6366f1'}
          strokeWidth="2"
          className="transition-all duration-500"
        />
        
        {/* Render children */}
        {Object.entries(node.children).map(([char, child]) =>
          renderTrieNode(child, node.x, node.y, char)
        )}
      </g>
    );
  };

  const renderHeap = (heap) => {
    if (!heap || heap.length === 0) return null;
    
    const positions = calculateHeapPositions(heap);
    
    return (
      <g>
        {positions.map((pos, index) => {
          const parentIndex = Math.floor((index - 1) / 2);
          const hasParent = index > 0;
          
          return (
            <g key={index}>
              {/* Connection to parent */}
              {hasParent && (
                <line
                  x1={positions[parentIndex].x}
                  y1={positions[parentIndex].y}
                  x2={pos.x}
                  y2={pos.y}
                  stroke={theme === 'dark' ? '#4f46e5' : '#6366f1'}
                  strokeWidth="2"
                  className="transition-all duration-500"
                />
              )}
              
              {/* Node */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r="25"
                fill={theme === 'dark' ? '#1e293b' : '#f8fafc'}
                stroke="#4f46e5"
                strokeWidth="3"
                className="transition-all duration-500"
                style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}
              />
              
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={theme === 'dark' ? '#f1f5f9' : '#0f172a'}
                fontSize="14"
                fontWeight="bold"
              >
                {pos.value}
              </text>
            </g>
          );
        })}
      </g>
    );
  };

  const treeTypes = [
    { id: 'binary', name: 'Binary Tree', color: 'from-blue-500 to-cyan-500' },
    { id: 'bst', name: 'Binary Search Tree', color: 'from-green-500 to-emerald-500' },
    { id: 'avl', name: 'AVL Tree', color: 'from-purple-500 to-pink-500' },
    { id: 'redblack', name: 'Red-Black Tree', color: 'from-red-500 to-orange-500' },
    { id: 'heap', name: 'Max Heap', color: 'from-yellow-500 to-amber-500' },
    { id: 'trie', name: 'Trie Tree', color: 'from-indigo-500 to-blue-500' },
    { id: 'segment', name: 'Segment Tree', color: 'from-teal-500 to-green-500' },
    { id: 'fenwick', name: 'Fenwick Tree', color: 'from-pink-500 to-rose-500' }
  ];

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      {/* Header */}
      <div className={`backdrop-blur-lg border-b transition-all duration-500 ${
        theme === 'dark' 
          ? 'bg-gray-900/50 border-gray-700' 
          : 'bg-white/50 border-gray-200'
      }`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold transition-colors duration-500 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                🌳 Advanced Tree Visualization Platform
              </h1>
              <p className={`mt-1 transition-colors duration-500 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Interactive visualization for all tree data structures
              </p>
            </div>
            
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`p-3 rounded-xl transition-all duration-300 hover:scale-110 ${
                theme === 'dark'
                  ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                  : 'bg-gray-700/20 text-gray-700 hover:bg-gray-700/30'
              }`}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </div>

      {/* Tree Type Selector */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {treeTypes.map((tree) => (
            <button
              key={tree.id}
              onClick={() => setSelectedTree(tree.id)}
              className={`relative p-4 rounded-2xl transition-all duration-300 hover:scale-105 hover:rotate-1 ${
                selectedTree === tree.id
                  ? 'shadow-2xl ring-4 ring-white/50'
                  : 'hover:shadow-xl'
              }`}
              style={{
                background: selectedTree === tree.id 
                  ? `linear-gradient(135deg, ${tree.color.split(' ')[1]}, ${tree.color.split(' ')[3]})`
                  : theme === 'dark' 
                    ? 'rgba(30, 41, 59, 0.8)' 
                    : 'rgba(255, 255, 255, 0.8)',
              }}
            >
              <div className={`text-sm font-semibold transition-colors duration-300 ${
                selectedTree === tree.id 
                  ? 'text-white' 
                  : theme === 'dark' 
                    ? 'text-gray-300' 
                    : 'text-gray-700'
              }`}>
                {tree.name}
              </div>
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className={`backdrop-blur-lg rounded-2xl p-6 mb-8 transition-all duration-500 ${
          theme === 'dark' 
            ? 'bg-gray-800/50 border border-gray-700' 
            : 'bg-white/50 border border-gray-200'
        }`}>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              <input
                type={selectedTree === 'trie' ? 'text' : 'number'}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={selectedTree === 'trie' ? 'Enter word' : 'Enter number'}
                className={`px-4 py-2 rounded-xl border-2 transition-all duration-300 focus:scale-105 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-400'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                }`}
                onKeyPress={(e) => e.key === 'Enter' && handleInsert()}
              />
              
              <button
                onClick={handleInsert}
                disabled={isAnimating}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl
                         hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:scale-100
                         shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <Plus size={18} />
                Insert
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search value"
                className={`px-4 py-2 rounded-xl border-2 transition-all duration-300 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
              
              <button className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl
                               hover:scale-105 transition-all duration-300 shadow-lg flex items-center gap-2">
                <Search size={18} />
                Find
              </button>
            </div>

            <button
              onClick={handleClear}
              className="px-6 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl
                       hover:scale-105 transition-all duration-300 shadow-lg flex items-center gap-2"
            >
              <Trash2 size={18} />
              Clear
            </button>

            <div className="flex items-center gap-2">
              <label className={`text-sm font-medium ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Speed:
              </label>
              <input
                type="range"
                min="200"
                max="2000"
                step="200"
                value={animationSpeed}
                onChange={(e) => setAnimationSpeed(parseInt(e.target.value))}
                className="w-20"
              />
            </div>
          </div>
        </div>

        {/* Visualization Area */}
        <div className={`backdrop-blur-lg rounded-2xl p-6 transition-all duration-500 ${
          theme === 'dark' 
            ? 'bg-gray-800/50 border border-gray-700' 
            : 'bg-white/50 border border-gray-200'
        }`}>
          <div className="relative">
            <svg
              width="100%"
              height="600"
              viewBox="0 0 800 600"
              className="rounded-xl overflow-hidden"
              style={{
                background: theme === 'dark' 
                  ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
                  : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
              }}
            >
              {/* Grid Pattern */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke={theme === 'dark' ? '#374151' : '#d1d5db'}
                    strokeWidth="1"
                    opacity="0.5"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* Tree Rendering */}
              {selectedTree === 'heap' && trees[selectedTree] 
                ? renderHeap(trees[selectedTree])
                : selectedTree === 'trie' && trees[selectedTree]
                ? renderTrieNode(trees[selectedTree])
                : trees[selectedTree] && renderTreeNode(trees[selectedTree])
              }
              
              {/* Empty State */}
              {!trees[selectedTree] && (
                <text
                  x="400"
                  y="300"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={theme === 'dark' ? '#6b7280' : '#9ca3af'}
                  fontSize="18"
                  fontWeight="500"
                >
                  Start by inserting values to build your {treeTypes.find(t => t.id === selectedTree)?.name}
                </text>
              )}
            </svg>
          </div>
        </div>

        {/* Tree Information Panel */}
        <div className={`backdrop-blur-lg rounded-2xl p-6 mt-8 transition-all duration-500 ${
          theme === 'dark' 
            ? 'bg-gray-800/50 border border-gray-700' 
            : 'bg-white/50 border border-gray-200'
        }`}>
          <h3 className={`text-xl font-bold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {treeTypes.find(t => t.id === selectedTree)?.name} Information
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className={`font-semibold mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Properties:
              </h4>
              <div className={`text-sm space-y-1 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {selectedTree === 'bst' && (
                  <>
                    <div>• Left subtree values &lt; root value</div>
                    <div>• Right subtree values &gt; root value</div>
                    <div>• In-order traversal gives sorted sequence</div>
                  </>
                )}
                {selectedTree === 'avl' && (
                  <>
                    <div>• Self-balancing binary search tree</div>
                    <div>• Height difference ≤ 1 between subtrees</div>
                    <div>• Guaranteed O(log n) operations</div>
                  </>
                )}
                {selectedTree === 'heap' && (
                  <>
                    <div>• Complete binary tree</div>
                    <div>• Parent ≥ children (max heap)</div>
                    <div>• Efficient priority queue implementation</div>
                  </>
                )}
                {selectedTree === 'trie' && (
                  <>
                    <div>• Prefix tree for string storage</div>
                    <div>• Efficient string search operations</div>
                    <div>• Space-efficient for common prefixes</div>
                  </>
                )}
              </div>
            </div>
            
            <div>
              <h4 className={`font-semibold mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Time Complexity:
              </h4>
              <div className={`text-sm space-y-1 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <div>Search: O(log n)</div>
                <div>Insert: O(log n)</div>
                <div>Delete: O(log n)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TreeVisualizationPlatform;