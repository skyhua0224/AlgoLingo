
import { BASE_SYSTEM_INSTRUCTION } from "../system";

// 8-Phase Model for CS Core (Kernel/Internal)
const PHASE_STRATEGIES: Record<string, string> = {
    'phase_01': `
    **PHASE 01: INTUITION & ANALOGY (Physical Reality)**
    - **GOAL**: Explain the physical/logical constraint without code.
    - **WIDGETS ALLOWED**: 'dialogue', 'flipcard', 'quiz'.
    - **FORBIDDEN**: 'parsons', 'code', 'terminal', 'mini-editor'.
    - **STYLE**: "Think of a CPU core like a worker at a desk..."
    `,
    'phase_02': `
    **PHASE 02: CORE ANATOMY (Structures)**
    - **GOAL**: Define data structures and memory layout.
    - **WIDGETS ALLOWED**: 'flipcard' (Structs/Fields), 'quiz', 'interactive-code' (Read-only struct definition).
    - **FORBIDDEN**: 'parsons', 'terminal', 'fill-in'.
    - **FOCUS**: Stack vs Heap, PCB, TCP Header fields.
    `,
    'phase_03': `
    **PHASE 03: THE WORKFLOW (Lifecycle)**
    - **GOAL**: Visualize the lifecycle of the object/process.
    - **WIDGETS ALLOWED**: 'steps-list' (State transitions), 'mermaid' (Flowchart), 'interactive-code'.
    - **FOCUS**: 3-way handshake steps, Thread state machine (Ready->Running->Blocked).
    `,
    'phase_04': `
    **PHASE 04: SYSCALLS & ABI (The Boundary)**
    - **GOAL**: Crossing from User Space to Kernel Space.
    - **WIDGETS ALLOWED**: 'fill-in' (Syscall args), 'quiz' (Context switching), 'terminal' (strace simulation).
    - **FOCUS**: fork(), exec(), ioctl(), trap instructions.
    `,
    'phase_05': `
    **PHASE 05: IMPLEMENTATION (Low Level)**
    - **GOAL**: Interacting with the Runtime.
    - **WIDGETS ALLOWED**: 'fill-in' (C/C++ snippets), 'code-walkthrough' (Kernel source reading), 'mini-editor'.
    - **WIDGETS MANDATORY**: Use 'code-walkthrough' to explain a complex kernel function.
    - **FOCUS**: malloc() implementation, socket options, bitwise ops.
    `,
    'phase_06': `
    **PHASE 06: MEMORY & LAYOUT (The Map)**
    - **GOAL**: Understanding physical/virtual addressing.
    - **WIDGETS ALLOWED**: 'interactive-code' (Pointer arithmetic), 'quiz' (Segmentation), 'terminal' (pmap/vmstat).
    - **WIDGETS MANDATORY**: Use 'terminal' to simulate inspecting memory maps.
    - **FOCUS**: VMA, Page Tables, Cache Lines.
    `,
    'phase_07': `
    **PHASE 07: HAZARDS & CONCURRENCY**
    - **GOAL**: What goes wrong?
    - **WIDGETS ALLOWED**: 'quiz' (Race conditions), 'parsons' (Lock ordering), 'callout'.
    - **FOCUS**: Deadlocks, Memory Leaks, Zoning out.
    `,
    'phase_08': `
    **PHASE 08: THE GAUNTLET (Kernel Hacker)**
    - **GOAL**: Re-implement a simplified version.
    - **WIDGETS MANDATORY**: 'mini-editor' (Write a spinlock / simple allocator) OR 'terminal' (Debug session).
    - **FORBIDDEN**: 'dialogue', simple 'quiz'.
    - **FOCUS**: Hardcore implementation details.
    `
};

export const getCSKernelPrompt = (topic: string, keywords: string[], level: string) => {
    
    // Fallback logic
    let instruction = PHASE_STRATEGIES['phase_01'];
    let phaseId = 'phase_01';

    if (PHASE_STRATEGIES[level]) {
        instruction = PHASE_STRATEGIES[level];
        phaseId = level;
    } else if (level.includes('phase_')) {
        const match = level.match(/phase_\d+/);
        if (match && PHASE_STRATEGIES[match[0]]) {
            instruction = PHASE_STRATEGIES[match[0]];
            phaseId = match[0];
        }
    } else {
        if (level.includes('Mastery')) { instruction = PHASE_STRATEGIES['phase_08']; phaseId='phase_08'; }
        else if (level.includes('Implement')) { instruction = PHASE_STRATEGIES['phase_05']; phaseId='phase_05'; }
        else if (level.includes('Structure')) { instruction = PHASE_STRATEGIES['phase_02']; phaseId='phase_02'; }
    }

    return `
    ${BASE_SYSTEM_INSTRUCTION}

    **ROLE**: Kernel Hacker & OS Engineer.
    **TOPIC**: "${topic}"
    **KEYWORDS**: ${keywords.join(', ')}.
    **CURRENT PHASE**: ${phaseId}

    **PHASE INSTRUCTION (STRICTLY FOLLOW WIDGET RULES)**:
    ${instruction}

    **SCREEN COMPOSITION RULES (CRITICAL)**:
    1. **MANDATORY INTERACTION**: Every single screen MUST contain EXACTLY ONE interactive widget.
    2. **DIFFICULTY**: 
       - If Phase >= 05, do NOT use simple 'quiz'. Prefer 'fill-in' or 'code-walkthrough'.
       - If Phase >= 08, use 'mini-editor' or 'terminal' to test mastery.

    **WIDGET REQUIREMENTS**:
    - Generate EXACTLY 17 Screens.
    - Focus on "How it works physically" (Memory, Registers, Latency).
    `;
};
