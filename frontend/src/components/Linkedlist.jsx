import React, { useState, useEffect } from 'react';
import { ChevronRight, Plus, RotateCcw, Play, Pause } from 'lucide-react';

const LinkedListVisualizer = () => {
  const [nodes, setNodes] = useState([{ id: 1, value: 10, x: 100 }]);
  const [inputValue, setInputValue] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationQueue, setAnimationQueue] = useState([]);
  const [highlightedNode, setHighlightedNode] = useState(null);
  const [currentStep, setCurrentStep] = useState('');
  const [insertPosition, setInsertPosition] = useState('end');
  const [insertIndex, setInsertIndex] = useState(0);

  const NODE_WIDTH = 80;
  const NODE_HEIGHT = 60;
  const SPACING = 120;

  useEffect(() => {
    if (animationQueue.length > 0 && !isAnimating) {
      processNextAnimation();
    }
  }, [animationQueue, isAnimating]);

  const processNextAnimation = () => {
    if (animationQueue.length === 0) return;
    
    setIsAnimating(true);
    const nextAnimation = animationQueue[0];
    setAnimationQueue(prev => prev.slice(1));
    
    nextAnimation();
  };

  const addNode = () => {
    if (!inputValue.trim() || isAnimating) return;
    
    const value = parseInt(inputValue) || inputValue;
    const newNode = {
      id: Date.now(),
      value,
      x: -100,
      isNew: true
    };

    if (insertPosition === 'beginning') {
      addToBeginning(newNode);
    } else if (insertPosition === 'end') {
      addToEnd(newNode);
    } else {
      addAtIndex(newNode, insertIndex);
    }
    
    setInputValue('');
  };

  const addToEnd = (newNode) => {
    setCurrentStep('Creating new node...');
    
    const animations = [
      () => {
        setNodes(prev => [...prev, newNode]);
        setTimeout(() => {
          setCurrentStep('Traversing to end of list...');
          animateTraversal(() => {
            setCurrentStep('Linking new node...');
            setTimeout(() => {
              setNodes(prev => prev.map((node, idx) => ({
                ...node,
                x: 100 + idx * SPACING,
                isNew: false
              })));
              setTimeout(() => {
                setCurrentStep('Node added successfully!');
                setHighlightedNode(newNode.id);
                setTimeout(() => {
                  setHighlightedNode(null);
                  setCurrentStep('');
                  setIsAnimating(false);
                }, 1000);
              }, 800);
            }, 500);
          });
        }, 300);
      }
    ];
    
    setAnimationQueue(animations);
  };

  const addToBeginning = (newNode) => {
    setCurrentStep('Creating new node...');
    
    const animations = [
      () => {
        setNodes(prev => [newNode, ...prev]);
        setTimeout(() => {
          setCurrentStep('Updating head pointer...');
          setTimeout(() => {
            setNodes(prev => prev.map((node, idx) => ({
              ...node,
              x: 100 + idx * SPACING,
              isNew: false
            })));
            setTimeout(() => {
              setCurrentStep('Node added at beginning!');
              setHighlightedNode(newNode.id);
              setTimeout(() => {
                setHighlightedNode(null);
                setCurrentStep('');
                setIsAnimating(false);
              }, 1000);
            }, 800);
          }, 500);
        }, 300);
      }
    ];
    
    setAnimationQueue(animations);
  };

  const addAtIndex = (newNode, targetIndex) => {
    const safeIndex = Math.max(0, Math.min(targetIndex, nodes.length));
    setCurrentStep(`Traversing to position ${safeIndex}...`);
    
    const animations = [
      () => {
        animateTraversalToIndex(safeIndex, () => {
          setCurrentStep('Inserting new node...');
          const newNodes = [...nodes];
          newNodes.splice(safeIndex, 0, newNode);
          setNodes(newNodes);
          
          setTimeout(() => {
            setNodes(prev => prev.map((node, idx) => ({
              ...node,
              x: 100 + idx * SPACING,
              isNew: false
            })));
            setTimeout(() => {
              setCurrentStep(`Node inserted at position ${safeIndex}!`);
              setHighlightedNode(newNode.id);
              setTimeout(() => {
                setHighlightedNode(null);
                setCurrentStep('');
                setIsAnimating(false);
              }, 1000);
            }, 800);
          }, 300);
        });
      }
    ];
    
    setAnimationQueue(animations);
  };

  const animateTraversal = (callback) => {
    let currentIndex = 0;
    const traverseNext = () => {
      if (currentIndex < nodes.length) {
        setHighlightedNode(nodes[currentIndex].id);
        setTimeout(() => {
          currentIndex++;
          if (currentIndex < nodes.length) {
            traverseNext();
          } else {
            setHighlightedNode(null);
            callback();
          }
        }, 400);
      } else {
        callback();
      }
    };
    traverseNext();
  };

  const animateTraversalToIndex = (targetIndex, callback) => {
    let currentIndex = 0;
    const traverseNext = () => {
      if (currentIndex <= targetIndex && currentIndex < nodes.length) {
        setHighlightedNode(nodes[currentIndex].id);
        setTimeout(() => {
          currentIndex++;
          if (currentIndex <= targetIndex) {
            traverseNext();
          } else {
            setHighlightedNode(null);
            callback();
          }
        }, 400);
      } else {
        setHighlightedNode(null);
        callback();
      }
    };
    traverseNext();
  };

  const reset = () => {
    if (isAnimating) return;
    setNodes([{ id: 1, value: 10, x: 100 }]);
    setCurrentStep('');
    setHighlightedNode(null);
    setAnimationQueue([]);
  };

  const Node = ({ node, index, isLast }) => (
    <div className="flex items-center">
      <div 
        className={`
          relative bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg
          shadow-lg transform transition-all duration-800 ease-out
          ${highlightedNode === node.id ? 'scale-110 shadow-2xl ring-4 ring-yellow-400' : ''}
          ${node.isNew ? 'animate-bounce' : ''}
        `}
        style={{
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
          transform: `translateX(${node.x - 100 - index * SPACING}px) ${
            highlightedNode === node.id ? 'scale(1.1)' : 'scale(1)'
          }`
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-lg" />
        <div className="relative h-full flex items-center justify-center font-bold text-lg">
          {node.value}
        </div>
        
        {highlightedNode === node.id && (
          <div className="absolute -top-2 -left-2 -right-2 -bottom-2 border-2 border-yellow-400 rounded-lg animate-pulse" />
        )}
        
        <div className="absolute -right-1 top-1/2 transform -translate-y-1/2">
          <div className="w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-sm" />
        </div>
      </div>
      
      {!isLast && (
        <div className="flex items-center mx-4">
          <div className="w-8 h-0.5 bg-gradient-to-r from-green-400 to-green-500 relative">
            <ChevronRight className="absolute -right-2 -top-2 w-5 h-5 text-green-500" />
          </div>
        </div>
      )}
      
      {isLast && (
        <div className="flex items-center mx-4">
          <div className="w-8 h-0.5 bg-gradient-to-r from-gray-300 to-gray-400 relative">
            <div className="absolute -right-1 -top-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">×</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            Advanced Linked List Visualizer
          </h1>
          <p className="text-gray-300 text-lg">
            Watch how nodes are dynamically added to a linked list with smooth animations
          </p>
        </div>

        {/* Controls */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 mb-8 border border-gray-700">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Node Value
              </label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                placeholder="Enter value..."
                disabled={isAnimating}
                onKeyPress={(e) => e.key === 'Enter' && addNode()}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Insert Position
              </label>
              <select
                value={insertPosition}
                onChange={(e) => setInsertPosition(e.target.value)}
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                disabled={isAnimating}
              >
                <option value="beginning">Beginning</option>
                <option value="end">End</option>
                <option value="index">At Index</option>
              </select>
            </div>
            
            {insertPosition === 'index' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Index
                </label>
                <input
                  type="number"
                  value={insertIndex}
                  onChange={(e) => setInsertIndex(parseInt(e.target.value) || 0)}
                  className="w-20 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                  min="0"
                  max={nodes.length}
                  disabled={isAnimating}
                />
              </div>
            )}
            
            <button
              onClick={addNode}
              disabled={!inputValue.trim() || isAnimating}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg font-medium flex items-center gap-2 transition-all duration-200 shadow-lg disabled:cursor-not-allowed"
            >
              {isAnimating ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add Node
                </>
              )}
            </button>
            
            <button
              onClick={reset}
              disabled={isAnimating}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors duration-200 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>

        {/* Status */}
        {currentStep && (
          <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="animate-pulse w-2 h-2 bg-purple-400 rounded-full" />
              <span className="text-purple-200 font-medium">{currentStep}</span>
            </div>
          </div>
        )}

        {/* Visualization */}
        <div className="bg-gray-800/30 rounded-xl p-8 border border-gray-700 overflow-x-auto">
          <div className="min-w-max">
            <div className="flex items-center mb-6">
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg mr-6">
                HEAD
              </div>
              <div className="w-8 h-0.5 bg-gradient-to-r from-green-400 to-green-500 relative">
                <ChevronRight className="absolute -right-2 -top-2 w-5 h-5 text-green-500" />
              </div>
            </div>
            
            <div className="flex items-center">
              {nodes.map((node, index) => (
                <Node
                  key={node.id}
                  node={node}
                  index={index}
                  isLast={index === nodes.length - 1}
                />
              ))}
            </div>
            
            <div className="mt-8 text-sm text-gray-400">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded" />
                  <span>Data Node</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full" />
                  <span>Pointer</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">×</span>
                  </div>
                  <span>NULL</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Panel */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold mb-4 text-blue-400">How It Works</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• Each node contains data and a pointer to the next node</li>
              <li>• New nodes can be inserted at beginning, end, or any position</li>
              <li>• Watch the traversal animation to understand the process</li>
              <li>• The last node always points to NULL (×)</li>
            </ul>
          </div>
          
          <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold mb-4 text-green-400">Current List Info</h3>
            <div className="space-y-2 text-gray-300">
              <div>Length: <span className="font-bold text-white">{nodes.length}</span></div>
              <div>Values: <span className="font-bold text-white">{nodes.map(n => n.value).join(' → ')}</span></div>
              <div>Status: <span className="font-bold text-white">{isAnimating ? 'Animating' : 'Ready'}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinkedListVisualizer;