
# AlgoLingo - AI 原生高级工程师教练 (AI-Native Senior Engineering Coach)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Tech Stack](https://img.shields.io/badge/stack-React%2019%20%7C%20TypeScript%20%7C%20Gemini%20Flash-orange)
![Language](https://img.shields.io/badge/language-Chinese%20%7C%20English-green)

> **🚀 在线体验 (Live Demo)**: [点击访问 AI Studio Build 版本](https://demo.algolingo.sky-hua.xyz)
>
> *提示：可直接使用 Google AI Studio Build 额度运行并学习，此版本将持续跟随仓库最新代码更新。*

[English Version Below](#algolingo---english-introduction)

**AlgoLingo** 是一个专为高级软件工程师设计的游戏化 AI 学习平台。与传统的静态课程不同，它利用 **Google Gemini** 模型实时生成个性化课程，将 LeetCode 算法题、系统设计概念以及职业面试准备转化为互动式的微学习体验（类 Duolingo 模式）。

本项目展示了 **"生成式 UI (Generative UI)"** 的概念——界面内容并非预先写死，而是由 AI 根据严格的结构化数据协议实时构建。

---

## 🌟 核心功能设计 (Core Features)

### 1. 算法核心 (Algorithm Hub)
游戏化攻克 **LeetCode Top 100**。
- **6 阶段学习模型**：将每道算法题拆解为：*概念引入 -> 语法基础 -> 记忆回溯 -> 逻辑构建 -> 调试排错 -> 精通认证*。
- **互动组件**：拒绝枯燥的文本阅读。使用 **Parsons 代码拼图**（逻辑排序）、**代码填空**（关键 Token 填空）和 **可视化测验** 进行主动学习。
- **代码仿真器**：内置虚拟 IDE (`LeetCodeRunner`)，模拟代码运行、测试用例验证及时间/空间复杂度分析。

### 2. 工程中心 (Engineering Hub)
面向 Senior/Staff 级别工程师的系统化能力构建。
- **双塔核心 (The Twin Pillars)**：
  - **系统架构**：涵盖 CAP 定理、分布式事务、微服务治理等。
  - **计算机内功**：涵盖内核原理、网络协议栈、运行时机制等。
- **动态专精路径 (Dynamic Tracks)**：AI 根据用户输入的关键词（如 "Unreal Engine 5 网络同步"、"eBPF 追踪"）实时生成分层级的学习大纲。
- **架构画布 (Architecture Canvas)**：交互式拖拽组件，用于设计系统架构图（负载均衡、数据库、缓存等）。

### 3. 探索工坊 (The Forge)
无限知识引擎。
- 用户输入 *任意* 主题（例如 "Kafka Internals"、"React Fiber 架构"）。
- **Agentic Planning**：AI 调用搜索工具获取最新信息，并实时构建多阶段、富交互的课程。

### 4. 职业竞技场 (Career Arena)
沉浸式角色扮演面试模拟器。
- **人格化 AI 面试官**：不同的面试官拥有不同的人格（例如注重基础的 "The Grinder"、注重宏观架构的 "The Architect"）。
- **全流程模拟**：模拟完整的面试流程（技术一面 -> 技术二面 -> 主管面 -> HR 面）。
- **JD 定制特训**：粘贴职位描述 (JD)，AI 自动分析关键技能点，生成专属备战路线图。

---

## 🛠 技术栈与实现 (Tech Stack)

### 前端与 UI
- **框架**: React 19 + TypeScript (Vite 构建)。
- **样式**: Tailwind CSS (原生支持深色模式)。
- **图标**: Lucide React。
- **可视化**: Mermaid.js (动态图表), PrismJS (语法高亮)。

### AI 与 数据
- **模型**: Google Gemini 2.5 Flash (速度/成本优化) & Pro (负责复杂推理)。
- **SDK**: `@google/genai` (纯前端集成)。
- **无后端架构 (No-Backend)**: 应用完全运行在浏览器中。
- **数据持久化**: `localStorage` (本地状态) + **GitHub Gist Sync** (跨设备云端同步)。

---

## 🧠 AI 驱动的提示词工程 (Prompt Engineering)

本项目深度依赖 **结构化输出 (Structured Output)** 和 **思维链 (Chain-of-Thought)** 模拟。我们不仅仅是在和 LLM "聊天"，而是将其视为一个动态内容的生成后端。

### 1. 屏幕组合协议 (Screen Composition Protocol)
为了保证 UI 的一致性和可用性，我们指示 AI 生成严格符合 Schema (`services/ai/schemas.ts`) 的 JSON 数据。
*   **成对原则**：每个屏幕必须包含 "一静一动" 的组件组合（例如：*对话讲解 + 互动代码*）。
*   **禁止事项**：严禁生成只有对话的屏幕，防止出现 "文字墙"。

### 2. "面试官大脑" 状态机 (Interviewer Brain)
位于 `services/ai/career/generator.ts`，AI 作为一个面试状态机运行：
*   **输入**：当前对话历史 + 阶段上下文（如 "技术二面"）。
*   **逻辑**：决定 `nextAction`（是继续追问 Text，还是发起 Coding 任务，或是 System Design 挑战）。
*   **输出**：根据对话流向生成特定的 Payload（例如，在发现候选人算法薄弱时，动态插入一道特定的 LeetCode 题）。

### 3. 组件级提示词 (Widget-Specific Prompting)
针对不同交互类型使用专门的生成规则：
*   **Parsons 拼图** (`rules/parsonsRules.ts`)：强制 AI 生成具有逻辑依赖顺序的代码行，而非可以随意交换的行。
*   **填空题** (`rules/fillInRules.ts`)：指示 AI 挖空 "高熵" Token（如逻辑运算符、关键方法调用），而不是琐碎的变量名。

### 4. 自我修正与重生成 (Regeneration)
*   **单屏重绘**：如果用户觉得当前内容难以理解，App 会将当前的 JSON 上下文连同修改指令（如 "这也太难了，简单点"）发回给 AI，AI 仅实时重构该屏幕的内容。

---

## 🚀 快速开始

1.  **克隆仓库:**
    ```bash
    git clone https://github.com/yourusername/algolingo.git
    ```
2.  **安装依赖:**
    ```bash
    npm install
    ```
3.  **配置 API Key:**
    *   从 Google AI Studio 获取 Gemini API Key。
    *   创建 `.env` 文件: `API_KEY=your_key_here`，或者在应用的设置菜单中输入 Key。
4.  **本地运行:**
    ```bash
    npm run dev
    ```

---

<a name="algolingo---english-introduction"></a>
# AlgoLingo - English Introduction

**AlgoLingo** is a gamified, AI-driven learning platform designed for senior software engineers. Unlike traditional courses, it generates personalized curriculums on the fly using **Google Gemini**, turning LeetCode problems, System Design concepts, and Career prep into interactive, micro-learning sessions (Duolingo-style).

## 🌟 Key Features

### 1. Algorithm Hub
Gamified mastery of the **LeetCode Top 100**.
- **6-Phase Learning Model:** Break down every algorithm into: *Concept -> Syntax -> Recall -> Logic Build -> Debugging -> Mastery*.
- **Interactive Widgets:** Learn via Parsons Puzzles (code ordering), Fill-in-the-blanks, and Visual Quizzes rather than passive reading.
- **Code Simulator:** A virtual IDE environment that simulates test cases and runtime analysis.

### 2. Engineering Hub
A structured path for Senior/Staff Engineer competencies.
- **The Twin Pillars:** Pre-defined curriculums for **System Architecture** and **CS Fundamentals**.
- **Dynamic Tracks:** AI generates custom syllabi for niche topics on demand.
- **Architecture Canvas:** Interactive drag-and-drop widget to design systems.

### 3. The Forge
A generic knowledge engine.
- Users input *any* topic (e.g., "Kafka Internals").
- **Agentic Planning:** The AI performs a Google Search and constructs a multi-stage course in real-time.

### 4. Career Arena
A role-play simulation engine for job preparation.
- **Persona-Based AI:** Interviewers have distinct personalities.
- **Mock Interviews:** Full loop simulation (Tech Round -> Manager -> HR).
- **JD Analysis:** Paste a Job Description for a custom roadmap.

## 🧠 AI Implementation Highlights

*   **Generative UI:** The interface is fluid and dictated by AI-generated structured JSON.
*   **Strict Schemas:** We utilize rigorous Typescript schemas to force the LLM to output valid widget data.
*   **State Machine Logic:** The AI interviewer maintains internal state to drive the conversation flow logically.

---

## 📂 Project Structure

```bash
/src
  /components
    /widgets          # Interactive UI blocks (Parsons, Quiz, ArchCanvas, etc.)
    /lesson           # The Lesson Runner engine & Game loop
    /EngineeringHub   # System Design & Track logic
    /Career           # Interview Simulation logic
    /Forge            # Dynamic Course Generator
  /services
    /ai               # Prompts, Schemas, and API Clients
      /prompts        # The "Brains" of the application
  /hooks              # Custom hooks (useLessonEngine, useMistakeManager)
  /data               # Static curriculums
```
