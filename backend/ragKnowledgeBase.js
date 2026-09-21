/**
 * CompileVerse RAG Knowledge Base
 * Curated repository of language specifications, standard libraries,
 * common runtime pitfalls, and standard algorithmic patterns for C++, Java, and Python.
 */

const KNOWLEDGE_DOCS = [
  // --- C++ KNOWLEDGE ---
  {
    id: "cpp-vector-bounds",
    language: "cpp",
    topic: "C++ std::vector bounds, iterators, and memory",
    keywords: ["vector", "subscript", "out_of_range", "segmentation fault", "segfault", "index", "push_back", "size"],
    content: `C++ std::vector Official Reference:
1. Indexing & Bounds:
   - 'vec[i]' does NOT perform bounds checking. Accessing 'i >= vec.size()' causes Undefined Behavior (UB) or Segmentation Fault.
   - 'vec.at(i)' performs bounds checking and throws 'std::out_of_range' if out of bounds.
   - Vector indices are 0-indexed: valid range is 0 to vec.size() - 1. A common bug is writing 'for (int i = 0; i <= vec.size(); i++)', which accesses out of bounds when i == vec.size(). Correct loop: 'for (int i = 0; i < vec.size(); i++)'.
2. Iterator Invalidation:
   - Calling 'push_back' or 'insert' can trigger reallocation, invalidating all existing iterators, pointers, and references to elements.
3. Complexity:
   - 'push_back': Amortized O(1)
   - 'vec[i]': O(1) random access
   - Insertion/Deletion at middle or front: O(N) due to element shifting.`
  },
  {
    id: "cpp-unordered-map",
    language: "cpp",
    topic: "C++ std::unordered_map vs std::map",
    keywords: ["map", "unordered_map", "hash", "key", "lookup", "count", "find"],
    content: `C++ Associative Containers Reference:
1. std::unordered_map:
   - Implemented as a Hash Table.
   - Average Time Complexity: O(1) for insert, search, and delete.
   - Worst case: O(N) when hash collisions occur.
   - Accessing 'map[key]' automatically inserts a default-initialized value if the key does not exist! To check existence without modifying the map, use 'map.find(key) != map.end()' or 'map.count(key)'.
2. std::map:
   - Implemented as a Self-Balancing Red-Black Tree.
   - Time Complexity: O(log N) guaranteed for insert, search, delete.
   - Elements are always stored in sorted order according to their keys.`
  },
  {
    id: "cpp-pointers-memory",
    language: "cpp",
    topic: "C++ Pointers, References, and Memory Safety",
    keywords: ["pointer", "nullptr", "segmentation", "segfault", "core dumped", "reference", "delete", "malloc", "free"],
    content: `C++ Memory Safety Guidelines:
1. Segmentation Fault (Signal 11 / SIGSEGV):
   - Caused by dereferencing a nullptr, wild/uninitialized pointer, or accessing memory not owned by the program.
   - Always initialize pointers: 'int* ptr = nullptr;'.
   - Always verify 'if (ptr != nullptr)' before dereferencing '*ptr' or 'ptr->val'.
2. Pass-by-Reference vs Pass-by-Value:
   - Passing large objects (e.g. 'vector<int> v') by value creates a full copy (O(N) time and memory).
   - Use 'const vector<int>& v' for read-only parameters or 'vector<int>& v' to mutate in-place.`
  },
  {
    id: "cpp-fast-io",
    language: "cpp",
    topic: "C++ Fast I/O and Standard Stream Performance",
    keywords: ["cin", "cout", "fast io", "tle", "time limit", "endl", "\n", "ios_base"],
    content: `C++ Competitive Programming I/O Optimization:
1. Fast I/O:
   - By default, 'std::cin' and 'std::cout' synchronize with C stdio ('scanf'/'printf'), which slows execution.
   - Add at the beginning of main():
     'ios_base::sync_with_stdio(false);'
     'cin.tie(NULL);'
2. 'endl' vs '\\n':
   - 'std::endl' inserts a newline AND flushes the stream buffer ('fflush'), causing massive overhead in tight loops (leading to TLE).
   - Use '\\n' instead of 'endl' in competitive programming.`
  },

  // --- PYTHON KNOWLEDGE ---
  {
    id: "py-list-indexing",
    language: "py",
    topic: "Python Lists, Indexing, and Bounds",
    keywords: ["indexerror", "list index out of range", "index", "slice", "append", "pop", "list"],
    content: `Python List Indexing & Memory Reference:
1. IndexError: list index out of range:
   - Occurs when accessing an index 'i >= len(lst)' or 'i < -len(lst)'.
   - Python lists are 0-indexed: valid positive indices are 0 to 'len(lst) - 1'.
   - In 'for i in range(len(lst)):', 'i' is always valid. In manual while loops, ensure 'while i < len(lst):'.
2. Slicing Behavior:
   - Slicing 'lst[start:end]' NEVER raises IndexError even if bounds exceed list length; it gracefully returns available elements.
   - Slicing creates a NEW shallow copy of the sublist (O(K) time and memory where K is slice length).
3. Complexities:
   - 'lst.append(x)' and 'lst.pop()': O(1) amortized.
   - 'lst.insert(0, x)' or 'lst.pop(0)': O(N) because all subsequent elements shift in memory. Use 'collections.deque' for O(1) front operations.`
  },
  {
    id: "py-collections",
    language: "py",
    topic: "Python collections (Counter, defaultdict, deque)",
    keywords: ["counter", "defaultdict", "deque", "collections", "frequency", "hashmap"],
    content: `Python Collections Standard Library Reference:
1. collections.Counter:
   - Special dict subclass for counting hashable objects.
   - Example: 'count = collections.Counter(nums)' -> O(N) time, O(U) space where U is unique elements.
   - Accessing a non-existent key returns 0 instead of raising KeyError: 'count["missing"] == 0'.
   - 'count.most_common(k)': Returns the k most frequent elements in O(N log k) time using a heap.
2. collections.defaultdict:
   - 'd = collections.defaultdict(list)' provides a default factory; accessing 'd[key]' initializes an empty list if absent.
3. collections.deque:
   - Double-ended queue implemented as a doubly-linked list / block-based queue.
   - 'append()', 'appendleft()', 'pop()', 'popleft()' are all guaranteed O(1) operations.`
  },
  {
    id: "py-heapq",
    language: "py",
    topic: "Python heapq module (Priority Queues)",
    keywords: ["heapq", "heappush", "heappop", "priority queue", "min heap", "max heap"],
    content: `Python heapq Standard Library Reference:
1. Min-Heap by Default:
   - Python's 'heapq' provides an in-place min-heap on top of standard Python lists.
   - 'heapq.heapify(nums)': Converts list to min-heap in O(N) linear time.
   - 'heapq.heappush(heap, item)': Pushes item, O(log N) time.
   - 'heapq.heappop(heap)': Pops and returns smallest element, O(log N) time. Smallest element is always at 'heap[0]'.
2. Max-Heap Implementation:
   - Store negated values: 'heapq.heappush(heap, -val)' and negate upon retrieval: '-heapq.heappop(heap)'.`
  },
  {
    id: "py-recursion-limit",
    language: "py",
    topic: "Python Recursion Limit and RecursionError",
    keywords: ["recursionerror", "maximum recursion depth", "recursion", "dfs", "stack overflow"],
    content: `Python Recursion Guidelines:
1. RecursionError: maximum recursion depth exceeded:
   - Python's default recursion limit is 1000 calls.
   - For deep tree or graph traversals (e.g. N = 10^5):
     'import sys'
     'sys.setrecursionlimit(200000)'
   - Alternatively, convert recursive DFS to an iterative approach using an explicit Python list as a stack.`
  },

  // --- JAVA KNOWLEDGE ---
  {
    id: "java-null-pointer",
    language: "java",
    topic: "Java NullPointerException (NPE) Root Causes and Fixes",
    keywords: ["nullpointerexception", "npe", "null", "pointer", "exception"],
    content: `Java NullPointerException Reference:
1. Root Causes:
   - Calling an instance method on a null reference: 'obj.method()'.
   - Accessing or modifying a field of a null reference: 'node.next.val' when 'node.next' is null.
   - Taking the length of null: 'arr.length' or 'str.length()'.
   - Autoboxing a null wrapper: 'Integer x = null; int y = x;' throws NPE.
2. Prevention:
   - Always check for null before chained traversal: 'if (node != null && node.next != null)'.
   - When comparing Strings, use literals on the left: '"target".equals(str)' instead of 'str.equals("target")'.
   - Initialize array elements: 'int[][] dp = new int[n][m];' initializes with 0, but 'Object[] arr = new Object[n];' contains all nulls until assigned.`
  },
  {
    id: "java-collections",
    language: "java",
    topic: "Java Collections Framework (ArrayList, HashMap, HashSet)",
    keywords: ["arraylist", "hashmap", "hashset", "list", "map", "set", "collections", "iterator"],
    content: `Java Collections Reference:
1. ArrayList:
   - Backed by dynamic array.
   - Fast random access: 'list.get(index)' is O(1).
   - 'IndexOutOfBoundsException' thrown if 'index < 0 || index >= list.size()'.
2. HashMap:
   - Key-value mapping using hash buckets.
   - 'map.put(key, val)', 'map.get(key)', 'map.containsKey(key)' are O(1) average.
   - 'map.getOrDefault(key, defaultValue)' avoids null checks: 'map.put(num, map.getOrDefault(num, 0) + 1);'.
3. ConcurrentModificationException:
   - Occurs when modifying a Collection while iterating over it via for-each loop. Use 'Iterator.remove()' or 'removeIf()'.`
  },
  {
    id: "java-string-builder",
    language: "java",
    topic: "Java String vs StringBuilder in Loops",
    keywords: ["string", "stringbuilder", "concat", "tle", "performance"],
    content: `Java String Performance Reference:
1. String Immutability:
   - In Java, 'String' is immutable. Doing 'str += ch' inside a loop of size N creates N new String objects, resulting in O(N^2) time complexity and memory thrashing.
2. StringBuilder:
   - Always use 'StringBuilder' for dynamic concatenation in loops:
     'StringBuilder sb = new StringBuilder();'
     'sb.append(ch);'
     'String result = sb.toString();'
   - StringBuilder runs in O(N) total time for N appends.`
  },

  // --- DSA & ALGORITHMIC PATTERNS ---
  {
    id: "dsa-sliding-window",
    language: "general",
    topic: "Sliding Window Pattern (Subarrays / Substrings)",
    keywords: ["sliding window", "subarray", "substring", "window", "two pointers", "longest", "minimum window"],
    content: `Algorithmic Pattern: Sliding Window
1. When to Use:
   - Contiguous sequence problems (subarrays, substrings) requiring max/min/target sum, or unique characters.
2. Canonical Structure (O(N) time, O(K) space):
   - Maintain 'left = 0' and expand 'right' from 0 to N - 1.
   - Add 'arr[right]' into window state (hashmap/frequency counter/running sum).
   - While window condition is violated (or invalid), shrink from 'left': update state and 'left++'.
   - Update global answer with current window length: 'ans = max(ans, right - left + 1)'.
3. Complexity:
   - Time: O(N) because both 'left' and 'right' pointers advance at most N times.`
  },
  {
    id: "dsa-two-pointers",
    language: "general",
    topic: "Two Pointers Pattern (Sorted Arrays & Palindromes)",
    keywords: ["two pointers", "pointers", "sorted", "palindrome", "target sum", "reverse"],
    content: `Algorithmic Pattern: Two Pointers
1. When to Use:
   - Sorted arrays (e.g. Two Sum II, 3Sum, Container With Most Water), palindrome verification, or array partitioning.
2. Canonical Structure:
   - Initialize 'left = 0', 'right = arr.length - 1'.
   - Calculate 'current = arr[left] + arr[right]'.
   - If 'current == target', return indices.
   - If 'current < target', increase sum by moving 'left++'.
   - If 'current > target', decrease sum by moving 'right--'.
3. Complexity:
   - Time: O(N) if already sorted, or O(N log N) with sorting.`
  },
  {
    id: "dsa-binary-search",
    language: "general",
    topic: "Binary Search Boundary Conditions and Invariants",
    keywords: ["binary search", "search", "sorted", "mid", "log n", "lower_bound"],
    content: `Algorithmic Pattern: Binary Search
1. Invariants & Loop Condition:
   - Range [low, high]: Use 'while (low <= high)'.
   - Avoid integer overflow when calculating mid:
     Use 'int mid = low + (high - low) / 2;' instead of '(low + high) / 2'.
2. Search Space Updates:
   - If 'target > arr[mid]', then target can only be in right half: 'low = mid + 1'.
   - If 'target < arr[mid]', then target can only be in left half: 'high = mid - 1'.
   - If 'target == arr[mid]', return 'mid'.
3. Complexity:
   - Time: O(log N), Space: O(1).`
  },
  {
    id: "dsa-dynamic-programming",
    language: "general",
    topic: "Dynamic Programming (State Transitions and Memoization)",
    keywords: ["dynamic programming", "dp", "memoization", "tabulation", "knapsack", "subproblems"],
    content: `Algorithmic Pattern: Dynamic Programming
1. Core Principles:
   - Overlapping Subproblems: The same subproblems are solved repeatedly.
   - Optimal Substructure: Optimal solution to problem incorporates optimal solutions to subproblems.
2. Approaches:
   - Top-Down (Memoization): Recursion + Cache/HashMap/Table.
   - Bottom-Up (Tabulation): Iterative table filling based on base cases.
3. Space Optimization:
   - If current state 'dp[i]' depends only on 'dp[i-1]' and 'dp[i-2]' (e.g. Fibonacci, Climbing Stairs, House Robber), space can be reduced from O(N) to O(1) using variables.`
  }
];

module.exports = {
  KNOWLEDGE_DOCS
};
