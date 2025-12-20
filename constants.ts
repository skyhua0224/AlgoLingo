
import { Problem, UserPreferences, ApiConfig, UserStats } from './types';

// Full mapping of Problem ID to Name (Bilingual)
export const PROBLEM_MAP: Record<string, { en: string, zh: string }> = {
    "p_1": { en: "Two Sum", zh: "两数之和" },
    "p_49": { en: "Group Anagrams", zh: "字母异位词分组" },
    "p_128": { en: "Longest Consecutive Sequence", zh: "最长连续序列" },
    "p_283": { en: "Move Zeroes", zh: "移动零" },
    "p_11": { en: "Container With Most Water", zh: "盛最多水的容器" },
    "p_15": { en: "3Sum", zh: "三数之和" },
    "p_42": { en: "Trapping Rain Water", zh: "接雨水" },
    "p_3": { en: "Longest Substring Without Repeating Characters", zh: "无重复字符的最长子串" },
    "p_438": { en: "Find All Anagrams in a String", zh: "找到字符串中所有字母异位词" },
    "p_560": { en: "Subarray Sum Equals K", zh: "和为 K 的子数组" },
    "p_239": { en: "Sliding Window Maximum", zh: "滑动窗口最大值" },
    "p_76": { en: "Minimum Window Substring", zh: "最小覆盖子串" },
    "p_53": { en: "Maximum Subarray", zh: "最大子数组和" },
    "p_56": { en: "Merge Intervals", zh: "合并区间" },
    "p_189": { en: "Rotate Array", zh: "轮转数组" },
    "p_238": { en: "Product of Array Except Self", zh: "除自身以外数组的乘积" },
    "p_41": { en: "First Missing Positive", zh: "缺失的第一个正数" },
    "p_73": { en: "Set Matrix Zeroes", zh: "矩阵置零" },
    "p_54": { en: "Spiral Matrix", zh: "螺旋矩阵" },
    "p_48": { en: "Rotate Image", zh: "旋转图像" },
    "p_240": { en: "Search a 2D Matrix II", zh: "搜索二维矩阵 II" },
    "p_160": { en: "Intersection of Two Linked Lists", zh: "相交链表" },
    "p_206": { en: "Reverse Linked List", zh: "反转链表" },
    "p_234": { en: "Palindrome Linked List", zh: "回文链表" },
    "p_141": { en: "Linked List Cycle", zh: "环形链表" },
    "p_142": { en: "Linked List Cycle II", zh: "环形链表 II" },
    "p_21": { en: "Merge Two Sorted Lists", zh: "合并两个有序链表" },
    "p_2": { en: "Add Two Numbers", zh: "两数相加" },
    "p_19": { en: "Remove Nth Node From End of List", zh: "删除链表的倒数第 N 个结点" },
    "p_24": { en: "Swap Nodes in Pairs", zh: "两两交换链表中的节点" },
    "p_25": { en: "Reverse Nodes in k-Group", zh: "K 个一组翻转链表" },
    "p_138": { en: "Copy List with Random Pointer", zh: "随机链表的复制" },
    "p_148": { en: "Sort List", zh: "排序链表" },
    "p_23": { en: "Merge k Sorted Lists", zh: "合并 K 个升序链表" },
    "p_146": { en: "LRU Cache", zh: "LRU 缓存" },
    "p_94": { en: "Binary Tree Inorder Traversal", zh: "二叉树的中序遍历" },
    "p_104": { en: "Maximum Depth of Binary Tree", zh: "二叉树的最大深度" },
    "p_226": { en: "Invert Binary Tree", zh: "翻转二叉树" },
    "p_101": { en: "Symmetric Tree", zh: "对称二叉树" },
    "p_543": { en: "Diameter of Binary Tree", zh: "二叉树的直径" },
    "p_102": { en: "Binary Tree Level Order Traversal", zh: "二叉树的层序遍历" },
    "p_108": { en: "Convert Sorted Array to Binary Search Tree", zh: "将有序数组转换为二叉搜索树" },
    "p_98": { en: "Validate Binary Search Tree", zh: "验证二叉搜索树" },
    "p_230": { en: "Kth Smallest Element in a BST", zh: "二叉搜索树中第 K 小的元素" },
    "p_199": { en: "Binary Tree Right Side View", zh: "二叉树的右视图" },
    "p_114": { en: "Flatten Binary Tree to Linked List", zh: "二叉树展开为链表" },
    "p_105": { en: "Construct Binary Tree from Preorder and Inorder Traversal", zh: "从前序与中序遍历序列构造二叉树" },
    "p_437": { en: "Path Sum III", zh: "路径总和 III" },
    "p_236": { en: "Lowest Common Ancestor of a Binary Tree", zh: "二叉树的最近公共祖先" },
    "p_124": { en: "Binary Tree Maximum Path Sum", zh: "二叉树中的最大路径和" },
    "p_200": { en: "Number of Islands", zh: "岛屿数量" },
    "p_994": { en: "Rotting Oranges", zh: "腐烂的橘子" },
    "p_207": { en: "Course Schedule", zh: "课程表" },
    "p_208": { en: "Implement Trie (Prefix Tree)", zh: "实现 Trie (前缀树)" },
    "p_46": { en: "Permutations", zh: "全排列" },
    "p_78": { en: "Subsets", zh: "子集" },
    "p_17": { en: "Letter Combinations of a Phone Number", zh: "电话号码的字母组合" },
    "p_39": { en: "Combination Sum", zh: "组合总和" },
    "p_22": { en: "Generate Parentheses", zh: "括号生成" },
    "p_79": { en: "Word Search", zh: "单词搜索" },
    "p_131": { en: "Palindrome Partitioning", zh: "分割回文串" },
    "p_51": { en: "N-Queens", zh: "N 皇后" },
    "p_35": { en: "Search Insert Position", zh: "搜索插入位置" },
    "p_74": { en: "Search a 2D Matrix", zh: "搜索二维矩阵" },
    "p_34": { en: "Find First and Last Position of Element in Sorted Array", zh: "在排序数组中查找元素的第一个和最后一个位置" },
    "p_33": { en: "Search in Rotated Sorted Array", zh: "搜索旋转排序数组" },
    "p_153": { en: "Find Minimum in Rotated Sorted Array", zh: "寻找旋转排序数组中的最小值" },
    "p_4": { en: "Median of Two Sorted Arrays", zh: "寻找两个正序数组的中位数" },
    "p_20": { en: "Valid Parentheses", zh: "有效的括号" },
    "p_155": { en: "Min Stack", zh: "最小栈" },
    "p_394": { en: "Decode String", zh: "字符串解码" },
    "p_739": { en: "Daily Temperatures", zh: "每日温度" },
    "p_84": { en: "Largest Rectangle in Histogram", zh: "柱状图中最大的矩形" },
    "p_215": { en: "Kth Largest Element in an Array", zh: "数组中的第K个最大元素" },
    "p_347": { en: "Top K Frequent Elements", zh: "前 K 个高频元素" },
    "p_295": { en: "Find Median from Data Stream", zh: "数据流的中位数" },
    "p_121": { en: "Best Time to Buy and Sell Stock", zh: "买卖股票的最佳时机" },
    "p_55": { en: "Jump Game", zh: "跳跃游戏" },
    "p_45": { en: "Jump Game II", zh: "跳跃游戏 II" },
    "p_763": { en: "Partition Labels", zh: "划分字母区间" },
    "p_70": { en: "Climbing Stairs", zh: "爬楼梯" },
    "p_118": { en: "Pascal's Triangle", zh: "杨辉三角" },
    "p_198": { en: "House Robber", zh: "打家劫舍" },
    "p_279": { en: "Perfect Squares", zh: "完全平方数" },
    "p_322": { en: "Coin Change", zh: "零钱兑换" },
    "p_139": { en: "Word Break", zh: "单词拆分" },
    "p_300": { en: "Longest Increasing Subsequence", zh: "最长递增子序列" },
    "p_152": { en: "Maximum Product Subarray", zh: "乘积最大子数组" },
    "p_416": { en: "Partition Equal Subset Sum", zh: "分割等和子集" },
    "p_32": { en: "Longest Valid Parentheses", zh: "最长有效括号" },
    "p_62": { en: "Unique Paths", zh: "不同路径" },
    "p_64": { en: "Minimum Path Sum", zh: "最小路径和" },
    "p_5": { en: "Longest Palindromic Substring", zh: "最长回文子串" },
    "p_1143": { en: "Longest Common Subsequence", zh: "最长公共子序列" },
    "p_72": { en: "Edit Distance", zh: "编辑距离" },
    "p_136": { en: "Single Number", zh: "只出现一次的数字" },
    "p_169": { en: "Majority Element", zh: "多数元素" },
    "p_75": { en: "Sort Colors", zh: "颜色分类" },
    "p_31": { en: "Next Permutation", zh: "下一个排列" },
    "p_287": { en: "Find the Duplicate Number", zh: "寻找重复数" }
};

// Organized into 10 Logical Units with localized metadata
export const PROBLEM_CATEGORIES = [
  {
    id: "unit_hashing",
    title: "Unit 1: Hashing & Arrays",
    title_zh: "第一单元：哈希表与数组",
    description: "Map data for O(1) lookups.",
    description_zh: "利用哈希映射实现 O(1) 快速查找。",
    problems: ["p_1", "p_49", "p_128", "p_169", "p_136", "p_75", "p_31", "p_287"]
  },
  {
    id: "unit_pointers",
    title: "Unit 2: Two Pointers & Sliding Window",
    title_zh: "第二单元：双指针与滑动窗口",
    description: "Optimize linear sequences.",
    description_zh: "优化线性序列处理，减少时间复杂度。",
    problems: ["p_283", "p_11", "p_15", "p_42", "p_3", "p_438", "p_76", "p_239", "p_560"]
  },
  {
    id: "unit_stack_queue",
    title: "Unit 3: Stack, Queue & Matrix",
    title_zh: "第三单元：栈、队列与矩阵",
    description: "LIFO, FIFO, and 2D Grids.",
    description_zh: "掌握先进后出、先进先出及二维网格操作。",
    problems: ["p_20", "p_155", "p_394", "p_739", "p_84", "p_73", "p_54", "p_48", "p_240"]
  },
  {
    id: "unit_linkedlist",
    title: "Unit 4: Linked Lists",
    title_zh: "第四单元：链表操作",
    description: "Pointer manipulation mastery.",
    description_zh: "精通指针操作与链式结构。",
    problems: ["p_160", "p_206", "p_234", "p_141", "p_142", "p_21", "p_2", "p_19", "p_24", "p_25", "p_138", "p_148", "p_23", "p_146"]
  },
  {
    id: "unit_trees",
    title: "Unit 5: Binary Trees",
    title_zh: "第五单元：二叉树",
    description: "Traversals and recursion.",
    description_zh: "深度优先搜索、广度优先搜索与递归。",
    problems: ["p_94", "p_104", "p_226", "p_101", "p_543", "p_102", "p_102", "p_108", "p_98", "p_230", "p_199", "p_114", "p_105", "p_437", "p_236", "p_124"]
  },
  {
    id: "unit_graphs",
    title: "Unit 6: Graphs & Backtracking",
    title_zh: "第六单元：图论与回溯",
    description: "Connections and permutations.",
    description_zh: "图的连通性、全排列与组合问题。",
    problems: ["p_200", "p_994", "p_207", "p_208", "p_46", "p_78", "p_17", "p_39", "p_22", "p_79", "p_131", "p_51"]
  },
  {
    id: "unit_search",
    title: "Unit 7: Binary Search & Sorting",
    title_zh: "第七单元：二分查找与排序",
    description: "Divide and conquer.",
    description_zh: "分治法与对数级时间复杂度算法。",
    problems: ["p_35", "p_74", "p_34", "p_33", "p_153", "p_4", "p_215", "p_347", "p_295"]
  },
  {
    id: "unit_dp_basic",
    title: "Unit 8: DP - Basics",
    title_zh: "第八单元：动态规划基础",
    description: "1D Dynamic Programming.",
    description_zh: "一维动态规划与状态转移。",
    problems: ["p_70", "p_118", "p_198", "p_279", "p_322", "p_139", "p_300", "p_152", "p_416", "p_32"]
  },
  {
    id: "unit_dp_adv",
    title: "Unit 9: DP - Advanced",
    title_zh: "第九单元：进阶动态规划",
    description: "2D DP and Grid paths.",
    description_zh: "二维动态规划与网格路径问题。",
    problems: ["p_62", "p_64", "p_5", "p_1143", "p_72"]
  },
  {
    id: "unit_greedy",
    title: "Unit 10: Greedy & Intervals",
    title_zh: "第十单元：贪心算法与区间",
    description: "Local optimization.",
    description_zh: "局部最优解与区间合并技巧。",
    problems: ["p_121", "p_55", "p_45", "p_763", "p_53", "p_56", "p_189", "p_238", "p_41"]
  }
];

export const INITIAL_STATS: UserStats = {
    streak: 0, 
    xp: 0,     
    gems: 0,   
    lastPlayed: '', 
    history: {},
    league: {
        currentTier: 'Bronze',
        rank: 0,
        weeklyXp: 0
    },
    quests: [],
    achievements: []
};

export const DEFAULT_API_CONFIG: ApiConfig = {
    provider: 'gemini-official',
    gemini: {
        model: 'gemini-2.5-flash', // REVERTED: High stability for long lesson generation.
    },
    openai: {
        baseUrl: 'https://api.openai.com/v1',
        apiKey: '',
        model: 'gpt-4o'
    }
};

export const GEMINI_MODELS = [
    'gemini-3-flash-preview',
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-3-pro-preview',
];
