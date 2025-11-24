
import { SkillTrack } from '../types/engineering';

// Define category metadata
export const CATEGORY_META = {
    "arch": { title: { en: "Adv. Architecture", zh: "高阶架构" }, icon: "Layers" },
    "ai": { title: { en: "AI Engineering", zh: "AI 工程" }, icon: "Brain" },
    "backend": { title: { en: "Backend", zh: "后端开发" }, icon: "Server" },
    "frontend": { title: { en: "Frontend", zh: "前端开发" }, icon: "Code2" },
    "infra": { title: { en: "Infra & DevOps", zh: "云原生/运维" }, icon: "Cloud" },
    "game": { title: { en: "Game Dev", zh: "游戏开发" }, icon: "Gamepad2" },
    "data": { title: { en: "Data Eng", zh: "数据工程" }, icon: "Database" },
    "mobile": { title: { en: "Mobile", zh: "移动端" }, icon: "Smartphone" },
    "sec": { title: { en: "Security", zh: "安全工程" }, icon: "ShieldAlert" },
    "qa": { title: { en: "Quality Assurance", zh: "测试/QA" }, icon: "CheckCircle" }
};

export const TRACK_PRESETS: SkillTrack[] = [
    // --- 1. Advanced Architecture ---
    {
        id: "dist_consensus",
        title: { en: "Distributed Consensus", zh: "分布式共识算法" },
        icon: "Network",
        category: "arch",
        description: { en: "Raft, Paxos, and Leader Election deep dive.", zh: "深入 Raft、Paxos 与选主机制。" },
        progress: 0, isOfficial: true, createdAt: 0,
        keywords: ["Raft", "Paxos", "Leader Election", "Log Replication", "Brain Split", "Quorum"]
    },
    {
        id: "dist_transactions",
        title: { en: "Distributed Transactions", zh: "分布式事务" },
        icon: "Activity",
        category: "arch",
        description: { en: "2PC, 3PC, Saga Pattern, and TCC.", zh: "2PC, 3PC, Saga 模式与 TCC 实战。" },
        progress: 0, isOfficial: true, createdAt: 0,
        keywords: ["Two-Phase Commit", "Saga Pattern", "TCC", "Eventual Consistency", "Distributed Rollback"]
    },
    {
        id: "msg_queues",
        title: { en: "Message Queues Deep Dive", zh: "消息队列深度解析" },
        icon: "HardDrive",
        category: "arch",
        description: { en: "Kafka/RabbitMQ internals and patterns.", zh: "Kafka/RabbitMQ 核心原理与应用模式。" },
        progress: 0, isOfficial: true, createdAt: 0,
        keywords: ["Kafka", "RabbitMQ", "Partitioning", "Consumer Groups", "Exactly-once", "Ack Mechanisms"]
    },
    {
        id: "micro_gov",
        title: { en: "Microservices Governance", zh: "微服务治理" },
        icon: "LayoutGrid",
        category: "arch",
        description: { en: "Service Mesh, Discovery, and Circuit Breaking.", zh: "服务网格、发现与熔断机制。" },
        progress: 0, isOfficial: true, createdAt: 0,
        keywords: ["Service Mesh", "Istio", "Circuit Breaker", "Rate Limiting", "Service Discovery", "gRPC"]
    },

    // --- 2. AI Engineering ---
    {
        id: "llm_eng",
        title: { en: "LLM Engineering", zh: "大模型工程化" },
        icon: "Brain",
        category: "ai",
        description: { en: "Prompt Engineering, RAG, and Agents.", zh: "提示词工程、RAG 与智能体开发。" },
        progress: 0, isOfficial: true, createdAt: 0,
        keywords: ["RAG", "Vector Database", "LangChain", "Agents", "Prompt Engineering", "Context Window"]
    },
    {
        id: "model_finetune",
        title: { en: "Model Fine-tuning", zh: "模型微调技术" },
        icon: "Zap",
        category: "ai",
        description: { en: "LoRA, PEFT, and Quantization techniques.", zh: "LoRA, PEFT 与量化技术。" },
        progress: 0, isOfficial: true, createdAt: 0,
        keywords: ["LoRA", "PEFT", "Quantization", "Fine-tuning", "Weights", "Training Pipeline"]
    },
    {
        id: "pytorch_core",
        title: { en: "PyTorch Internals", zh: "PyTorch 内核" },
        icon: "Activity",
        category: "ai",
        description: { en: "Tensors, Autograd, and Computational Graphs.", zh: "张量、自动微分与计算图。" },
        progress: 0, isOfficial: true, createdAt: 0,
        keywords: ["Tensor", "Autograd", "Backpropagation", "Computational Graph", "Module", "Optimizer"]
    },
    {
        id: "ai_ops",
        title: { en: "MLOps & Deployment", zh: "MLOps 与模型部署" },
        icon: "Server",
        category: "ai",
        description: { en: "Serving, Monitoring, and Model Registry.", zh: "模型服务化、监控与版本管理。" },
        progress: 0, isOfficial: true, createdAt: 0,
        keywords: ["Triton", "TensorRT", "Model Registry", "Feature Store", "Drift Detection"]
    },

    // --- 3. Backend ---
    {
        id: "backend_ddd",
        title: { en: "Domain Driven Design", zh: "领域驱动设计 (DDD)" },
        icon: "LayoutTemplate",
        category: "backend",
        description: { en: "Tactical & Strategic patterns for complex systems.", zh: "解决复杂业务逻辑的战术与战略模式。" },
        progress: 0, isOfficial: true, createdAt: 0,
        keywords: ["Aggregate", "Entity", "Value Object", "Repository", "Bounded Context", "Ubiquitous Language"]
    },
    {
        id: "backend_cloud_native",
        title: { en: "Cloud Native Arch", zh: "云原生架构" },
        icon: "Cloud",
        category: "backend",
        description: { en: "12-Factor Apps, Serverless, and Observability.", zh: "十二要素应用、Serverless 与可观测性。" },
        progress: 0, isOfficial: true, createdAt: 0,
        keywords: ["12-Factor", "Serverless", "Lambda", "Containerization", "Immutable Infrastructure"]
    },
    {
        id: "spring_boot",
        title: { en: "Spring Boot Mastery", zh: "Spring Boot 精通" },
        icon: "Coffee",
        category: "backend",
        description: { en: "IOC, AOP, Auto-config ecosystem.", zh: "IOC, AOP 与自动配置生态。" },
        progress: 0, isOfficial: true, createdAt: 0,
        keywords: ["Spring Boot", "IOC Container", "AOP", "Bean Lifecycle", "Auto Configuration", "Spring Security"]
    },
    {
        id: "redis_deep",
        title: { en: "Redis Deep Dive", zh: "Redis 深度剖析" },
        icon: "Database",
        category: "backend",
        description: { en: "Persistence, Cluster, and Sentinel.", zh: "持久化、集群与哨兵机制。" },
        progress: 0, isOfficial: true, createdAt: 0,
        keywords: ["RDB", "AOF", "Redis Cluster", "Sentinel", "Redis Protocol", "Memory Eviction"]
    },
    {
        id: "go_concur",
        title: { en: "Go Concurrency", zh: "Go 并发编程" },
        icon: "Box",
        category: "backend",
        description: { en: "Goroutines, Channels, and Scheduler.", zh: "协程、通道与 GMP 调度器。" },
        progress: 0, isOfficial: true, createdAt: 0,
        keywords: ["Goroutine", "Channel", "GMP Model", "Scheduler", "Mutex", "WaitGroup"]
    },
    {
        id: "rust_systems",
        title: { en: "Rust Systems Prog.", zh: "Rust 系统编程" },
        icon: "Zap",
        category: "backend",
        description: { en: "Ownership, Lifetimes, and Safety.", zh: "所有权、生命周期与内存安全。" },
        progress: 0, isOfficial: true, createdAt: 0,
        keywords: ["Ownership", "Borrow Checker", "Lifetimes", "Traits", "Unsafe Rust", "Async/Await"]
    },

    // --- 4. Frontend ---
    {
        id: "react_internal",
        title: { en: "React Internals", zh: "React 源码揭秘" },
        icon: "Code2",
        category: "frontend",
        description: { en: "Fiber, Reconciliation, and Hooks.", zh: "Fiber 架构、协调算法与 Hooks 原理。" },
        progress: 0, isOfficial: true, createdAt: 0,
        keywords: ["Virtual DOM", "Fiber Architecture", "Reconciliation", "Hooks Implementation", "Scheduler", "Synthetic Event"]
    },
    {
        id: "vue_core",
        title: { en: "Vue.js 3 Internals", zh: "Vue.js 3 核心原理" },
        icon: "Box",
        category: "frontend",
        description: { en: "Reactivity system, Proxy, and Virtual DOM.", zh: "响应式系统、Proxy 与虚拟 DOM。" },
        progress: 0, isOfficial: true, createdAt: 0,
        keywords: ["Reactivity", "Proxy", "Dependency Tracking", "Composition API", "Compiler"]
    },
    {
        id: "uniapp_cross",
        title: { en: "UniApp & Cross-Platform", zh: "UniApp 跨端开发" },
        icon: "Smartphone",
        category: "frontend",
        description: { en: "Mini-program architecture and bridge.", zh: "小程序架构与 Bridge 原理。" },
        progress: 0, isOfficial: true, createdAt: 0,
        keywords: ["Mini Program", "JSBridge", "Rendering", "Cross-Platform", "WeChat"]
    },
    {
        id: "webgl_three",
        title: { en: "WebGL & Three.js", zh: "WebGL 与 Three.js" },
        icon: "Monitor",
        category: "frontend",
        description: { en: "Shaders, Geometry, and Rendering loop.", zh: "着色器、几何体与渲染循环。" },
        progress: 0, isOfficial: true, createdAt: 0,
        keywords: ["Vertex Shader", "Fragment Shader", "GLSL", "Render Loop", "Geometry", "Material"]
    },
    {
        id: "fe_perf",
        title: { en: "Frontend Perf.", zh: "前端性能极致优化" },
        icon: "Activity",
        category: "frontend",
        description: { en: "Core Web Vitals, SSR, and Hydration.", zh: "关键指标、SSR 与水合优化。" },
        progress: 0, isOfficial: true, createdAt: 0,
        keywords: ["LCP", "CLS", "FID", "Tree Shaking", "Code Splitting", "SSR vs CSR"]
    },

    // --- 5. Game Dev ---
    {
        id: "game_render",
        title: { en: "Computer Graphics", zh: "计算机图形学" },
        icon: "PenTool",
        category: "game",
        description: { en: "The rendering pipeline deep dive.", zh: "渲染管线、光照模型与着色器编程。" },
        progress: 0, isOfficial: true, createdAt: 0,
        keywords: ["Rendering Pipeline", "Shader Programming", "PBR", "Ray Tracing", "Matrices", "Linear Algebra"]
    },
    {
        id: "unity_arch",
        title: { en: "Unity Architecture", zh: "Unity 架构与性能" },
        icon: "Box",
        category: "game",
        description: { en: "ECS, DOTS, and Memory Management.", zh: "ECS 架构、DOTS 与内存优化。" },
        progress: 0, isOfficial: true, createdAt: 0,
        keywords: ["ECS", "DOTS", "Burst Compiler", "Asset Bundles", "Coroutine", "MonoBehaviour Lifecycle"]
    },
    {
        id: "ue5_cpp",
        title: { en: "Unreal Engine 5 C++", zh: "UE5 C++ 开发" },
        icon: "Cpu",
        category: "game",
        description: { en: "Gameplay framework and UObject system.", zh: "游戏框架与 UObject 系统。" },
        progress: 0, isOfficial: true, createdAt: 0,
        keywords: ["UObject", "Actor Lifecycle", "Blueprints", "Garbage Collection", "Replication", "Physics"]
    },
    {
        id: "game_net",
        title: { en: "Game Networking", zh: "游戏网络同步" },
        icon: "Globe",
        category: "game",
        description: { en: "State sync, Prediction, and Compensation.", zh: "状态同步、预测与延迟补偿。" },
        progress: 0, isOfficial: true, createdAt: 0,
        keywords: ["Client-Side Prediction", "Server Reconciliation", "Lag Compensation", "Snapshot Interpolation", "UDP vs TCP"]
    },

    // --- 6. Infra / DevOps ---
    {
        id: "k8s_internal",
        title: { en: "Kubernetes Internals", zh: "Kubernetes 内核" },
        icon: "Anchor",
        category: "infra",
        description: { en: "Etcd, Controllers, and Scheduler.", zh: "Etcd, 控制器与调度器原理。" },
        progress: 0, isOfficial: true, createdAt: 0,
        keywords: ["Etcd", "Controller Pattern", "Scheduler", "Kubelet", "CNI", "CSI"]
    },
    {
        id: "docker_core",
        title: { en: "Container Runtime", zh: "容器运行时" },
        icon: "Box",
        category: "infra",
        description: { en: "Namespaces, Cgroups, and OverlayFS.", zh: "命名空间、Cgroups 与分层文件系统。" },
        progress: 0, isOfficial: true, createdAt: 0,
        keywords: ["Namespace", "Cgroup", "OverlayFS", "Docker Daemon", "Containerd", "Runc"]
    },
    {
        id: "docker_compose",
        title: { en: "Docker Compose & Orch", zh: "Docker Compose 编排" },
        icon: "LayoutGrid",
        category: "infra",
        description: { en: "Multi-container service orchestration.", zh: "多容器服务编排与网络。" },
        progress: 0, isOfficial: true, createdAt: 0,
        keywords: ["YAML", "Networking", "Volumes", "Services", "Depends On", "Env Vars"]
    },
    {
        id: "iac_terraform",
        title: { en: "IaC with Terraform", zh: "Terraform 基础设施即代码" },
        icon: "Cloud",
        category: "infra",
        description: { en: "State management and modules.", zh: "状态管理、模块化与云编排。" },
        progress: 0, isOfficial: true, createdAt: 0,
        keywords: ["HCL", "State File", "Modules", "Providers", "Drift Detection", "Plan/Apply"]
    },

    // --- 7. Data Engineering ---
    {
        id: "bigdata_spark",
        title: { en: "Apache Spark Core", zh: "Spark 核心原理" },
        icon: "Database",
        category: "data",
        description: { en: "RDD, DAG, and Shuffle.", zh: "RDD, DAG 调度与 Shuffle 机制。" },
        progress: 0, isOfficial: true, createdAt: 0,
        keywords: ["RDD", "DataFrame", "Catalyst Optimizer", "Shuffle", "DAG Scheduler", "Memory Management"]
    },
    {
        id: "data_warehouse",
        title: { en: "Data Warehousing", zh: "数仓建模" },
        icon: "Server",
        category: "data",
        description: { en: "Kimball, Snowflake Schema, and OLAP.", zh: "维度建模、星型模型与 OLAP。" },
        progress: 0, isOfficial: true, createdAt: 0,
        keywords: ["Star Schema", "Snowflake Schema", "ETL/ELT", "Columnar Storage", "Fact Table"]
    },

    // --- 8. Mobile ---
    {
        id: "flutter_arch",
        title: { en: "Flutter Architecture", zh: "Flutter 架构" },
        icon: "Smartphone",
        category: "mobile",
        description: { en: "Widget tree, Skia, and State.", zh: "Widget 树、Skia 渲染与状态管理。" },
        progress: 0, isOfficial: true, createdAt: 0,
        keywords: ["Widget Tree", "Element Tree", "Render Object", "Skia", "Bloc", "Platform Channels"]
    },
    {
        id: "swiftui_modern",
        title: { en: "SwiftUI & iOS Modern", zh: "SwiftUI 现代开发" },
        icon: "LayoutTemplate",
        category: "mobile",
        description: { en: "Declarative UI, Combine, and Concurrency.", zh: "声明式 UI、Combine 框架与 Swift 并发。" },
        progress: 0, isOfficial: true, createdAt: 0,
        keywords: ["Declarative UI", "Combine", "StateObject", "Async/Await", "ViewBuilder"]
    },
    {
        id: "ios_runtime",
        title: { en: "iOS Runtime (ObjC)", zh: "iOS Runtime 机制" },
        icon: "Smartphone",
        category: "mobile",
        description: { en: "Message passing and Swizzling.", zh: "消息发送、Method Swizzling 与动态特性。" },
        progress: 0, isOfficial: true, createdAt: 0,
        keywords: ["objc_msgSend", "ISA Swizzling", "KVO", "Reference Counting", "AutoReleasePool"]
    },

    // --- 9. Security ---
    {
        id: "web_pentest",
        title: { en: "Web Penetration", zh: "Web 渗透测试" },
        icon: "ShieldAlert",
        category: "sec",
        description: { en: "OWASP Top 10 exploitation.", zh: "OWASP Top 10 漏洞利用与防御。" },
        progress: 0, isOfficial: true, createdAt: 0,
        keywords: ["XSS", "SQL Injection", "CSRF", "SSRF", "Deserialization", "Burp Suite"]
    },
    
    // --- 10. QA / Automation ---
    {
        id: "qa_auto",
        title: { en: "Test Automation", zh: "自动化测试框架" },
        icon: "CheckCircle",
        category: "qa",
        description: { en: "Selenium, Playwright, and Appium.", zh: "主流自动化工具与测试策略。" },
        progress: 0, isOfficial: true, createdAt: 0,
        keywords: ["Selenium", "Playwright", "Page Object Model", "E2E", "Headless Browser", "CI Integration"]
    }
];