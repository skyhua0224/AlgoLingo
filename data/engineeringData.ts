
import { EngineeringPillar, EngineeringTopic } from '../types/engineering';

// Helper to create topic
const createTopic = (id: string, en: string, zh: string, keywords: string[]): EngineeringTopic => ({
    id,
    title: { en, zh },
    keywords
});

// --- PILLAR 1: UNIVERSAL SOFTWARE ARCHITECTURE ---
export const SOFTWARE_ARCH_DATA: EngineeringPillar = {
  id: 'system',
  title: { en: "Software Architecture", zh: "通用软件架构" },
  description: { en: "Patterns, Quality, and Design Principles for ALL Engineers.", zh: "设计模式、代码质量与工程原则 (全员必修)。" },
  modules: [
    {
      id: "arch_1",
      level: "Level 1: Design Principles",
      title: { en: "Unit 1: Modularity & Patterns", zh: "第一单元：模块化与设计模式" },
      description: { en: "Writing maintainable code.", zh: "如何写出可维护的代码" },
      topics: [
        createTopic("arch_solid", "SOLID Principles", "SOLID 原则", ["Single Responsibility", "Open/Closed", "Dependency Inversion"]),
        createTopic("arch_patterns", "Design Patterns", "常用设计模式", ["Singleton", "Factory", "Observer", "Strategy"]),
        createTopic("arch_clean", "Clean Code", "代码整洁之道", ["Naming", "Functions", "Refactoring", "Tech Debt"])
      ]
    },
    {
      id: "arch_2",
      level: "Level 2: Interface & Contract",
      title: { en: "Unit 2: API & Interface Design", zh: "第二单元：接口与契约设计" },
      description: { en: "How components talk.", zh: "组件与服务间的通信规范" },
      topics: [
        createTopic("api_rest", "RESTful & Resources", "RESTful 设计", ["Resources", "Verbs", "Status Codes", "Idempotency"]),
        createTopic("api_graphql", "Flexible Query (GraphQL)", "GraphQL 与灵活查询", ["Schema", "Resolvers", "Over-fetching"]),
        createTopic("api_compat", "Versioning & Compatibility", "版本控制与兼容性", ["Breaking Changes", "Semantic Versioning", "Backward Compat"])
      ]
    },
    {
      id: "arch_3",
      level: "Level 3: State & Data",
      title: { en: "Unit 3: State Management", zh: "第三单元：状态与数据流" },
      description: { en: "Handling data flow.", zh: "前端/后端/游戏通用的状态难题" },
      topics: [
        createTopic("state_lifecycle", "Lifecycle & Scope", "生命周期与作用域", ["Init", "Mount/Unmount", "Memory Leaks", "Global vs Local"]),
        createTopic("state_store", "State Patterns", "状态管理模式", ["Redux/Flux", "MVC vs MVVM", "Immutability"]),
        createTopic("data_cache", "Caching Strategy", "缓存策略基础", ["TTL", "LRU", "Cache Invalidation", "Client-side Caching"])
      ]
    },
    {
      id: "arch_4",
      level: "Level 4: Quality Assurance",
      title: { en: "Unit 4: Testing & Quality", zh: "第四单元：测试与质量体系" },
      description: { en: "Safety nets.", zh: "构建牢不可破的系统" },
      topics: [
        createTopic("test_pyramid", "Testing Pyramid", "测试金字塔", ["Unit Test", "Integration Test", "E2E", "Mocking"]),
        createTopic("test_tdd", "TDD Workflow", "测试驱动开发", ["Red-Green-Refactor", "Test Coverage"]),
        createTopic("ops_cicd", "CI/CD Pipelines", "自动化流水线", ["Linting", "Build", "Deploy", "Git Flow"])
      ]
    },
    {
      id: "arch_5",
      level: "Level 5: Security Basics",
      title: { en: "Unit 5: Security Fundamentals", zh: "第五单元：安全基石" },
      description: { en: "Protecting the user.", zh: "所有开发者必须懂的安全常识" },
      topics: [
        createTopic("sec_auth", "AuthN & AuthZ", "认证与授权", ["OAuth2", "JWT", "Session", "RBAC"]),
        createTopic("sec_web", "Common Vulnerabilities", "常见漏洞攻防", ["XSS", "CSRF", "SQL Injection", "Input Sanitization"]),
        createTopic("sec_crypto", "Encryption Basics", "加密基础", ["Hashing", "Symmetric vs Asymmetric", "HTTPS"])
      ]
    },
    {
      id: "arch_6",
      level: "Level 6: Performance",
      title: { en: "Unit 6: Performance Optimization", zh: "第六单元：性能优化方法论" },
      description: { en: "Making it fast.", zh: "通用的性能分析与调优" },
      topics: [
        createTopic("perf_profiling", "Profiling & Metrics", "性能分析工具", ["CPU Flamegraph", "Memory Heap", "Latency Profiling"]),
        createTopic("perf_complexity", "Time/Space Complexity", "时空复杂度应用", ["Big O in Practice", "Data Structure Choice"]),
        createTopic("perf_async", "Async & Concurrency", "异步与并发模型", ["Event Loop", "Threading", "Blocking vs Non-blocking"])
      ]
    }
  ]
};

// --- PILLAR 2: CS CORE (UNIVERSAL BASE) ---
export const CS_FUNDAMENTALS_DATA: EngineeringPillar = {
  id: 'cs',
  title: { en: "CS Core", zh: "计算机内功" },
  description: { en: "Architecture, Kernel, Network, and Runtime.", zh: "从硬件架构到内核网络，微观底层视角。" },
  modules: [
    {
      id: "unit_arch",
      level: "Level 0: Computer Architecture",
      title: { en: "Unit 0: Computer Architecture", zh: "第零单元：计算机体系结构" },
      description: { en: "Hardware basics.", zh: "硬件与数据表示" },
      topics: [
        createTopic("arch_cpu", "CPU & Instructions", "CPU 指令与流水线", ["Instruction Set", "Registers", "Branch Prediction", "Clock Cycle"]),
        createTopic("arch_data", "Data Representation", "数据的二进制表示", ["Binary/Hex", "Floating Point (IEEE 754)", "Endianness", "Unicode"]),
        createTopic("arch_cache", "Cache Hierarchy", "多级缓存与一致性", ["L1/L2/L3 Cache", "Cache Line", "Cache Coherency", "False Sharing"])
      ]
    },
    {
      id: "unit_os",
      level: "Level 1: Operating System",
      title: { en: "Unit 1: OS Kernel", zh: "第一单元：操作系统核心" },
      description: { en: "Threads & Memory", zh: "进程、线程与内存" },
      topics: [
        createTopic("os_process", "Process & Thread", "进程与线程", ["Context Switch", "PCB", "User/Kernel Space"]),
        createTopic("os_concur", "Concurrency & Locks", "并发与锁", ["Mutex", "Deadlock", "Race Condition"]),
        createTopic("os_memory", "Memory Management", "内存管理", ["Virtual Memory", "Paging", "Stack vs Heap"])
      ]
    },
    {
      id: "unit_net",
      level: "Level 2: Networking",
      title: { en: "Unit 2: Network Stack", zh: "第二单元：网络协议栈" },
      description: { en: "TCP/IP & HTTP", zh: "数据传输的原理" },
      topics: [
        createTopic("net_tcp", "TCP/UDP Internals", "TCP/UDP 深度解析", ["3-Way Handshake", "Congestion Control", "Reliability"]),
        createTopic("net_http", "HTTP/HTTPS", "HTTP 协议演进", ["HTTP/1.1 vs 2 vs 3", "TLS Handshake", "Headers"]),
        createTopic("net_socket", "Socket Programming", "Socket 编程", ["I/O Models", "Blocking/Non-Blocking"])
      ]
    },
    {
      id: "unit_db",
      level: "Level 3: Data Storage",
      title: { en: "Unit 3: Database Internals", zh: "第三单元：数据库原理" },
      description: { en: "How DBs work.", zh: "索引与事务" },
      topics: [
        createTopic("db_index", "Indexing Structures", "索引结构", ["B+ Tree", "LSM Tree", "Hash Index"]),
        createTopic("db_acid", "Transactions (ACID)", "事务与 ACID", ["WAL", "Undo/Redo Log", "Isolation Levels"])
      ]
    },
    {
      id: "unit_runtime",
      level: "Level 4: Runtime Environment",
      title: { en: "Unit 4: Runtime & Compiler", zh: "第四单元：运行时与编译" },
      description: { en: "Code execution.", zh: "代码是如何跑起来的" },
      topics: [
        createTopic("run_gc", "Garbage Collection", "垃圾回收", ["Mark-Sweep", "Reference Counting", "Generational"]),
        createTopic("run_jit", "Compilation (JIT)", "编译原理", ["AST", "Bytecode", "Just-In-Time"])
      ]
    }
  ]
};
