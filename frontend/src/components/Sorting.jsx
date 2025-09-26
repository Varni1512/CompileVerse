import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Settings, Shuffle, BarChart3, Clock, Zap } from 'lucide-react';

const SortingVisualizer = () => {
  const [array, setArray] = useState([]);
  const [originalArray, setOriginalArray] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentAlgorithm, setCurrentAlgorithm] = useState('bubble');
  const [animationSpeed, setAnimationSpeed] = useState(100);
  const [arraySize, setArraySize] = useState(50);
  const [comparing, setComparing] = useState([]);
  const [swapping, setSwapping] = useState([]);
  const [sorted, setSorted] = useState([]);
  const [pivot, setPivot] = useState(-1);
  const [currentStep, setCurrentStep] = useState('');
  const [stats, setStats] = useState({ comparisons: 0, swaps: 0, time: 0 });
  const [isPaused, setIsPaused] = useState(false);

  const algorithms = {
    bubble: { name: 'Bubble Sort', complexity: 'O(n²)', space: 'O(1)' },
    selection: { name: 'Selection Sort', complexity: 'O(n²)', space: 'O(1)' },
    insertion: { name: 'Insertion Sort', complexity: 'O(n²)', space: 'O(1)' },
    merge: { name: 'Merge Sort', complexity: 'O(n log n)', space: 'O(n)' },
    quick: { name: 'Quick Sort', complexity: 'O(n log n)', space: 'O(log n)' },
    heap: { name: 'Heap Sort', complexity: 'O(n log n)', space: 'O(1)' },
    counting: { name: 'Counting Sort', complexity: 'O(n + k)', space: 'O(k)' },
    radix: { name: 'Radix Sort', complexity: 'O(d × n)', space: 'O(n + k)' },
    bucket: { name: 'Bucket Sort', complexity: 'O(n²)', space: 'O(n)' }
  };

  useEffect(() => {
    generateArray();
  }, [arraySize]);

  const generateArray = () => {
    const newArray = Array.from({ length: arraySize }, () => 
      Math.floor(Math.random() * 400) + 10
    );
    setArray([...newArray]);
    setOriginalArray([...newArray]);
    resetVisualization();
  };

  const resetVisualization = () => {
    setComparing([]);
    setSwapping([]);
    setSorted([]);
    setPivot(-1);
    setCurrentStep('');
    setStats({ comparisons: 0, swaps: 0, time: 0 });
    setIsAnimating(false);
    setIsPaused(false);
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const updateStats = (type) => {
    setStats(prev => ({
      ...prev,
      [type]: prev[type] + 1
    }));
  };

  // Bubble Sort
  const bubbleSort = async (arr) => {
    const newArray = [...arr];
    const n = newArray.length;
    
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        if (isPaused) await waitForResume();
        
        setCurrentStep(`Comparing elements at positions ${j} and ${j + 1}`);
        setComparing([j, j + 1]);
        updateStats('comparisons');
        await sleep(animationSpeed);
        
        if (newArray[j] > newArray[j + 1]) {
          setCurrentStep(`Swapping elements at positions ${j} and ${j + 1}`);
          setSwapping([j, j + 1]);
          updateStats('swaps');
          
          [newArray[j], newArray[j + 1]] = [newArray[j + 1], newArray[j]];
          setArray([...newArray]);
          await sleep(animationSpeed);
          setSwapping([]);
        }
        
        setComparing([]);
      }
      setSorted(prev => [...prev, n - 1 - i]);
    }
    setSorted(prev => [...prev, 0]);
    setCurrentStep('Bubble Sort completed!');
  };

  // Selection Sort
  const selectionSort = async (arr) => {
    const newArray = [...arr];
    const n = newArray.length;
    
    for (let i = 0; i < n - 1; i++) {
      let minIdx = i;
      setCurrentStep(`Finding minimum element from position ${i}`);
      
      for (let j = i + 1; j < n; j++) {
        if (isPaused) await waitForResume();
        
        setComparing([minIdx, j]);
        updateStats('comparisons');
        await sleep(animationSpeed);
        
        if (newArray[j] < newArray[minIdx]) {
          minIdx = j;
        }
      }
      
      if (minIdx !== i) {
        setCurrentStep(`Swapping elements at positions ${i} and ${minIdx}`);
        setSwapping([i, minIdx]);
        updateStats('swaps');
        
        [newArray[i], newArray[minIdx]] = [newArray[minIdx], newArray[i]];
        setArray([...newArray]);
        await sleep(animationSpeed);
        setSwapping([]);
      }
      
      setSorted(prev => [...prev, i]);
      setComparing([]);
    }
    setSorted(prev => [...prev, n - 1]);
    setCurrentStep('Selection Sort completed!');
  };

  // Insertion Sort
  const insertionSort = async (arr) => {
    const newArray = [...arr];
    const n = newArray.length;
    setSorted([0]);
    
    for (let i = 1; i < n; i++) {
      const key = newArray[i];
      let j = i - 1;
      
      setCurrentStep(`Inserting element ${key} into sorted portion`);
      setComparing([i]);
      await sleep(animationSpeed);
      
      while (j >= 0 && newArray[j] > key) {
        if (isPaused) await waitForResume();
        
        setComparing([j, j + 1]);
        updateStats('comparisons');
        await sleep(animationSpeed);
        
        newArray[j + 1] = newArray[j];
        setArray([...newArray]);
        updateStats('swaps');
        j--;
      }
      
      newArray[j + 1] = key;
      setArray([...newArray]);
      setSorted(prev => [...prev, i]);
      setComparing([]);
    }
    setCurrentStep('Insertion Sort completed!');
  };

  // Merge Sort
  const mergeSort = async (arr, left = 0, right = arr.length - 1) => {
    if (left >= right) return;
    
    const mid = Math.floor((left + right) / 2);
    setCurrentStep(`Dividing array: [${left}...${mid}] and [${mid + 1}...${right}]`);
    setComparing([left, mid, right]);
    await sleep(animationSpeed);
    
    await mergeSort(arr, left, mid);
    await mergeSort(arr, mid + 1, right);
    await merge(arr, left, mid, right);
  };

  const merge = async (arr, left, mid, right) => {
    const leftArr = arr.slice(left, mid + 1);
    const rightArr = arr.slice(mid + 1, right + 1);
    
    let i = 0, j = 0, k = left;
    
    setCurrentStep(`Merging subarrays [${left}...${mid}] and [${mid + 1}...${right}]`);
    
    while (i < leftArr.length && j < rightArr.length) {
      if (isPaused) await waitForResume();
      
      setComparing([k]);
      updateStats('comparisons');
      
      if (leftArr[i] <= rightArr[j]) {
        arr[k] = leftArr[i];
        i++;
      } else {
        arr[k] = rightArr[j];
        j++;
      }
      
      setArray([...arr]);
      updateStats('swaps');
      await sleep(animationSpeed);
      k++;
    }
    
    while (i < leftArr.length) {
      arr[k] = leftArr[i];
      setArray([...arr]);
      i++;
      k++;
    }
    
    while (j < rightArr.length) {
      arr[k] = rightArr[j];
      setArray([...arr]);
      j++;
      k++;
    }
    
    setComparing([]);
  };

  // Quick Sort
  const quickSort = async (arr, low = 0, high = arr.length - 1) => {
    if (low < high) {
      const pi = await partition(arr, low, high);
      await quickSort(arr, low, pi - 1);
      await quickSort(arr, pi + 1, high);
    }
  };

  const partition = async (arr, low, high) => {
    const pivot = arr[high];
    setPivot(high);
    setCurrentStep(`Partitioning with pivot ${pivot} at position ${high}`);
    await sleep(animationSpeed);
    
    let i = low - 1;
    
    for (let j = low; j < high; j++) {
      if (isPaused) await waitForResume();
      
      setComparing([j, high]);
      updateStats('comparisons');
      await sleep(animationSpeed);
      
      if (arr[j] < pivot) {
        i++;
        if (i !== j) {
          setSwapping([i, j]);
          [arr[i], arr[j]] = [arr[j], arr[i]];
          setArray([...arr]);
          updateStats('swaps');
          await sleep(animationSpeed);
          setSwapping([]);
        }
      }
    }
    
    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    setArray([...arr]);
    setPivot(-1);
    setComparing([]);
    return i + 1;
  };

  // Heap Sort
  const heapSort = async (arr) => {
    const n = arr.length;
    
    // Build max heap
    setCurrentStep('Building max heap...');
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
      await heapify(arr, n, i);
    }
    
    // Extract elements from heap
    for (let i = n - 1; i > 0; i--) {
      setCurrentStep(`Moving max element to position ${i}`);
      setSwapping([0, i]);
      [arr[0], arr[i]] = [arr[i], arr[0]];
      setArray([...arr]);
      setSorted(prev => [...prev, i]);
      updateStats('swaps');
      await sleep(animationSpeed);
      setSwapping([]);
      
      await heapify(arr, i, 0);
    }
    setSorted(prev => [...prev, 0]);
    setCurrentStep('Heap Sort completed!');
  };

  const heapify = async (arr, n, i) => {
    let largest = i;
    const left = 2 * i + 1;
    const right = 2 * i + 2;
    
    if (left < n) {
      setComparing([largest, left]);
      updateStats('comparisons');
      await sleep(animationSpeed);
      if (arr[left] > arr[largest]) largest = left;
    }
    
    if (right < n) {
      setComparing([largest, right]);
      updateStats('comparisons');
      await sleep(animationSpeed);
      if (arr[right] > arr[largest]) largest = right;
    }
    
    if (largest !== i) {
      setSwapping([i, largest]);
      [arr[i], arr[largest]] = [arr[largest], arr[i]];
      setArray([...arr]);
      updateStats('swaps');
      await sleep(animationSpeed);
      setSwapping([]);
      await heapify(arr, n, largest);
    }
    
    setComparing([]);
  };

  // Counting Sort
  const countingSort = async (arr) => {
    const max = Math.max(...arr);
    const count = new Array(max + 1).fill(0);
    const output = new Array(arr.length);
    
    setCurrentStep('Counting occurrences of each element...');
    for (let i = 0; i < arr.length; i++) {
      count[arr[i]]++;
      setComparing([i]);
      await sleep(animationSpeed / 2);
    }
    
    setCurrentStep('Calculating cumulative counts...');
    for (let i = 1; i <= max; i++) {
      count[i] += count[i - 1];
    }
    
    setCurrentStep('Placing elements in sorted order...');
    for (let i = arr.length - 1; i >= 0; i--) {
      if (isPaused) await waitForResume();
      
      output[count[arr[i]] - 1] = arr[i];
      count[arr[i]]--;
      
      setComparing([i]);
      updateStats('swaps');
      await sleep(animationSpeed);
    }
    
    for (let i = 0; i < arr.length; i++) {
      arr[i] = output[i];
      setSorted(prev => [...prev, i]);
      setArray([...arr]);
      await sleep(animationSpeed / 3);
    }
    
    setCurrentStep('Counting Sort completed!');
    setComparing([]);
  };

  // Radix Sort
  const radixSort = async (arr) => {
    const max = Math.max(...arr);
    
    for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
      setCurrentStep(`Sorting by digit at position ${Math.log10(exp) + 1}`);
      await countingSortForRadix(arr, exp);
    }
    
    setCurrentStep('Radix Sort completed!');
  };

  const countingSortForRadix = async (arr, exp) => {
    const output = new Array(arr.length);
    const count = new Array(10).fill(0);
    
    for (let i = 0; i < arr.length; i++) {
      count[Math.floor(arr[i] / exp) % 10]++;
    }
    
    for (let i = 1; i < 10; i++) {
      count[i] += count[i - 1];
    }
    
    for (let i = arr.length - 1; i >= 0; i--) {
      if (isPaused) await waitForResume();
      
      const digit = Math.floor(arr[i] / exp) % 10;
      output[count[digit] - 1] = arr[i];
      count[digit]--;
      
      setComparing([i]);
      updateStats('swaps');
      await sleep(animationSpeed);
    }
    
    for (let i = 0; i < arr.length; i++) {
      arr[i] = output[i];
      setArray([...arr]);
      await sleep(animationSpeed / 4);
    }
    
    setComparing([]);
  };

  // Bucket Sort
  const bucketSort = async (arr) => {
    const n = arr.length;
    const max = Math.max(...arr);
    const buckets = Array.from({ length: n }, () => []);
    
    setCurrentStep('Distributing elements into buckets...');
    for (let i = 0; i < n; i++) {
      const bucketIndex = Math.floor((arr[i] / max) * (n - 1));
      buckets[bucketIndex].push(arr[i]);
      setComparing([i]);
      await sleep(animationSpeed);
    }
    
    setCurrentStep('Sorting individual buckets...');
    let index = 0;
    for (let i = 0; i < n; i++) {
      if (buckets[i].length > 0) {
        buckets[i].sort((a, b) => a - b);
        for (const item of buckets[i]) {
          if (isPaused) await waitForResume();
          
          arr[index] = item;
          setSorted(prev => [...prev, index]);
          setArray([...arr]);
          updateStats('swaps');
          await sleep(animationSpeed);
          index++;
        }
      }
    }
    
    setCurrentStep('Bucket Sort completed!');
    setComparing([]);
  };

  const waitForResume = async () => {
    while (isPaused) {
      await sleep(100);
    }
  };

  const startSorting = async () => {
    if (isAnimating) {
      setIsPaused(!isPaused);
      return;
    }
    
    resetVisualization();
    setIsAnimating(true);
    const startTime = Date.now();
    
    const newArray = [...array];
    
    try {
      switch (currentAlgorithm) {
        case 'bubble': await bubbleSort(newArray); break;
        case 'selection': await selectionSort(newArray); break;
        case 'insertion': await insertionSort(newArray); break;
        case 'merge': await mergeSort(newArray); break;
        case 'quick': await quickSort(newArray); break;
        case 'heap': await heapSort(newArray); break;
        case 'counting': await countingSort(newArray); break;
        case 'radix': await radixSort(newArray); break;
        case 'bucket': await bucketSort(newArray); break;
      }
    } catch (error) {
      console.error('Sorting error:', error);
    }
    
    setStats(prev => ({ ...prev, time: Date.now() - startTime }));
    setIsAnimating(false);
    setIsPaused(false);
  };

  const reset = () => {
    setArray([...originalArray]);
    resetVisualization();
  };

  const getBarColor = (index) => {
    if (sorted.includes(index)) return 'bg-green-500';
    if (swapping.includes(index)) return 'bg-red-500';
    if (comparing.includes(index)) return 'bg-yellow-500';
    if (pivot === index) return 'bg-purple-500';
    return 'bg-blue-500';
  };

  const getBarHeight = (value) => {
    const maxHeight = 400;
    const maxValue = Math.max(...array);
    return (value / maxValue) * maxHeight;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            Sorting Algorithms Visualizer
          </h1>
          <p className="text-gray-300 text-lg">
            Interactive visualization of 9 different sorting algorithms
          </p>
        </div>

        {/* Controls */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 mb-6 border border-gray-700">
          <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-4">
            {/* Algorithm Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Algorithm</label>
              <select
                value={currentAlgorithm}
                onChange={(e) => setCurrentAlgorithm(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white text-sm"
                disabled={isAnimating}
              >
                {Object.entries(algorithms).map(([key, algo]) => (
                  <option key={key} value={key}>{algo.name}</option>
                ))}
              </select>
            </div>

            {/* Array Size */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Array Size: {arraySize}
              </label>
              <input
                type="range"
                min="10"
                max="100"
                value={arraySize}
                onChange={(e) => setArraySize(parseInt(e.target.value))}
                className="w-full"
                disabled={isAnimating}
              />
            </div>

            {/* Animation Speed */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Speed: {201 - animationSpeed}ms
              </label>
              <input
                type="range"
                min="1"
                max="200"
                value={201 - animationSpeed}
                onChange={(e) => setAnimationSpeed(201 - parseInt(e.target.value))}
                className="w-full"
                disabled={isAnimating}
              />
            </div>

            {/* Control Buttons */}
            <div className="flex gap-2">
              <button
                onClick={startSorting}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-200 text-sm"
              >
                {isAnimating ? (isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />) : <Play className="w-4 h-4" />}
                {isAnimating ? (isPaused ? 'Resume' : 'Pause') : 'Start'}
              </button>
              
              <button
                onClick={reset}
                className="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-medium flex items-center gap-1 transition-colors duration-200 text-sm"
                disabled={isAnimating && !isPaused}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              
              <button
                onClick={generateArray}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium flex items-center gap-1 transition-colors duration-200 text-sm"
                disabled={isAnimating}
              >
                <Shuffle className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Algorithm Info */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-blue-400">Algorithm</h3>
            </div>
            <p className="text-lg font-semibold">{algorithms[currentAlgorithm].name}</p>
            <p className="text-gray-300 text-sm">Time: {algorithms[currentAlgorithm].complexity}</p>
            <p className="text-gray-300 text-sm">Space: {algorithms[currentAlgorithm].space}</p>
          </div>
          
          <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <h3 className="font-bold text-yellow-400">Statistics</h3>
            </div>
            <p className="text-sm">Comparisons: <span className="font-bold">{stats.comparisons}</span></p>
            <p className="text-sm">Swaps: <span className="font-bold">{stats.swaps}</span></p>
            <p className="text-sm">Array Size: <span className="font-bold">{array.length}</span></p>
          </div>
          
          <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-green-400" />
              <h3 className="font-bold text-green-400">Performance</h3>
            </div>
            <p className="text-sm">Time: <span className="font-bold">{stats.time}ms</span></p>
            <p className="text-sm">Status: <span className={`font-bold ${isAnimating ? 'text-yellow-400' : 'text-green-400'}`}>
              {isAnimating ? (isPaused ? 'Paused' : 'Running') : 'Ready'}
            </span></p>
          </div>
        </div>

        {/* Current Step */}
        {currentStep && (
          <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="animate-pulse w-2 h-2 bg-purple-400 rounded-full" />
              <span className="text-purple-200 font-medium">{currentStep}</span>
            </div>
          </div>
        )}

        {/* Visualization */}
        <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700 overflow-hidden">
          <div className="flex items-end justify-center gap-1 h-96 overflow-x-auto pb-4">
            {array.map((value, index) => (
              <div
                key={`${index}-${value}`}
                className={`${getBarColor(index)} transition-all duration-300 ease-out flex-shrink-0 relative group`}
                style={{
                  height: `${getBarHeight(value)}px`,
                  width: `${Math.max(800 / array.length, 4)}px`,
                  minWidth: '2px'
                }}
              >
                {array.length <= 50 && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    {value}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-6 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span>Unsorted</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded" />
              <span>Comparing</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded" />
              <span>Swapping</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded" />
              <span>Pivot</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span>Sorted</span>
            </div>
          </div>
        </div>

        {/* Algorithm Descriptions */}
        <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(algorithms).map(([key, algo]) => (
            <div
              key={key}
              className={`bg-gray-800/30 rounded-lg p-4 border transition-all duration-200 cursor-pointer ${
                currentAlgorithm === key 
                  ? 'border-blue-500 bg-blue-500/10' 
                  : 'border-gray-700 hover:border-gray-600'
              }`}
              onClick={() => !isAnimating && setCurrentAlgorithm(key)}
            >
              <h3 className="font-bold text-lg mb-2 text-blue-400">{algo.name}</h3>
              <p className="text-sm text-gray-300 mb-1">Time: {algo.complexity}</p>
              <p className="text-sm text-gray-300">Space: {algo.space}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SortingVisualizer;