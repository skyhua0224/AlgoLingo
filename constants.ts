
import { Problem, UserPreferences, ApiConfig } from './types';

// Full mapping of Problem ID to Name (User Provided)
export const PROBLEM_MAP: Record<string, string> = {
    "p_1": "两数之和",
    "p_49": "字母异位词分组",
    "p_128": "最长连续序列",
    "p_283": "移动零",
    "p_11": "盛最多水的容器",
    "p_15": "三数之和",
    "p_42": "接雨水",
    "p_3": "无重复字符的最长子串",
    "p_438": "找到字符串中所有字母异位词",
    "p_560": "和为 K 的子数组",
    "p_239": "滑动窗口最大值",
    "p_76": "最小覆盖子串",
    "p_53": "最大子数组和",
    "p_56": "合并区间",
    "p_189": "轮转数组",
    "p_238": "除自身以外数组的乘积",
    "p_41": "缺失的第一个正数",
    "p_73": "矩阵置零",
    "p_54": "螺旋矩阵",
    "p_48": "旋转图像",
    "p_240": "搜索二维矩阵 II",
    "p_160": "相交链表",
    "p_206": "反转链表",
    "p_234": "回文链表",
    "p_141": "环形链表",
    "p_142": "环形链表 II",
    "p_21": "合并两个有序链表",
    "p_2": "两数相加",
    "p_19": "删除链表的倒数第 N 个结点",
    "p_24": "两两交换链表中的节点",
    "p_25": "K 个一组翻转链表",
    "p_138": "随机链表的复制",
    "p_148": "排序链表",
    "p_23": "合并 K 个升序链表",
    "p_146": "LRU 缓存",
    "p_94": "二叉树的中序遍历",
    "p_104": "二叉树的最大深度",
    "p_226": "翻转二叉树",
    "p_101": "对称二叉树",
    "p_543": "二叉树的直径",
    "p_102": "二叉树的层序遍历",
    "p_108": "将有序数组转换为二叉搜索树",
    "p_98": "验证二叉搜索树",
    "p_230": "二叉搜索树中第 K 小的元素",
    "p_199": "二叉树的右视图",
    "p_114": "二叉树展开为链表",
    "p_105": "从前序与中序遍历序列构造二叉树",
    "p_437": "路径总和 III",
    "p_236": "二叉树的最近公共祖先",
    "p_124": "二叉树中的最大路径和",
    "p_200": "岛屿数量",
    "p_994": "腐烂的橘子",
    "p_207": "课程表",
    "p_208": "实现 Trie (前缀树)",
    "p_46": "全排列",
    "p_78": "子集",
    "p_17": "电话号码的字母组合",
    "p_39": "组合总和",
    "p_22": "括号生成",
    "p_79": "单词搜索",
    "p_131": "分割回文串",
    "p_51": "N 皇后",
    "p_35": "搜索插入位置",
    "p_74": "搜索二维矩阵",
    "p_34": "在排序数组中查找元素的第一个和最后一个位置",
    "p_33": "搜索旋转排序数组",
    "p_153": "寻找旋转排序数组中的最小值",
    "p_4": "寻找两个正序数组的中位数",
    "p_20": "有效的括号",
    "p_155": "最小栈",
    "p_394": "字符串解码",
    "p_739": "每日温度",
    "p_84": "柱状图中最大的矩形",
    "p_215": "数组中的第K个最大元素",
    "p_347": "前 K 个高频元素",
    "p_295": "数据流的中位数",
    "p_121": "买卖股票的最佳时机",
    "p_55": "跳跃游戏",
    "p_45": "跳跃游戏 II",
    "p_763": "划分字母区间",
    "p_70": "爬楼梯",
    "p_118": "杨辉三角",
    "p_198": "打家劫舍",
    "p_279": "完全平方数",
    "p_322": "零钱兑换",
    "p_139": "单词拆分",
    "p_300": "最长递增子序列",
    "p_152": "乘积最大子数组",
    "p_416": "分割等和子集",
    "p_32": "最长有效括号",
    "p_62": "不同路径",
    "p_64": "最小路径和",
    "p_5": "最长回文子串",
    "p_1143": "最长公共子序列",
    "p_72": "编辑距离",
    "p_136": "只出现一次的数字",
    "p_169": "多数元素",
    "p_75": "颜色分类",
    "p_31": "下一个排列",
    "p_287": "寻找重复数"
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
    problems: ["p_94", "p_104", "p_226", "p_101", "p_543", "p_102", "p_108", "p_98", "p_230", "p_199", "p_114", "p_105", "p_437", "p_236", "p_124"]
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

export const INITIAL_STATS = {
    streak: 0, // Changed from 3 to 0 for real data
    xp: 0,     // Changed from 1250 to 0
    gems: 0,   // Changed from 100 to 0
    lastPlayed: '', // Empty initially
    history: {} 
};

export const DEFAULT_API_CONFIG: ApiConfig = {
    provider: 'gemini-official',
    gemini: {
        model: 'gemini-2.5-pro',
    },
    openai: {
        baseUrl: 'https://api.openai.com/v1',
        apiKey: '',
        model: 'gpt-4o'
    }
};

export const GEMINI_MODELS = [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-3-pro-preview'
];