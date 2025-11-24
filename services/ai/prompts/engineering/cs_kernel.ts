
import { BASE_SYSTEM_INSTRUCTION } from "../system";

// 8-Phase Model for CS Core (Kernel/Internal)
const PHASE_STRATEGIES: Record<string, string> = {
    'phase_01': `
    **PHASE 01: INTUITION & ANALOGY (Physical Reality)**
    - **GOAL**: Explain the physical/logical constraint without code.
    - **WIDGETS ALLOWED**: 'dialogue', 'flipcard', 'quiz'.
    - **FORBIDDEN**: 'parsons', 'code', 'terminal'.
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
    - **WIDGETS ALLOWED**: 'steps-list' (State transitions), 'interactive-code'.
    - **FOCUS**: 3-way handshake steps, Thread state machine (Ready->Running->Blocked).
    `,
    'phase_04': `
    **PHASE 04: SYSCALLS & ABI (The Boundary)**
    - **GOAL**: Crossing from User Space to Kernel Space.
    - **WIDGETS ALLOWED**: 'fill-in' (Syscall args), 'quiz' (Context switching).
    - **FOCUS**: fork(), exec(), ioctl(), trap instructions.
    `,
    'phase_05': `
    **PHASE 05: IMPLEMENTATION (Low Level)**
    - **GOAL**: Interacting with the Runtime.
    - **WIDGETS ALLOWED**: 'fill-in' (C/C++ snippets), 'terminal' (strace/gdb), 'mini-editor'.
    - **FOCUS**: malloc() implementation, socket options, bitwise ops.
    `,
    'phase_06': `
    **PHASE 06: MEMORY & LAYOUT (The Map)**
    - **GOAL**: Understanding physical/virtual addressing.
    - **WIDGETS ALLOWED**: 'interactive-code' (Pointer arithmetic), 'quiz' (Segmentation).
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
    - **WIDGETS ALLOWED**: 'mini-editor' (Write a spinlock / simple allocator), 'parsons'.
    - **FOCUS**: Hardcore implementation details.
    `
};

export const getCSKernelPrompt = (topic: string, keywords: string[], level: string) => {
    const instruction = PHASE_STRATEGIES[level] || PHASE_STRATEGIES['phase_01'];

    return `
    ${BASE_SYSTEM_INSTRUCTION}

    **ROLE**: Kernel Hacker & OS Engineer.
    **TOPIC**: "${topic}"
    **KEYWORDS**: ${keywords.join(', ')}.

    **PHASE INSTRUCTION (STRICTLY FOLLOW WIDGET RULES)**:
    ${instruction}

    **SCREEN COMPOSITION RULES (CRITICAL)**:
    1. **COMBINE CONTEXT & ACTION**: Do NOT split "Teaching" and "Testing" into separate screens.
       - **BAD**: Screen 1 (Dialogue explaining Syscalls), Screen 2 (Terminal exercise).
       - **GOOD**: Screen 1 (Dialogue explaining Syscalls + Terminal exercise).
    2. **MANDATORY INTERACTION**: Every single screen MUST contain EXACTLY ONE interactive widget from the ALLOWED list.
    3. **STRUCTURE**: 
       - Start with 'dialogue' (The Kernel Guru speaking) or 'callout' (Context).
       - Follow immediately with the interactive widget.

    **WIDGET REQUIREMENTS**:
    - Generate EXACTLY 17 Screens.
    - Focus on "How it works physically".
    `;
};
