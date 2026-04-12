import type { Question } from "./questions.js";

export const practicalCodingQuestions: Question[] = [
  // ── Implementation ─────────────────────────────────────

  {
    id: "pc_impl_001",
    category: "practical_coding",
    type: "implementation",
    guest: true,
    title: "LRU Cache",
    prompt: `Design and implement an LRU (Least Recently Used) Cache data structure.

The cache has a fixed capacity. When it reaches capacity and a new key is inserted, the least recently used key must be evicted.

[Operations]
• get(key) → Return the value if key exists, or -1 if not found. Marks the key as recently used.
• put(key, value) → Insert or update a key-value pair. If over capacity, evict the LRU key first.
• Both operations must run in O(1) average time.

[Constraints]
• 1 ≤ capacity ≤ 3,000
• 0 ≤ key ≤ 10,000
• 0 ≤ value ≤ 100,000
• At most 200,000 total calls to get and put

[Examples]
cache = LRUCache(2)
cache.put(1, 10)
cache.put(2, 20)
cache.get(1)      → 10     // key 1 is now most recently used
cache.put(3, 30)            // evicts key 2 (LRU)
cache.get(2)      → -1     // evicted
cache.get(3)      → 30

[Note]
Do not use built-in ordered dictionary or linked hash map. Implement the underlying data structure yourself.`,
    diff: "",
    templates: {
      python: `class LRUCache:
    def __init__(self, capacity: int):
        pass

    def get(self, key: int) -> int:
        pass

    def put(self, key: int, value: int) -> None:
        pass`,
      java: `class LRUCache {
    public LRUCache(int capacity) {

    }

    public int get(int key) {
        return -1;
    }

    public void put(int key, int value) {

    }
}`,
      javascript: `class LRUCache {
    /** @param {number} capacity */
    constructor(capacity) {

    }

    /** @param {number} key  @return {number} */
    get(key) {

    }

    /** @param {number} key  @param {number} value */
    put(key, value) {

    }
}`,
      typescript: `class LRUCache {
    constructor(private capacity: number) {

    }

    get(key: number): number {
        return -1;
    }

    put(key: number, value: number): void {

    }
}`,
      c_cpp: `#include <unordered_map>
using namespace std;

class LRUCache {
public:
    LRUCache(int capacity) {

    }

    int get(int key) {
        return -1;
    }

    void put(int key, int value) {

    }
};`,
      csharp: `public class LRUCache {
    public LRUCache(int capacity) {

    }

    public int Get(int key) {
        return -1;
    }

    public void Put(int key, int value) {

    }
}`,
      rust: `struct LRUCache {
    capacity: usize,
}

impl LRUCache {
    fn new(capacity: i32) -> Self {
        todo!()
    }

    fn get(&mut self, key: i32) -> i32 {
        todo!()
    }

    fn put(&mut self, key: i32, value: i32) {
        todo!()
    }
}`,
      go: `type LRUCache struct {
    capacity int
}

func Constructor(capacity int) LRUCache {
    return LRUCache{}
}

func (c *LRUCache) Get(key int) int {
    return -1
}

func (c *LRUCache) Put(key int, value int) {

}`,
      kotlin: `class LRUCache(private val capacity: Int) {
    fun get(key: Int): Int {
        return -1
    }

    fun put(key: Int, value: Int) {

    }
}`,
    },
    rubric: {
      mustCover: [
        "Uses a hash map for O(1) key lookup combined with a doubly-linked list for O(1) order maintenance.",
        "Correctly evicts the least recently used (tail) node when capacity is exceeded, removing it from both the list and hash map.",
        "On get(), moves the accessed node to the head (most recently used position). On put(), either updates existing and moves to head, or inserts new at head.",
      ],
      strongSignals: [
        "Uses sentinel/dummy head and tail nodes to eliminate null-check edge cases in list operations.",
        "Extracts reusable helpers (addToHead, removeNode, moveToHead) for clean doubly-linked list manipulation.",
        "Handles the update case in put() correctly: updates value AND moves to head, not just one or the other.",
      ],
      weakPatterns: [
        "Uses a built-in ordered dictionary or linked hash map (defeats the purpose of the exercise).",
        "Implements O(n) linear scan to find LRU instead of O(1) doubly-linked list removal.",
      ],
    },
  },

  {
    id: "pc_impl_002",
    category: "practical_coding",
    type: "implementation",
    guest: true,
    title: "Trie (Prefix Tree)",
    prompt: `Implement a Trie (prefix tree) that supports inserting words and searching by exact match or prefix.

[Operations]
• insert(word) → Insert a word into the trie.
• search(word) → Return true if the exact word exists in the trie, false otherwise.
• startsWith(prefix) → Return true if any inserted word starts with the given prefix.

[Constraints]
• All inputs consist of lowercase English letters (a-z) only.
• 1 ≤ word.length, prefix.length ≤ 2,000
• At most 30,000 total calls to insert, search, and startsWith

[Examples]
trie = Trie()
trie.insert("apple")
trie.search("apple")     → true
trie.search("app")       → false   // "app" was not inserted
trie.startsWith("app")   → true    // "apple" starts with "app"
trie.insert("app")
trie.search("app")       → true    // now "app" is inserted

trie.insert("banana")
trie.startsWith("ban")   → true
trie.startsWith("bat")   → false`,
    diff: "",
    templates: {
      python: `class Trie:
    def __init__(self):
        pass

    def insert(self, word: str) -> None:
        pass

    def search(self, word: str) -> bool:
        pass

    def starts_with(self, prefix: str) -> bool:
        pass`,
      java: `class Trie {
    public Trie() {

    }

    public void insert(String word) {

    }

    public boolean search(String word) {
        return false;
    }

    public boolean startsWith(String prefix) {
        return false;
    }
}`,
      javascript: `class Trie {
    constructor() {

    }

    /** @param {string} word */
    insert(word) {

    }

    /** @param {string} word  @return {boolean} */
    search(word) {

    }

    /** @param {string} prefix  @return {boolean} */
    startsWith(prefix) {

    }
}`,
      typescript: `class Trie {
    constructor() {

    }

    insert(word: string): void {

    }

    search(word: string): boolean {
        return false;
    }

    startsWith(prefix: string): boolean {
        return false;
    }
}`,
      c_cpp: `class Trie {
public:
    Trie() {

    }

    void insert(const std::string& word) {

    }

    bool search(const std::string& word) {
        return false;
    }

    bool startsWith(const std::string& prefix) {
        return false;
    }
};`,
      csharp: `public class Trie {
    public Trie() {

    }

    public void Insert(string word) {

    }

    public bool Search(string word) {
        return false;
    }

    public bool StartsWith(string prefix) {
        return false;
    }
}`,
      rust: `struct Trie {
}

impl Trie {
    fn new() -> Self {
        todo!()
    }

    fn insert(&mut self, word: &str) {
        todo!()
    }

    fn search(&self, word: &str) -> bool {
        todo!()
    }

    fn starts_with(&self, prefix: &str) -> bool {
        todo!()
    }
}`,
      go: `type Trie struct {
}

func NewTrie() *Trie {
    return &Trie{}
}

func (t *Trie) Insert(word string) {

}

func (t *Trie) Search(word string) bool {
    return false
}

func (t *Trie) StartsWith(prefix string) bool {
    return false
}`,
      kotlin: `class Trie {
    fun insert(word: String) {

    }

    fun search(word: String): Boolean {
        return false
    }

    fun startsWith(prefix: String): Boolean {
        return false
    }
}`,
    },
    rubric: {
      mustCover: [
        "Uses a tree of nodes where each node has a children map/array (size 26 for a-z) and an isEnd boolean flag.",
        "insert() traverses character by character, creating new child nodes as needed, and marks the final node as end-of-word.",
        "search() and startsWith() both traverse the trie; search additionally checks isEnd on the final node while startsWith does not.",
      ],
      strongSignals: [
        "Extracts a shared helper (e.g., _findNode or _traverse) to avoid duplicating traversal logic between search and startsWith.",
        "Uses a fixed-size array (26) for children instead of a hash map for better cache locality, or explains the tradeoff.",
        "Discusses time complexity: O(m) per operation where m is word/prefix length, O(n*m) space for n words.",
      ],
      weakPatterns: [
        "Stores full words in a set/list and does linear prefix matching — not a trie at all.",
        "Forgets the isEnd flag, causing search('app') to return true when only 'apple' was inserted.",
      ],
    },
  },

  {
    id: "pc_impl_003",
    category: "practical_coding",
    type: "implementation",
    guest: true,
    title: "Min Heap (Priority Queue)",
    prompt: `Implement a Min Heap that always returns the smallest element first.

[Operations]
• push(val) → Add a value to the heap.
• pop() → Remove and return the smallest value. Return -1 if the heap is empty.
• peek() → Return the smallest value without removing it. Return -1 if empty.
• size() → Return the number of elements currently in the heap.

[Constraints]
• -10,000 ≤ val ≤ 10,000
• At most 100,000 total operations
• pop() and peek() on an empty heap return -1

[Examples]
heap = MinHeap()
heap.push(5)
heap.push(3)
heap.push(8)
heap.peek()    → 3
heap.pop()     → 3
heap.pop()     → 5
heap.size()    → 1
heap.push(1)
heap.peek()    → 1
heap.pop()     → 1
heap.pop()     → 8
heap.pop()     → -1   // empty`,
    diff: "",
    templates: {
      python: `class MinHeap:
    def __init__(self):
        pass

    def push(self, val: int) -> None:
        pass

    def pop(self) -> int:
        pass

    def peek(self) -> int:
        pass

    def size(self) -> int:
        pass`,
      java: `class MinHeap {
    public MinHeap() {

    }

    public void push(int val) {

    }

    public int pop() {
        return -1;
    }

    public int peek() {
        return -1;
    }

    public int size() {
        return 0;
    }
}`,
      javascript: `class MinHeap {
    constructor() {

    }

    /** @param {number} val */
    push(val) {

    }

    /** @return {number} */
    pop() {

    }

    /** @return {number} */
    peek() {

    }

    /** @return {number} */
    size() {

    }
}`,
      typescript: `class MinHeap {
    constructor() {

    }

    push(val: number): void {

    }

    pop(): number {
        return -1;
    }

    peek(): number {
        return -1;
    }

    size(): number {
        return 0;
    }
}`,
      c_cpp: `#include <vector>
using namespace std;

class MinHeap {
public:
    MinHeap() {

    }

    void push(int val) {

    }

    int pop() {
        return -1;
    }

    int peek() {
        return -1;
    }

    int size() {
        return 0;
    }
};`,
      csharp: `public class MinHeap {
    public MinHeap() {

    }

    public void Push(int val) {

    }

    public int Pop() {
        return -1;
    }

    public int Peek() {
        return -1;
    }

    public int Size() {
        return 0;
    }
}`,
      rust: `struct MinHeap {
}

impl MinHeap {
    fn new() -> Self {
        todo!()
    }

    fn push(&mut self, val: i32) {
        todo!()
    }

    fn pop(&mut self) -> i32 {
        todo!()
    }

    fn peek(&self) -> i32 {
        todo!()
    }

    fn size(&self) -> usize {
        todo!()
    }
}`,
      go: `type MinHeap struct {
}

func NewMinHeap() *MinHeap {
    return &MinHeap{}
}

func (h *MinHeap) Push(val int) {

}

func (h *MinHeap) Pop() int {
    return -1
}

func (h *MinHeap) Peek() int {
    return -1
}

func (h *MinHeap) Size() int {
    return 0
}`,
      kotlin: `class MinHeap {
    fun push(value: Int) {

    }

    fun pop(): Int {
        return -1
    }

    fun peek(): Int {
        return -1
    }

    fun size(): Int {
        return 0
    }
}`,
    },
    rubric: {
      mustCover: [
        "Uses an array-based binary heap with parent at index i, children at 2i+1 and 2i+2.",
        "Implements siftUp (bubble up) after push and siftDown (heapify down) after pop to restore the heap property.",
        "pop() swaps the root with the last element, removes the last, then sifts down from root. Does not shift the entire array.",
      ],
      strongSignals: [
        "Correctly picks the smaller child during siftDown to maintain min-heap invariant.",
        "Handles edge cases: empty heap returns -1, single-element heap operations work correctly.",
        "Discusses O(log n) push/pop and O(1) peek time complexity.",
      ],
      weakPatterns: [
        "Uses a sorted array with O(n) insertion instead of a proper heap structure.",
        "Uses a built-in priority queue or heap library instead of implementing from scratch.",
      ],
    },
  },

  {
    id: "pc_impl_004",
    category: "practical_coding",
    type: "implementation",
    title: "Token Bucket Rate Limiter",
    prompt: `Implement a Token Bucket rate limiter that controls request throughput.

The bucket holds tokens that refill at a steady rate. Each allowed request consumes one token. Requests are denied when no tokens remain.

[Operations]
• constructor(maxTokens, refillRate) → Create a limiter. The bucket starts full at maxTokens. refillRate is tokens added per second.
• allow(timestamp) → Return true if the request is allowed (consume 1 token), false if denied. Timestamps are in seconds (float), non-decreasing.

[Constraints]
• 1 ≤ maxTokens ≤ 1,000
• 0.1 ≤ refillRate ≤ 1,000.0 (tokens per second)
• Timestamps are non-decreasing floats
• At most 100,000 calls to allow()

[Examples]
limiter = RateLimiter(3, 1.0)   // 3 max, refill 1/sec
limiter.allow(0.0)   → true     // 3→2 tokens
limiter.allow(0.0)   → true     // 2→1
limiter.allow(0.0)   → true     // 1→0
limiter.allow(0.0)   → false    // 0 tokens, denied
limiter.allow(2.5)   → true     // +2.5 tokens refilled (capped at 3), consume 1`,
    diff: "",
    templates: {
      python: `class RateLimiter:
    def __init__(self, max_tokens: int, refill_rate: float):
        pass

    def allow(self, timestamp: float) -> bool:
        pass`,
      java: `class RateLimiter {
    public RateLimiter(int maxTokens, double refillRate) {

    }

    public boolean allow(double timestamp) {
        return false;
    }
}`,
      javascript: `class RateLimiter {
    /** @param {number} maxTokens  @param {number} refillRate */
    constructor(maxTokens, refillRate) {

    }

    /** @param {number} timestamp  @return {boolean} */
    allow(timestamp) {

    }
}`,
      typescript: `class RateLimiter {
    constructor(
        private maxTokens: number,
        private refillRate: number,
    ) {

    }

    allow(timestamp: number): boolean {
        return false;
    }
}`,
      c_cpp: `class RateLimiter {
public:
    RateLimiter(int maxTokens, double refillRate) {

    }

    bool allow(double timestamp) {
        return false;
    }
};`,
      csharp: `public class RateLimiter {
    public RateLimiter(int maxTokens, double refillRate) {

    }

    public bool Allow(double timestamp) {
        return false;
    }
}`,
      rust: `struct RateLimiter {
    max_tokens: f64,
    refill_rate: f64,
}

impl RateLimiter {
    fn new(max_tokens: i32, refill_rate: f64) -> Self {
        todo!()
    }

    fn allow(&mut self, timestamp: f64) -> bool {
        todo!()
    }
}`,
      go: `type RateLimiter struct {
    maxTokens  float64
    refillRate float64
}

func NewRateLimiter(maxTokens int, refillRate float64) *RateLimiter {
    return &RateLimiter{}
}

func (r *RateLimiter) Allow(timestamp float64) bool {
    return false
}`,
      kotlin: `class RateLimiter(private val maxTokens: Int, private val refillRate: Double) {
    fun allow(timestamp: Double): Boolean {
        return false
    }
}`,
    },
    rubric: {
      mustCover: [
        "Tracks the current token count and the last request timestamp. On each call, calculates elapsed time and adds (elapsed * refillRate) tokens, capped at maxTokens.",
        "Deducts one token on allow, returns true. Returns false when tokens < 1 without deducting.",
        "Correctly handles fractional tokens — tokens accumulate continuously, not in discrete steps.",
      ],
      strongSignals: [
        "Does not use timers/intervals; computes refill lazily on each allow() call using elapsed time.",
        "Uses min(currentTokens + elapsed * rate, maxTokens) to cap tokens and avoid overflow.",
        "Handles rapid burst: allows maxTokens requests instantly, then throttles until refill catches up.",
      ],
      weakPatterns: [
        "Uses a fixed-window counter instead of token bucket (not what was asked).",
        "Rounds tokens to integers, losing fractional refill precision.",
      ],
    },
  },

  {
    id: "pc_impl_005",
    category: "practical_coding",
    type: "implementation",
    title: "Binary Search Tree Iterator",
    prompt: `Implement an iterator over a Binary Search Tree (BST) that returns elements in ascending (in-order) order.

[Operations]
• constructor(root) → Initialize the iterator with the root of the BST.
• next() → Return the next smallest element. Guaranteed to be called only when hasNext() is true.
• hasNext() → Return true if there are more elements to iterate.

[Tree Node Structure]
• val: integer value
• left: left child (or null)
• right: right child (or null)

[Constraints]
• 0 ≤ number of nodes ≤ 100,000
• -1,000,000 ≤ node.val ≤ 1,000,000
• next() and hasNext() should run in O(h) amortized time, where h is tree height
• Use O(h) extra space — do NOT flatten the entire tree into a list

[Examples]
Given BST:
      7
     / \\
    3   15
       /  \\
      9   20

iterator = BSTIterator(root)
iterator.next()      → 3
iterator.hasNext()   → true
iterator.next()      → 7
iterator.next()      → 9
iterator.next()      → 15
iterator.next()      → 20
iterator.hasNext()   → false`,
    diff: "",
    templates: {
      python: `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

class BSTIterator:
    def __init__(self, root: TreeNode | None):
        pass

    def next(self) -> int:
        pass

    def has_next(self) -> bool:
        pass`,
      java: `class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int val) { this.val = val; }
}

class BSTIterator {
    public BSTIterator(TreeNode root) {

    }

    public int next() {
        return 0;
    }

    public boolean hasNext() {
        return false;
    }
}`,
      javascript: `class TreeNode {
    constructor(val = 0, left = null, right = null) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}

class BSTIterator {
    /** @param {TreeNode|null} root */
    constructor(root) {

    }

    /** @return {number} */
    next() {

    }

    /** @return {boolean} */
    hasNext() {

    }
}`,
      typescript: `class TreeNode {
    val: number;
    left: TreeNode | null;
    right: TreeNode | null;
    constructor(val = 0, left: TreeNode | null = null, right: TreeNode | null = null) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}

class BSTIterator {
    constructor(root: TreeNode | null) {

    }

    next(): number {
        return 0;
    }

    hasNext(): boolean {
        return false;
    }
}`,
      c_cpp: `#include <stack>
using namespace std;

struct TreeNode {
    int val;
    TreeNode* left;
    TreeNode* right;
    TreeNode(int v) : val(v), left(nullptr), right(nullptr) {}
};

class BSTIterator {
public:
    BSTIterator(TreeNode* root) {

    }

    int next() {
        return 0;
    }

    bool hasNext() {
        return false;
    }
};`,
      csharp: `public class TreeNode {
    public int Val;
    public TreeNode Left, Right;
    public TreeNode(int val) { Val = val; }
}

public class BSTIterator {
    public BSTIterator(TreeNode root) {

    }

    public int Next() {
        return 0;
    }

    public bool HasNext() {
        return false;
    }
}`,
      rust: `use std::rc::Rc;
use std::cell::RefCell;

type TreeLink = Option<Rc<RefCell<TreeNode>>>;

struct TreeNode {
    val: i32,
    left: TreeLink,
    right: TreeLink,
}

struct BSTIterator {
}

impl BSTIterator {
    fn new(root: TreeLink) -> Self {
        todo!()
    }

    fn next(&mut self) -> i32 {
        todo!()
    }

    fn has_next(&self) -> bool {
        todo!()
    }
}`,
      go: `type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

type BSTIterator struct {
}

func NewBSTIterator(root *TreeNode) *BSTIterator {
    return &BSTIterator{}
}

func (it *BSTIterator) Next() int {
    return 0
}

func (it *BSTIterator) HasNext() bool {
    return false
}`,
      kotlin: `class TreeNode(var value: Int, var left: TreeNode? = null, var right: TreeNode? = null)

class BSTIterator(root: TreeNode?) {
    fun next(): Int {
        return 0
    }

    fun hasNext(): Boolean {
        return false
    }
}`,
    },
    rubric: {
      mustCover: [
        "Uses an explicit stack to simulate in-order traversal, pushing all left children of the current node onto the stack.",
        "next() pops from the stack, then pushes all left children of the popped node's right child, yielding values in sorted order.",
        "hasNext() simply checks whether the stack is non-empty, running in O(1).",
      ],
      strongSignals: [
        "Extracts a helper method (pushAllLeft / pushLeft) to reduce duplication between constructor and next().",
        "Achieves O(h) space where h is tree height, not O(n) — does not flatten the tree into an array.",
        "Explains amortized O(1) per next() call even though individual calls may push multiple nodes.",
      ],
      weakPatterns: [
        "Flattens the entire tree into a list in the constructor — O(n) space instead of O(h).",
        "Uses recursive in-order traversal collecting all values upfront, defeating the purpose of an iterator.",
      ],
    },
  },

  {
    id: "pc_impl_006",
    category: "practical_coding",
    type: "implementation",
    title: "Merge K Sorted Arrays",
    prompt: `Given K sorted arrays, merge them into a single sorted array efficiently.

[Input]
• arrays: a list of K arrays, each sorted in ascending order

[Output]
• A single sorted array containing all elements from all input arrays

[Constraints]
• 1 ≤ K ≤ 1,000
• 0 ≤ length of each array ≤ 10,000
• Total elements N ≤ 1,000,000
• -1,000,000 ≤ element value ≤ 1,000,000
• Target: O(N log K) time using a min-heap, not O(N log N) concat+sort

[Examples]
Input:  [[1, 4, 7], [2, 5, 8], [3, 6, 9]]
Output: [1, 2, 3, 4, 5, 6, 7, 8, 9]

Input:  [[1, 3, 5], [2, 4], [0, 6, 7, 8]]
Output: [0, 1, 2, 3, 4, 5, 6, 7, 8]

Input:  [[], [1], [0, 2]]
Output: [0, 1, 2]`,
    diff: "",
    templates: {
      python: `def merge_k_sorted(arrays: list[list[int]]) -> list[int]:
    pass`,
      java: `import java.util.*;

class Solution {
    public int[] mergeKSorted(int[][] arrays) {
        return new int[0];
    }
}`,
      javascript: `/**
 * @param {number[][]} arrays
 * @return {number[]}
 */
function mergeKSorted(arrays) {

}`,
      typescript: `function mergeKSorted(arrays: number[][]): number[] {
    return [];
}`,
      c_cpp: `#include <vector>
#include <queue>
using namespace std;

class Solution {
public:
    vector<int> mergeKSorted(vector<vector<int>>& arrays) {
        return {};
    }
};`,
      csharp: `using System.Collections.Generic;

public class Solution {
    public int[] MergeKSorted(int[][] arrays) {
        return new int[0];
    }
}`,
      rust: `fn merge_k_sorted(arrays: Vec<Vec<i32>>) -> Vec<i32> {
    todo!()
}`,
      go: `func mergeKSorted(arrays [][]int) []int {
    return nil
}`,
      kotlin: `fun mergeKSorted(arrays: List<List<Int>>): List<Int> {
    return emptyList()
}`,
    },
    rubric: {
      mustCover: [
        "Uses a min-heap (priority queue) of size K to track the current smallest element from each array, achieving O(N log K) time.",
        "Each heap entry tracks which array it came from and the current index, enabling retrieval of the next element from the same array.",
        "Initializes the heap with the first element of each non-empty array, then repeatedly extracts the min and pushes the next element from that array.",
      ],
      strongSignals: [
        "Handles empty arrays gracefully (filters them out or skips during initialization).",
        "Pre-allocates the result array with total size N to avoid repeated resizing.",
        "Discusses why O(N log K) is better than O(N log N) when K << N.",
      ],
      weakPatterns: [
        "Concatenates all arrays and sorts with a general-purpose sort — O(N log N) ignoring that inputs are already sorted.",
        "Does K-way merge by repeatedly finding the min with linear scan — O(N*K) instead of O(N log K).",
      ],
    },
  },

  {
    id: "pc_impl_007",
    category: "practical_coding",
    type: "implementation",
    title: "In-Memory Key-Value Store with TTL",
    prompt: `Implement an in-memory key-value store where each entry can optionally expire after a time-to-live (TTL).

[Operations]
• set(key, value, ttl?) → Store a key-value pair. If ttl (seconds) is provided, the entry expires after that many seconds. No ttl = never expires. Re-setting overwrites both value and TTL.
• get(key, timestamp) → Return the value if the key exists and hasn't expired, otherwise return null.
• delete(key) → Remove the key. Return true if it existed, false otherwise.
• count(timestamp) → Return the number of non-expired keys.

[Constraints]
• Keys and values are strings
• 0 ≤ ttl ≤ 86,400 (seconds)
• Timestamps are non-decreasing floats (seconds)
• At most 100,000 total operations

[Examples]
store = KVStore()
store.set("a", "hello", 5.0)       // expires at t=5.0
store.set("b", "world")            // never expires
store.get("a", 3.0)   → "hello"   // still valid
store.get("a", 6.0)   → null      // expired
store.get("b", 100.0) → "world"   // no TTL
store.count(3.0)       → 2
store.count(6.0)       → 1        // "a" expired
store.delete("b")      → true
store.count(6.0)       → 0`,
    diff: "",
    templates: {
      python: `class KVStore:
    def __init__(self):
        pass

    def set(self, key: str, value: str, ttl: float | None = None) -> None:
        pass

    def get(self, key: str, timestamp: float) -> str | None:
        pass

    def delete(self, key: str) -> bool:
        pass

    def count(self, timestamp: float) -> int:
        pass`,
      java: `import java.util.*;

class KVStore {
    public KVStore() {

    }

    public void set(String key, String value, Double ttl) {

    }

    public String get(String key, double timestamp) {
        return null;
    }

    public boolean delete(String key) {
        return false;
    }

    public int count(double timestamp) {
        return 0;
    }
}`,
      javascript: `class KVStore {
    constructor() {

    }

    /** @param {string} key  @param {string} value  @param {number|null} ttl */
    set(key, value, ttl = null) {

    }

    /** @param {string} key  @param {number} timestamp  @return {string|null} */
    get(key, timestamp) {

    }

    /** @param {string} key  @return {boolean} */
    delete(key) {

    }

    /** @param {number} timestamp  @return {number} */
    count(timestamp) {

    }
}`,
      typescript: `class KVStore {
    constructor() {

    }

    set(key: string, value: string, ttl?: number): void {

    }

    get(key: string, timestamp: number): string | null {
        return null;
    }

    delete(key: string): boolean {
        return false;
    }

    count(timestamp: number): number {
        return 0;
    }
}`,
      c_cpp: `#include <string>
#include <unordered_map>
#include <optional>
using namespace std;

class KVStore {
public:
    KVStore() {

    }

    void set(const string& key, const string& value, optional<double> ttl = nullopt) {

    }

    optional<string> get(const string& key, double timestamp) {
        return nullopt;
    }

    bool remove(const string& key) {
        return false;
    }

    int count(double timestamp) {
        return 0;
    }
};`,
      csharp: `using System.Collections.Generic;

public class KVStore {
    public KVStore() {

    }

    public void Set(string key, string value, double? ttl = null) {

    }

    public string Get(string key, double timestamp) {
        return null;
    }

    public bool Delete(string key) {
        return false;
    }

    public int Count(double timestamp) {
        return 0;
    }
}`,
      rust: `use std::collections::HashMap;

struct KVStore {
}

impl KVStore {
    fn new() -> Self {
        todo!()
    }

    fn set(&mut self, key: &str, value: &str, ttl: Option<f64>) {
        todo!()
    }

    fn get(&self, key: &str, timestamp: f64) -> Option<&str> {
        todo!()
    }

    fn delete(&mut self, key: &str) -> bool {
        todo!()
    }

    fn count(&self, timestamp: f64) -> usize {
        todo!()
    }
}`,
      go: `type KVStore struct {
}

func NewKVStore() *KVStore {
    return &KVStore{}
}

func (s *KVStore) Set(key, value string, ttl *float64) {

}

func (s *KVStore) Get(key string, timestamp float64) (string, bool) {
    return "", false
}

func (s *KVStore) Delete(key string) bool {
    return false
}

func (s *KVStore) Count(timestamp float64) int {
    return 0
}`,
      kotlin: `class KVStore {
    fun set(key: String, value: String, ttl: Double? = null) {

    }

    fun get(key: String, timestamp: Double): String? {
        return null
    }

    fun delete(key: String): Boolean {
        return false
    }

    fun count(timestamp: Double): Int {
        return 0
    }
}`,
    },
    rubric: {
      mustCover: [
        "Stores each entry with its value and expiration timestamp (setTime + ttl). Entries without TTL have no expiration.",
        "get() checks if the key exists AND whether the current timestamp is before the expiration. Returns null if either condition fails.",
        "set() overwrites existing entries completely, updating both value and TTL/expiration.",
      ],
      strongSignals: [
        "count() iterates only over stored keys checking expiration, or uses lazy cleanup to keep an accurate count.",
        "Handles edge case: re-setting a key that previously had a TTL with no TTL (now permanent) or vice versa.",
        "Discusses tradeoffs between lazy expiration (check on get) vs. eager expiration (background cleanup) for count accuracy.",
      ],
      weakPatterns: [
        "Uses wall-clock time instead of the provided timestamp parameter, breaking deterministic behavior.",
        "Forgets to handle the case where ttl is null/None (entry should never expire).",
      ],
    },
  },

  {
    id: "pc_impl_008",
    category: "practical_coding",
    type: "implementation",
    title: "Union-Find (Disjoint Set)",
    prompt: `Implement a Union-Find (Disjoint Set Union) data structure for efficiently tracking element grouping.

[Operations]
• constructor(n) → Initialize n elements (0 to n-1), each in its own set.
• find(x) → Return the representative (root) of the set containing x.
• union(x, y) → Merge the sets of x and y. Return true if they were different sets, false if already same.
• connected(x, y) → Return true if x and y are in the same set.
• count() → Return the number of distinct sets.

[Constraints]
• 1 ≤ n ≤ 100,000
• 0 ≤ x, y < n
• At most 200,000 total operations
• Optimize with path compression + union by rank for near O(1) amortized per operation

[Examples]
uf = UnionFind(5)        // {0}, {1}, {2}, {3}, {4}
uf.count()         → 5
uf.union(0, 1)     → true
uf.union(2, 3)     → true
uf.connected(0, 1) → true
uf.connected(0, 2) → false
uf.count()         → 3    // {0,1}, {2,3}, {4}
uf.union(1, 3)     → true // merges {0,1} and {2,3}
uf.connected(0, 3) → true
uf.count()         → 2    // {0,1,2,3}, {4}
uf.union(0, 1)     → false // already same set`,
    diff: "",
    templates: {
      python: `class UnionFind:
    def __init__(self, n: int):
        pass

    def find(self, x: int) -> int:
        pass

    def union(self, x: int, y: int) -> bool:
        pass

    def connected(self, x: int, y: int) -> bool:
        pass

    def count(self) -> int:
        pass`,
      java: `class UnionFind {
    public UnionFind(int n) {

    }

    public int find(int x) {
        return x;
    }

    public boolean union(int x, int y) {
        return false;
    }

    public boolean connected(int x, int y) {
        return false;
    }

    public int count() {
        return 0;
    }
}`,
      javascript: `class UnionFind {
    /** @param {number} n */
    constructor(n) {

    }

    /** @param {number} x  @return {number} */
    find(x) {

    }

    /** @param {number} x  @param {number} y  @return {boolean} */
    union(x, y) {

    }

    /** @param {number} x  @param {number} y  @return {boolean} */
    connected(x, y) {

    }

    /** @return {number} */
    count() {

    }
}`,
      typescript: `class UnionFind {
    constructor(n: number) {

    }

    find(x: number): number {
        return x;
    }

    union(x: number, y: number): boolean {
        return false;
    }

    connected(x: number, y: number): boolean {
        return false;
    }

    count(): number {
        return 0;
    }
}`,
      c_cpp: `#include <vector>
using namespace std;

class UnionFind {
public:
    UnionFind(int n) {

    }

    int find(int x) {
        return x;
    }

    bool unite(int x, int y) {
        return false;
    }

    bool connected(int x, int y) {
        return false;
    }

    int count() {
        return 0;
    }
};`,
      csharp: `public class UnionFind {
    public UnionFind(int n) {

    }

    public int Find(int x) {
        return x;
    }

    public bool Union(int x, int y) {
        return false;
    }

    public bool Connected(int x, int y) {
        return false;
    }

    public int Count() {
        return 0;
    }
}`,
      rust: `struct UnionFind {
}

impl UnionFind {
    fn new(n: usize) -> Self {
        todo!()
    }

    fn find(&mut self, x: usize) -> usize {
        todo!()
    }

    fn union(&mut self, x: usize, y: usize) -> bool {
        todo!()
    }

    fn connected(&mut self, x: usize, y: usize) -> bool {
        todo!()
    }

    fn count(&self) -> usize {
        todo!()
    }
}`,
      go: `type UnionFind struct {
}

func NewUnionFind(n int) *UnionFind {
    return &UnionFind{}
}

func (uf *UnionFind) Find(x int) int {
    return x
}

func (uf *UnionFind) Union(x, y int) bool {
    return false
}

func (uf *UnionFind) Connected(x, y int) bool {
    return false
}

func (uf *UnionFind) Count() int {
    return 0
}`,
      kotlin: `class UnionFind(n: Int) {
    fun find(x: Int): Int {
        return x
    }

    fun union(x: Int, y: Int): Boolean {
        return false
    }

    fun connected(x: Int, y: Int): Boolean {
        return false
    }

    fun count(): Int {
        return 0
    }
}`,
    },
    rubric: {
      mustCover: [
        "Uses a parent array where parent[i] points to i's parent (initially parent[i] = i). find() follows parent pointers to the root.",
        "Implements path compression in find(): after finding the root, updates all nodes along the path to point directly to the root.",
        "Implements union by rank (or size): attaches the shorter tree under the taller tree's root to keep the tree balanced.",
      ],
      strongSignals: [
        "Maintains a count of distinct sets, decrementing on each successful union.",
        "connected() is implemented as find(x) == find(y), reusing the find logic instead of duplicating traversal.",
        "Explains the inverse Ackermann amortized time complexity with both optimizations combined.",
      ],
      weakPatterns: [
        "Implements find() without path compression, resulting in O(n) worst case per operation.",
        "Uses a set-of-sets or adjacency list approach instead of the parent array representation.",
      ],
    },
  },

  {
    id: "pc_impl_009",
    category: "practical_coding",
    type: "implementation",
    title: "Serialize and Deserialize Binary Tree",
    prompt: `Design an algorithm to convert a binary tree to a string and reconstruct it back.

[Operations]
• serialize(root) → Convert the binary tree to a string.
• deserialize(data) → Reconstruct the original tree from the string.

The format is up to you, but deserialize(serialize(tree)) must produce an identical tree.

[Constraints]
• 0 ≤ number of nodes ≤ 10,000
• -1,000 ≤ node.val ≤ 1,000
• The tree may be unbalanced (e.g., a linear chain)
• Must handle null/missing children correctly

[Examples]
Tree:       1
           / \\
          2   3
             / \\
            4   5

serialize(root) → "1,2,#,#,3,4,#,#,5,#,#"  (example format)
deserialize(serialized) → identical tree

Tree:       1        serialize → must preserve the
           /          left-only chain structure
          2
         /
        3`,
    diff: "",
    templates: {
      python: `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

class Codec:
    def serialize(self, root: TreeNode | None) -> str:
        pass

    def deserialize(self, data: str) -> TreeNode | None:
        pass`,
      java: `class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int val) { this.val = val; }
}

class Codec {
    public String serialize(TreeNode root) {
        return "";
    }

    public TreeNode deserialize(String data) {
        return null;
    }
}`,
      javascript: `class TreeNode {
    constructor(val = 0, left = null, right = null) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}

class Codec {
    /** @param {TreeNode|null} root  @return {string} */
    serialize(root) {

    }

    /** @param {string} data  @return {TreeNode|null} */
    deserialize(data) {

    }
}`,
      typescript: `class TreeNode {
    val: number;
    left: TreeNode | null;
    right: TreeNode | null;
    constructor(val = 0, left: TreeNode | null = null, right: TreeNode | null = null) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}

class Codec {
    serialize(root: TreeNode | null): string {
        return "";
    }

    deserialize(data: string): TreeNode | null {
        return null;
    }
}`,
      c_cpp: `#include <string>
#include <sstream>
using namespace std;

struct TreeNode {
    int val;
    TreeNode* left;
    TreeNode* right;
    TreeNode(int v) : val(v), left(nullptr), right(nullptr) {}
};

class Codec {
public:
    string serialize(TreeNode* root) {
        return "";
    }

    TreeNode* deserialize(const string& data) {
        return nullptr;
    }
};`,
      csharp: `public class TreeNode {
    public int Val;
    public TreeNode Left, Right;
    public TreeNode(int val) { Val = val; }
}

public class Codec {
    public string Serialize(TreeNode root) {
        return "";
    }

    public TreeNode Deserialize(string data) {
        return null;
    }
}`,
      rust: `use std::rc::Rc;
use std::cell::RefCell;

type TreeLink = Option<Rc<RefCell<TreeNode>>>;

struct TreeNode {
    val: i32,
    left: TreeLink,
    right: TreeLink,
}

struct Codec;

impl Codec {
    fn serialize(root: &TreeLink) -> String {
        todo!()
    }

    fn deserialize(data: &str) -> TreeLink {
        todo!()
    }
}`,
      go: `type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

type Codec struct{}

func (c *Codec) Serialize(root *TreeNode) string {
    return ""
}

func (c *Codec) Deserialize(data string) *TreeNode {
    return nil
}`,
      kotlin: `class TreeNode(var value: Int, var left: TreeNode? = null, var right: TreeNode? = null)

class Codec {
    fun serialize(root: TreeNode?): String {
        return ""
    }

    fun deserialize(data: String): TreeNode? {
        return null
    }
}`,
    },
    rubric: {
      mustCover: [
        "Uses pre-order (or level-order) traversal for serialization, encoding null children with a sentinel marker (e.g., '#' or 'null').",
        "Deserialize reconstructs the tree using the same traversal order, consuming tokens sequentially with an index/iterator.",
        "Correctly handles null children on both sides, preserving the exact tree structure including unbalanced trees.",
      ],
      strongSignals: [
        "Uses a delimiter (comma, space) between tokens for unambiguous parsing of multi-digit and negative numbers.",
        "Deserialize uses an index/iterator passed by reference (or closure) rather than slicing the string on each recursive call.",
        "Handles edge cases: empty tree (null root), single node, all-left or all-right chains.",
      ],
      weakPatterns: [
        "Uses in-order traversal without null markers — ambiguous and cannot reconstruct the tree uniquely.",
        "Does not encode null children, making it impossible to distinguish different tree structures with the same values.",
      ],
    },
  },

  {
    id: "pc_impl_010",
    category: "practical_coding",
    type: "implementation",
    title: "Flatten Nested List Iterator",
    prompt: `Implement an iterator that flattens a nested list of integers into a flat sequence.

Each element is either an integer or another nested list (arbitrarily deep).

[NestedInteger interface (provided)]
• isInteger() → true if this holds a single integer
• getInteger() → the integer value (only if isInteger is true)
• getList() → the nested list (only if isInteger is false)

[Your Iterator]
• constructor(nestedList) → Initialize with the nested list.
• next() → Return the next integer. Only called when hasNext() is true.
• hasNext() → Return true if there are more integers.

[Constraints]
• 1 ≤ total integers ≤ 100,000
• Nesting depth ≤ 50
• -1,000,000 ≤ integer values ≤ 1,000,000

[Examples]
Input: [[1, 1], 2, [1, 1]]
next() calls → 1, 1, 2, 1, 1

Input: [1, [4, [6]]]
next() calls → 1, 4, 6

Input: [[[]]]
hasNext() → false  (no integers at all)`,
    diff: "",
    templates: {
      python: `class NestedInteger:
    def isInteger(self) -> bool: ...
    def getInteger(self) -> int: ...
    def getList(self) -> list['NestedInteger']: ...

class NestedIterator:
    def __init__(self, nested_list: list[NestedInteger]):
        pass

    def next(self) -> int:
        pass

    def has_next(self) -> bool:
        pass`,
      java: `interface NestedInteger {
    boolean isInteger();
    Integer getInteger();
    List<NestedInteger> getList();
}

class NestedIterator {
    public NestedIterator(List<NestedInteger> nestedList) {

    }

    public int next() {
        return 0;
    }

    public boolean hasNext() {
        return false;
    }
}`,
      javascript: `// NestedInteger API:
//   isInteger() → boolean
//   getInteger() → number
//   getList() → NestedInteger[]

class NestedIterator {
    /** @param {NestedInteger[]} nestedList */
    constructor(nestedList) {

    }

    /** @return {number} */
    next() {

    }

    /** @return {boolean} */
    hasNext() {

    }
}`,
      typescript: `interface NestedInteger {
    isInteger(): boolean;
    getInteger(): number;
    getList(): NestedInteger[];
}

class NestedIterator {
    constructor(nestedList: NestedInteger[]) {

    }

    next(): number {
        return 0;
    }

    hasNext(): boolean {
        return false;
    }
}`,
      c_cpp: `#include <vector>
#include <stack>
using namespace std;

class NestedInteger {
public:
    bool isInteger() const;
    int getInteger() const;
    const vector<NestedInteger>& getList() const;
};

class NestedIterator {
public:
    NestedIterator(vector<NestedInteger>& nestedList) {

    }

    int next() {
        return 0;
    }

    bool hasNext() {
        return false;
    }
};`,
      csharp: `public interface INestedInteger {
    bool IsInteger();
    int GetInteger();
    IList<INestedInteger> GetList();
}

public class NestedIterator {
    public NestedIterator(IList<INestedInteger> nestedList) {

    }

    public int Next() {
        return 0;
    }

    public bool HasNext() {
        return false;
    }
}`,
      rust: `enum NestedInteger {
    Int(i32),
    List(Vec<NestedInteger>),
}

struct NestedIterator {
}

impl NestedIterator {
    fn new(nested_list: Vec<NestedInteger>) -> Self {
        todo!()
    }

    fn next(&mut self) -> i32 {
        todo!()
    }

    fn has_next(&mut self) -> bool {
        todo!()
    }
}`,
      go: `type NestedInteger interface {
    IsInteger() bool
    GetInteger() int
    GetList() []NestedInteger
}

type NestedIterator struct {
}

func NewNestedIterator(nestedList []NestedInteger) *NestedIterator {
    return &NestedIterator{}
}

func (it *NestedIterator) Next() int {
    return 0
}

func (it *NestedIterator) HasNext() bool {
    return false
}`,
      kotlin: `interface NestedInteger {
    fun isInteger(): Boolean
    fun getInteger(): Int
    fun getList(): List<NestedInteger>
}

class NestedIterator(nestedList: List<NestedInteger>) {
    fun next(): Int {
        return 0
    }

    fun hasNext(): Boolean {
        return false
    }
}`,
    },
    rubric: {
      mustCover: [
        "Uses a stack to iteratively flatten the nested structure. The stack stores iterators/indices into each nesting level.",
        "hasNext() peeks and flattens lazily: if the top of the stack is a list, it pushes the list's contents and repeats until an integer is on top.",
        "next() returns the integer found by hasNext(), advancing the iterator. Does not pre-flatten everything into memory.",
      ],
      strongSignals: [
        "Handles deeply nested empty lists ([[[]]], [[], [[]]]) correctly — hasNext() drills through all levels and returns false.",
        "Pushes list elements in reverse order onto the stack so they are processed left-to-right.",
        "Lazy evaluation: only flattens as needed, not all upfront. Efficient for partially consumed iterators.",
      ],
      weakPatterns: [
        "Recursively flattens the entire structure into an array in the constructor — correct but not a true iterator pattern.",
        "Fails on nested empty lists, returning hasNext()=true when there are no integers left.",
      ],
    },
  },

  // ── Optimization ───────────────────────────────────────

  {
    id: "pc_opt_001",
    category: "practical_coding",
    type: "optimization",
    guest: true,
    title: "Running Median from Data Stream",
    prompt: `Design a data structure that efficiently finds the median of all numbers seen so far from a stream.

[Operations]
• addNum(num) → Add an integer to the data structure.
• findMedian() → Return the current median as a float.

[Median Definition]
• Odd count: the middle value when sorted.
• Even count: the average of the two middle values.

[Constraints]
• -100,000 ≤ num ≤ 100,000
• At most 50,000 calls to addNum
• findMedian is called only after at least one addNum

[Examples]
mf = MedianFinder()
mf.addNum(1)
mf.findMedian()  → 1.0
mf.addNum(2)
mf.findMedian()  → 1.5     // (1 + 2) / 2
mf.addNum(3)
mf.findMedian()  → 2.0     // middle of [1, 2, 3]
mf.addNum(0)
mf.findMedian()  → 1.5     // [0, 1, 2, 3] → (1+2)/2

[Hint]
Sorting the entire list on each query is too slow. Think about maintaining two halves.`,
    diff: "",
    templates: {
      python: `class MedianFinder:
    def __init__(self):
        pass

    def add_num(self, num: int) -> None:
        pass

    def find_median(self) -> float:
        pass`,
      java: `class MedianFinder {
    public MedianFinder() {

    }

    public void addNum(int num) {

    }

    public double findMedian() {
        return 0.0;
    }
}`,
      javascript: `class MedianFinder {
    constructor() {

    }

    /** @param {number} num */
    addNum(num) {

    }

    /** @return {number} */
    findMedian() {

    }
}`,
      typescript: `class MedianFinder {
    constructor() {

    }

    addNum(num: number): void {

    }

    findMedian(): number {
        return 0;
    }
}`,
      c_cpp: `#include <queue>
using namespace std;

class MedianFinder {
public:
    MedianFinder() {

    }

    void addNum(int num) {

    }

    double findMedian() {
        return 0.0;
    }
};`,
      csharp: `public class MedianFinder {
    public MedianFinder() {

    }

    public void AddNum(int num) {

    }

    public double FindMedian() {
        return 0.0;
    }
}`,
      rust: `struct MedianFinder {
}

impl MedianFinder {
    fn new() -> Self {
        todo!()
    }

    fn add_num(&mut self, num: i32) {
        todo!()
    }

    fn find_median(&self) -> f64 {
        todo!()
    }
}`,
      go: `type MedianFinder struct {
}

func NewMedianFinder() *MedianFinder {
    return &MedianFinder{}
}

func (mf *MedianFinder) AddNum(num int) {

}

func (mf *MedianFinder) FindMedian() float64 {
    return 0.0
}`,
      kotlin: `class MedianFinder {
    fun addNum(num: Int) {

    }

    fun findMedian(): Double {
        return 0.0
    }
}`,
    },
    rubric: {
      mustCover: [
        "Uses two heaps: a max-heap for the lower half and a min-heap for the upper half of the stream.",
        "Maintains balance: the two heaps differ in size by at most 1. After each insertion, rebalances if needed.",
        "findMedian() returns the top of the larger heap (odd count) or the average of both tops (even count).",
      ],
      strongSignals: [
        "addNum() adds to the correct heap first, then rebalances — ensuring the max-heap top ≤ min-heap top invariant.",
        "Handles the initial empty state and single-element case without special-casing.",
        "Explains O(log n) addNum and O(1) findMedian time complexity.",
      ],
      weakPatterns: [
        "Maintains a sorted array and uses binary search insertion — O(n) per insert due to shifting.",
        "Sorts the entire list on every findMedian() call — O(n log n) per query.",
      ],
    },
  },

  {
    id: "pc_opt_002",
    category: "practical_coding",
    type: "optimization",
    title: "LFU Cache",
    prompt: `Design an LFU (Least Frequently Used) Cache with O(1) operations.

When the cache is full, evict the least frequently used key. If there's a tie in frequency, evict the least recently used among them.

[Operations]
• constructor(capacity) → Initialize with a positive capacity.
• get(key) → Return value if exists, -1 otherwise. Increments the key's frequency.
• put(key, value) → Insert or update. On capacity overflow, evict the LFU key first.

[Constraints]
• 1 ≤ capacity ≤ 10,000
• 0 ≤ key, value ≤ 100,000
• At most 200,000 total calls
• Both get and put must be O(1) average time

[Examples]
cache = LFUCache(2)
cache.put(1, 10)            // freq(1)=1
cache.put(2, 20)            // freq(2)=1
cache.get(1)     → 10       // freq(1)=2
cache.put(3, 30)            // evicts key 2 (freq=1, LRU among freq-1)
cache.get(2)     → -1       // evicted
cache.get(3)     → 30       // freq(3)=2
cache.put(4, 40)            // freq(1)=2, freq(3)=2 → evict key 1 (LRU among freq-2)
cache.get(1)     → -1
cache.get(3)     → 30       // freq(3)=3
cache.get(4)     → 40       // freq(4)=2`,
    diff: "",
    templates: {
      python: `class LFUCache:
    def __init__(self, capacity: int):
        pass

    def get(self, key: int) -> int:
        pass

    def put(self, key: int, value: int) -> None:
        pass`,
      java: `import java.util.*;

class LFUCache {
    public LFUCache(int capacity) {

    }

    public int get(int key) {
        return -1;
    }

    public void put(int key, int value) {

    }
}`,
      javascript: `class LFUCache {
    /** @param {number} capacity */
    constructor(capacity) {

    }

    /** @param {number} key  @return {number} */
    get(key) {

    }

    /** @param {number} key  @param {number} value */
    put(key, value) {

    }
}`,
      typescript: `class LFUCache {
    constructor(private capacity: number) {

    }

    get(key: number): number {
        return -1;
    }

    put(key: number, value: number): void {

    }
}`,
      c_cpp: `#include <unordered_map>
#include <list>
using namespace std;

class LFUCache {
public:
    LFUCache(int capacity) {

    }

    int get(int key) {
        return -1;
    }

    void put(int key, int value) {

    }
};`,
      csharp: `using System.Collections.Generic;

public class LFUCache {
    public LFUCache(int capacity) {

    }

    public int Get(int key) {
        return -1;
    }

    public void Put(int key, int value) {

    }
}`,
      rust: `use std::collections::HashMap;

struct LFUCache {
    capacity: usize,
}

impl LFUCache {
    fn new(capacity: i32) -> Self {
        todo!()
    }

    fn get(&mut self, key: i32) -> i32 {
        todo!()
    }

    fn put(&mut self, key: i32, value: i32) {
        todo!()
    }
}`,
      go: `type LFUCache struct {
    capacity int
}

func NewLFUCache(capacity int) *LFUCache {
    return &LFUCache{capacity: capacity}
}

func (c *LFUCache) Get(key int) int {
    return -1
}

func (c *LFUCache) Put(key int, value int) {

}`,
      kotlin: `class LFUCache(private val capacity: Int) {
    fun get(key: Int): Int {
        return -1
    }

    fun put(key: Int, value: Int) {

    }
}`,
    },
    rubric: {
      mustCover: [
        "Uses three hash maps: key→value+freq, freq→ordered set of keys, and tracks the minimum frequency (minFreq).",
        "On get/put access, moves the key from freq-list f to freq-list f+1. If freq f's list becomes empty and f == minFreq, increments minFreq.",
        "On eviction, removes the LRU key from the minFreq list. New insertions reset the key's frequency to 1 and set minFreq = 1.",
      ],
      strongSignals: [
        "Uses a doubly-linked list (or ordered dict) per frequency level so that both LRU removal and MRU insertion are O(1).",
        "Correctly handles the put() update case: if key already exists, updates value and increments frequency (no eviction needed).",
        "Handles capacity=0 edge case (or capacity=1 where every new put evicts the previous entry).",
      ],
      weakPatterns: [
        "Uses a single sorted structure by (freq, time) — eviction becomes O(log n) or O(n), not O(1).",
        "Forgets to update minFreq when the last key at the current minFreq is removed or promoted.",
      ],
    },
  },

  {
    id: "pc_opt_003",
    category: "practical_coding",
    type: "optimization",
    title: "Task Scheduler with Cooldown",
    prompt: `Given a list of tasks and a cooldown interval, find the minimum time to execute all tasks.

The same task must have at least n intervals between two executions. During cooldown, the CPU can run a different task or idle.

[Input]
• tasks: array of uppercase letters A-Z (each letter = a task type)
• n: cooldown interval (non-negative integer)

[Output]
• Minimum number of intervals needed to finish all tasks

[Constraints]
• 1 ≤ tasks.length ≤ 100,000
• tasks[i] is an uppercase letter (A-Z)
• 0 ≤ n ≤ 100
• Tasks can be executed in any order

[Examples]
tasks = ["A","A","A","B","B","B"], n = 2
→ 8   // A → B → idle → A → B → idle → A → B

tasks = ["A","A","A","B","B","B"], n = 0
→ 6   // no cooldown, just run all 6

tasks = ["A","A","A","A","B","B","C","C"], n = 2
→ 10  // A → B → C → A → B → C → A → idle → idle → A

tasks = ["A","B","C","D"], n = 3
→ 4   // all different, no cooldown needed`,
    diff: "",
    templates: {
      python: `def least_interval(tasks: list[str], n: int) -> int:
    pass`,
      java: `class Solution {
    public int leastInterval(char[] tasks, int n) {
        return 0;
    }
}`,
      javascript: `/**
 * @param {string[]} tasks
 * @param {number} n
 * @return {number}
 */
function leastInterval(tasks, n) {

}`,
      typescript: `function leastInterval(tasks: string[], n: number): number {
    return 0;
}`,
      c_cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int leastInterval(vector<char>& tasks, int n) {
        return 0;
    }
};`,
      csharp: `public class Solution {
    public int LeastInterval(char[] tasks, int n) {
        return 0;
    }
}`,
      rust: `fn least_interval(tasks: Vec<char>, n: i32) -> i32 {
    todo!()
}`,
      go: `func leastInterval(tasks []byte, n int) int {
    return 0
}`,
      kotlin: `fun leastInterval(tasks: CharArray, n: Int): Int {
    return 0
}`,
    },
    rubric: {
      mustCover: [
        "Counts the frequency of each task. The most frequent task determines the frame structure: (maxFreq - 1) frames of size (n + 1), plus a final partial frame.",
        "Calculates idle slots = (maxFreq - 1) * (n + 1) + count_of_tasks_with_max_freq. The answer is max(this value, total tasks).",
        "Understands that when there are many distinct tasks, idle time disappears and the answer is simply the total number of tasks.",
      ],
      strongSignals: [
        "Uses the math formula approach rather than simulation, achieving O(n) time where n is the number of tasks.",
        "Correctly counts how many tasks share the maximum frequency for the final frame calculation.",
        "Handles edge cases: n=0 (answer = tasks.length), all same task, all different tasks.",
      ],
      weakPatterns: [
        "Simulates each time slot one by one, tracking cooldowns — works but O(tasks * n) time complexity.",
        "Forgets the max(formula, tasks.length) step, giving wrong answers when there are enough distinct tasks to fill all idle slots.",
      ],
    },
  },

  {
    id: "pc_opt_004",
    category: "practical_coding",
    type: "optimization",
    title: "Sliding Window Maximum",
    prompt: `Given an array of integers and a window size k, find the maximum in each sliding window position.

[Input]
• nums: array of integers
• k: window size

[Output]
• Array of maximums, one per window position (length = n - k + 1)

[Constraints]
• 1 ≤ k ≤ nums.length ≤ 100,000
• -10,000 ≤ nums[i] ≤ 10,000
• Target: O(n) time, not O(n*k)

[Examples]
nums = [1, 3, -1, -3, 5, 3, 6, 7], k = 3
→ [3, 3, 5, 5, 6, 7]

  Window [1, 3, -1]    → 3
  Window [3, -1, -3]   → 3
  Window [-1, -3, 5]   → 5
  Window [-3, 5, 3]    → 5
  Window [5, 3, 6]     → 6
  Window [3, 6, 7]     → 7

nums = [9, 8, 7, 6, 5], k = 2
→ [9, 8, 7, 6]

nums = [1], k = 1
→ [1]`,
    diff: "",
    templates: {
      python: `def max_sliding_window(nums: list[int], k: int) -> list[int]:
    pass`,
      java: `import java.util.*;

class Solution {
    public int[] maxSlidingWindow(int[] nums, int k) {
        return new int[0];
    }
}`,
      javascript: `/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number[]}
 */
function maxSlidingWindow(nums, k) {

}`,
      typescript: `function maxSlidingWindow(nums: number[], k: number): number[] {
    return [];
}`,
      c_cpp: `#include <vector>
#include <deque>
using namespace std;

class Solution {
public:
    vector<int> maxSlidingWindow(vector<int>& nums, int k) {
        return {};
    }
};`,
      csharp: `using System.Collections.Generic;

public class Solution {
    public int[] MaxSlidingWindow(int[] nums, int k) {
        return new int[0];
    }
}`,
      rust: `fn max_sliding_window(nums: Vec<i32>, k: i32) -> Vec<i32> {
    todo!()
}`,
      go: `func maxSlidingWindow(nums []int, k int) []int {
    return nil
}`,
      kotlin: `fun maxSlidingWindow(nums: IntArray, k: Int): IntArray {
    return intArrayOf()
}`,
    },
    rubric: {
      mustCover: [
        "Uses a monotonic decreasing deque that stores indices. The front of the deque is always the index of the current window's maximum.",
        "When adding a new element, removes all indices from the back of the deque whose values are ≤ the new element.",
        "Before reading the front, removes indices that have fallen out of the window (index ≤ current - k).",
      ],
      strongSignals: [
        "Stores indices (not values) in the deque, enabling O(1) window-boundary checks.",
        "Pre-allocates the result array with size (n - k + 1) to avoid repeated resizing.",
        "Explains why the amortized time is O(n): each element enters and exits the deque at most once.",
      ],
      weakPatterns: [
        "Uses a nested loop scanning the entire window for each position — O(n*k) brute force.",
        "Uses a heap/priority queue without removing stale elements — O(n log n) and may return wrong max.",
      ],
    },
  },
];
