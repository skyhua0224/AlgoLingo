
import {
  ArrowDown,
  ArrowUp,
  Bot,
  Check,
  Columns,
  Eye,
  GripVertical,
  Info,
  Lightbulb,
  ListOrdered,
  MousePointerClick,
  Play,
  Rows,
  Sparkles,
  Terminal,
  User,
  XCircle,
  Zap,
  LayoutTemplate,
  Code2
} from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import Editor, { loader } from "@monaco-editor/react"
import { validateUserCode } from '../../services/geminiService'
import {
  SolutionDisplay,
  UserPreferences,
  Widget,
  WidgetProps,
} from '../../types'
import { Button } from '../Button'

// --- MONACO EDITOR CONFIGURATION ---
// This fixes the "black screen" / worker loading issue in CDN environments
loader.config({
  paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.46.0/min/vs" }
});

// Helper to strip markdown ticks for cleaner dialogue. Safe against undefined.
const formatText = (text: string | undefined | null) => {
  if (!text) return ''
  return text.replace(/`([^`]+)`/g, "'$1'").replace(/\*\*/g, '')
}

// Helper to remove comments
const cleanCodeLine = (line: string) => {
  return line
    .replace(/\s*#.*$/, '')
    .replace(/\s*\/\/.*$/, '')
    .trim()
}

// --- 1. Dialogue Widget ---
export const DialogueWidget: React.FC<{ widget: Widget }> = ({ widget }) => {
  if (!widget.dialogue) return null
  const { text, speaker } = widget.dialogue
  const isCoach = speaker === 'coach'

  return (
    <div
      className={`flex gap-4 mb-6 ${isCoach ? 'flex-row' : 'flex-row-reverse'}`}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm shrink-0 border-2 
        ${
          isCoach
            ? 'bg-brand text-white border-brand-dark'
            : 'bg-blue-500 text-white border-blue-700'
        }`}
      >
        {isCoach ? <Bot size={20} /> : <User size={20} />}
      </div>
      <div
        className={`relative p-4 rounded-2xl max-w-[85%] text-sm md:text-base leading-relaxed shadow-sm border-2
        ${
          isCoach
            ? 'bg-white dark:bg-dark-card border-gray-200 dark:border-gray-700 text-gray-800 dark:text-dark-text rounded-tl-none'
            : 'bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800 text-blue-900 dark:text-blue-100 rounded-tr-none'
        }`}
      >
        <p>{formatText(text)}</p>
      </div>
    </div>
  )
}

// --- 2. Flip Card Widget (Redesigned) ---
interface FlipCardProps {
  widget: Widget
  onAssessment?: (result: 'forgot' | 'remembered') => void
}

export const FlipCardWidget: React.FC<FlipCardProps> = ({
  widget,
  onAssessment,
}) => {
  if (!widget.flipcard) return null
  const [flipped, setFlipped] = useState(false)
  const { front, back, hint, mode } = widget.flipcard

  useEffect(() => {
    setFlipped(false)
  }, [widget.id, front])

  const frontContent = front || 'Tap to reveal'
  const backContent = back || '...'

  return (
    <div className="mb-6 flex flex-col items-center w-full">
      <div
        onClick={() => !flipped && setFlipped(true)}
        className={`relative w-full cursor-pointer transition-all duration-300 group`}
      >
        {/* Front */}
        <div
          className={`
                w-full min-h-[160px] bg-white dark:bg-dark-card rounded-2xl border-2 border-b-4 border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center justify-center text-center shadow-sm
                ${flipped ? 'hidden' : 'flex'}
                group-hover:border-brand group-hover:translate-y-[-2px] transition-all
            `}
        >
          <div className="mb-3 p-2 bg-brand-bg dark:bg-brand/10 rounded-full text-brand">
            <Eye size={24} />
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-dark-text">
            {formatText(frontContent)}
          </h3>
          {hint && (
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wide">
              {hint}
            </p>
          )}
          <p className="mt-4 text-xs text-brand font-bold">Tap to flip</p>
        </div>

        {/* Back */}
        <div
          className={`
                w-full min-h-[160px] bg-brand-bg dark:bg-brand/10 rounded-2xl border-2 border-b-4 border-brand p-6 flex flex-col items-center justify-center text-center shadow-sm
                ${flipped ? 'flex animate-scale-in' : 'hidden'}
            `}
        >
          <div className="mb-3 p-2 bg-white dark:bg-dark-card rounded-full text-brand">
            <Sparkles size={24} />
          </div>
          <h3 className="text-lg font-bold text-brand-dark dark:text-brand-light">
            {formatText(backContent)}
          </h3>

          {mode === 'assessment' && onAssessment && (
            <div className="mt-6 flex gap-4 w-full">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onAssessment('forgot')
                }}
                className="flex-1 bg-white dark:bg-dark-card border-2 border-red-200 dark:border-red-900 text-red-500 py-2 rounded-xl font-bold text-xs hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Forgot
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onAssessment('remembered')
                }}
                className="flex-1 bg-brand text-white py-2 rounded-xl font-bold text-xs hover:bg-brand-light shadow-sm"
              >
                Got it
              </button>
            </div>
          )}

          {!mode && (
            <p
              className="mt-4 text-xs text-brand-dark/50 font-bold"
              onClick={() => setFlipped(false)}
            >
              Tap to flip back
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// --- 3. Interactive Code Widget ---
export const InteractiveCodeWidget: React.FC<{ widget: Widget }> = ({
  widget,
}) => {
  if (!widget.interactiveCode) return null
  const { lines, language, caption } = widget.interactiveCode
  const [activeLine, setActiveLine] = useState<number | null>(null)
  const safeLines = lines || []

  return (
    <div className="mb-6 w-full">
      <div className="bg-[#1e1e1e] rounded-xl shadow-lg overflow-hidden border border-gray-700 relative group max-w-[calc(100vw-3rem)] md:max-w-full mx-auto">
        <div className="bg-[#252526] px-3 py-2 flex items-center justify-between border-b border-gray-700">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          </div>
          <span className="text-xs text-gray-400 font-mono">{language}</span>
        </div>

        <div className="bg-blue-900/30 text-blue-200 px-3 py-1 text-xs border-b border-blue-900/50 flex items-center gap-2 justify-center">
          <MousePointerClick size={12} />
          <span className="font-bold uppercase tracking-wider">
            Tap a line to explain it
          </span>
        </div>

        <div className="overflow-x-auto relative z-0">
          {safeLines.map((line, idx) => (
            <div
              key={idx}
              onClick={() => setActiveLine(idx)}
              className={`flex cursor-pointer transition-colors border-l-4 ${
                activeLine === idx
                  ? 'bg-[#37373d] border-brand'
                  : 'border-transparent hover:bg-[#2d2d2d] hover:border-gray-600'
              }`}
            >
              <div className="w-10 shrink-0 text-right text-gray-600 text-xs font-mono py-2 pr-3 select-none border-r border-gray-700 mr-3 bg-[#252526]">
                {idx + 1}
              </div>
              <div className="py-2 font-mono text-sm text-gray-300 whitespace-pre pr-4">
                {line.code}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[#252526] p-4 border-t-4 border-brand-dark min-h-[100px] transition-all">
          {activeLine !== null && safeLines[activeLine] ? (
            <div className="animate-fade-in-up">
              <div className="flex items-center gap-2 mb-2 text-brand-light font-bold text-xs uppercase tracking-wider">
                <Info size={14} />
                Line {activeLine + 1}
              </div>
              <p className="text-sm text-gray-200 leading-relaxed">
                {safeLines[activeLine].explanation}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-1 py-2">
              <Terminal size={20} />
              <p className="text-xs italic">Select code to see logic.</p>
            </div>
          )}
        </div>
      </div>
      {caption && (
        <p className="text-center text-xs text-gray-400 mt-2">{caption}</p>
      )}
    </div>
  )
}

// --- 4. Steps Widget ---
interface StepsWidgetProps {
  widget: Widget
  onUpdateOrder?: (newOrder: string[]) => void
}

export const StepsWidget: React.FC<StepsWidgetProps> = ({
  widget,
  onUpdateOrder,
}) => {
  if (!widget.stepsList) return null
  const { items, mode } = widget.stepsList

  if (!items || items.length === 0) return null

  const [currentItems, setCurrentItems] = useState<string[]>([])

  useEffect(() => {
    if (items && items.length > 0) {
      if (mode === 'interactive') {
        const shuffled = [...items].sort(() => Math.random() - 0.5)
        setCurrentItems(shuffled)
      } else {
        setCurrentItems(items)
      }
    }
  }, [items, mode, widget.id])

  useEffect(() => {
    if (mode === 'interactive' && onUpdateOrder) {
      onUpdateOrder(currentItems)
    }
  }, [currentItems, mode, onUpdateOrder])

  const move = (idx: number, dir: -1 | 1) => {
    const newItems = [...currentItems]
    const swapIdx = idx + dir
    if (swapIdx >= 0 && swapIdx < newItems.length) {
      ;[newItems[idx], newItems[swapIdx]] = [newItems[swapIdx], newItems[idx]]
      setCurrentItems(newItems)
    }
  }

  if (mode === 'static') {
    return (
      <div className="mb-6 bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
          <ListOrdered
            size={16}
            className="text-gray-500"
          />
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Logic Flow
          </span>
        </div>
        <div className="p-4 space-y-3">
          {currentItems.map((item, idx) => (
            <div
              key={idx}
              className="flex gap-3"
            >
              <div className="w-6 h-6 rounded-full bg-brand/10 text-brand font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                {item}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 mb-6">
      <div className="flex items-center gap-2 mb-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-900/50 text-orange-800 dark:text-orange-400">
        <ListOrdered size={20} />
        <p className="text-sm font-bold">Sort the steps:</p>
      </div>
      {currentItems.map((item, idx) => (
        <div
          key={idx}
          className="bg-white dark:bg-dark-card border-2 border-gray-200 dark:border-gray-700 border-b-4 p-4 rounded-xl flex items-center gap-4 group hover:border-brand transition-all hover:shadow-md"
        >
          <div className="text-gray-300 font-black font-mono text-xl w-6 text-center">
            {idx + 1}
          </div>
          <div className="flex-1 text-sm text-gray-800 dark:text-gray-200 font-bold">
            {item}
          </div>
          <div className="flex flex-col gap-1">
            <button
              aria-label="Move step up"
              onClick={() => move(idx, -1)}
              disabled={idx === 0}
              className="text-gray-400 hover:text-brand disabled:opacity-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded p-1"
            >
              <ArrowUp size={20} />
            </button>
            <button
              aria-label="Move step down"
              onClick={() => move(idx, 1)}
              disabled={idx === currentItems.length - 1}
              className="text-gray-400 hover:text-brand disabled:opacity-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded p-1"
            >
              <ArrowDown size={20} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// --- 5. Parsons Puzzle Widget ---
interface ParsonsProps {
  widget: Widget
  onUpdateOrder: (newOrder: string[]) => void
  status?: string // 'idle', 'correct', 'wrong'
}
export const ParsonsWidget: React.FC<ParsonsProps> = ({
  widget,
  onUpdateOrder,
  status,
}) => {
  if (!widget.parsons) return null
  const [items, setItems] = useState<string[]>([])
  const draggingItem = useRef<number | null>(null)
  const dragOverItem = useRef<number | null>(null)

  useEffect(() => {
    if (widget.parsons?.lines) {
      const cleaned = widget.parsons.lines
        .map(cleanCodeLine)
        .filter((line) => line.length > 0)
      const shuffled = [...cleaned].sort(() => Math.random() - 0.5)
      setItems(shuffled)
    }
  }, [widget.parsons, widget.id])

  useEffect(() => {
    onUpdateOrder(items)
  }, [items])

  const move = (idx: number, dir: -1 | 1) => {
    if (status !== 'idle' && status !== undefined) return
    const newItems = [...items]
    const swapIdx = idx + dir
    if (swapIdx >= 0 && swapIdx < newItems.length) {
      ;[newItems[idx], newItems[swapIdx]] = [newItems[swapIdx], newItems[idx]]
      setItems(newItems)
    }
  }

  const handleDragStart = (e: React.DragEvent, position: number) => {
    if (status !== 'idle' && status !== undefined) return
    draggingItem.current = position
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnter = (e: React.DragEvent, position: number) => {
    if (status !== 'idle' && status !== undefined) return
    dragOverItem.current = position
    e.preventDefault()
  }

  const handleDragEnd = () => {
    if (status !== 'idle' && status !== undefined) return
    const dragIdx = draggingItem.current
    const overIdx = dragOverItem.current

    if (dragIdx !== null && overIdx !== null && dragIdx !== overIdx) {
      const newItems = [...items]
      const draggedItemContent = newItems[dragIdx]
      newItems.splice(dragIdx, 1)
      newItems.splice(overIdx, 0, draggedItemContent)
      setItems(newItems)
    }
    draggingItem.current = null
    dragOverItem.current = null
  }

  return (
    <div className="space-y-2 mb-6">
      <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide mb-2 flex justify-between">
        <span>Reorder Code:</span>
        {status === 'wrong' && (
          <span className="text-red-500 flex items-center gap-1">
            <XCircle size={14} /> Incorrect Order
          </span>
        )}
      </p>

      {status === 'wrong' && widget.parsons.lines && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-900/50 rounded-xl animate-fade-in-up shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-red-400"></div>
          <h4 className="text-red-800 dark:text-red-300 font-extrabold text-xs uppercase mb-3 tracking-wider flex items-center gap-2">
            <Check size={14} /> Correct Solution
          </h4>
          <div className="space-y-1">
            {widget.parsons.lines
              .map(cleanCodeLine)
              .filter((l) => l.length > 0)
              .map((line, i) => (
                <div
                  key={i}
                  className="font-mono text-xs text-red-900 dark:text-red-200 flex gap-3 p-1 rounded bg-red-100/50 dark:bg-red-900/10"
                >
                  <span className="opacity-50 select-none text-[10px] font-bold w-4 text-right mt-0.5">
                    {i + 1}
                  </span>
                  <span className="flex-1 whitespace-pre">{line}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {items.map((line, idx) => {
        let borderClass = 'border-gray-200 dark:border-gray-700 border-b-4'
        if (status === 'wrong')
          borderClass =
            'border-red-300 dark:border-red-800 border-b-4 bg-red-50 dark:bg-red-900/10 opacity-70'
        if (status === 'correct')
          borderClass =
            'border-green-300 dark:border-green-800 border-b-4 bg-green-50 dark:bg-green-900/10'

        return (
          <div
            key={idx}
            draggable={status === 'idle' || status === undefined}
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragEnter={(e) => handleDragEnter(e, idx)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()}
            className={`bg-white dark:bg-dark-card border-2 ${borderClass} p-2 mb-1 rounded-lg flex items-center gap-3 group transition-all cursor-grab active:cursor-grabbing min-h-[42px]`}
          >
            <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded touch-none hidden md:block">
              <GripVertical
                size={16}
                className="text-gray-400 dark:text-gray-500"
              />
            </div>

            <code className="flex-1 font-mono text-xs md:text-sm text-gray-800 dark:text-gray-200 select-none pointer-events-none whitespace-pre-wrap break-all">
              {line}
            </code>

            <div className="flex flex-col gap-0.5">
              <button
                aria-label="Move code line up"
                onClick={() => move(idx, -1)}
                disabled={
                  idx === 0 || (status !== 'idle' && status !== undefined)
                }
                className="p-1 text-gray-400 hover:text-brand disabled:opacity-20 hover:bg-gray-100 dark:hover:bg-gray-700 rounded active:bg-gray-200 dark:active:bg-gray-600 transition-colors"
              >
                <ArrowUp size={16} />
              </button>
              <button
                aria-label="Move code line down"
                onClick={() => move(idx, 1)}
                disabled={
                  idx === items.length - 1 ||
                  (status !== 'idle' && status !== undefined)
                }
                className="p-1 text-gray-400 hover:text-brand disabled:opacity-20 hover:bg-gray-100 dark:hover:bg-gray-700 rounded active:bg-gray-200 dark:active:bg-gray-600 transition-colors"
              >
                <ArrowDown size={16} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// --- 6. Fill-In Widget ---
interface FillInProps {
  widget: Widget
  onUpdateAnswers: (answers: string[]) => void
}
export const FillInWidget: React.FC<FillInProps> = ({
  widget,
  onUpdateAnswers,
}) => {
  if (!widget.fillIn) return null
  const { code, options, inputMode } = widget.fillIn
  const parts = code ? code.split('__BLANK__') : []
  const [answers, setAnswers] = useState<string[]>([])

  useEffect(() => {
    const blankCount = Math.max(0, (code?.split('__BLANK__').length || 0) - 1)
    setAnswers(new Array(blankCount).fill(''))
  }, [widget.id, code])

  useEffect(() => {
    onUpdateAnswers(answers)
  }, [answers])

  const fill = (val: string) => {
    const firstEmpty = answers.findIndex((a) => !a)
    if (firstEmpty !== -1) {
      const newAnswers = [...answers]
      newAnswers[firstEmpty] = val
      setAnswers(newAnswers)
    }
  }

  const handleTextChange = (val: string, idx: number) => {
    const newAnswers = [...answers]
    newAnswers[idx] = val
    setAnswers(newAnswers)
  }

  const clear = (idx: number) => {
    const newAnswers = [...answers]
    newAnswers[idx] = ''
    setAnswers(newAnswers)
  }

  const isTypeMode = inputMode === 'type'

  return (
    <div className="mb-6">
      <div className="bg-[#1e1e1e] p-5 rounded-xl mb-6 border-l-4 border-brand overflow-x-auto shadow-lg max-w-[calc(100vw-3rem)] md:max-w-full mx-auto">
        <pre className="font-mono text-sm text-gray-300 leading-loose whitespace-pre-wrap font-medium">
          {parts.map((part, i) => (
            <React.Fragment key={i}>
              {part}
              {i < parts.length - 1 &&
                (isTypeMode ? (
                  <input
                    type="text"
                    value={answers[i] || ''}
                    onChange={(e) => handleTextChange(e.target.value, i)}
                    className="bg-gray-800 border-b-2 border-gray-500 text-brand-light font-bold px-2 mx-1 min-w-[60px] h-6 focus:outline-none focus:border-brand text-center"
                    placeholder="..."
                  />
                ) : (
                  <span
                    onClick={() => clear(i)}
                    className={`inline-flex items-center justify-center px-2 min-w-[60px] h-6 mx-1 border-b-2 rounded cursor-pointer align-middle transition-all select-none ${
                      answers[i]
                        ? 'text-brand-light border-brand-light bg-brand/20 font-bold'
                        : 'border-gray-600 bg-gray-800 hover:bg-gray-700 animate-pulse'
                    }`}
                  >
                    {answers[i] || '?'}
                  </span>
                ))}
            </React.Fragment>
          ))}
        </pre>
      </div>

      {!isTypeMode && (
        <div className="flex flex-wrap gap-3 justify-center">
          {(options || []).map((opt, idx) => (
            <button
              key={idx}
              onClick={() => fill(opt)}
              className="px-4 py-2 bg-white dark:bg-dark-card rounded-xl border-2 border-gray-200 dark:border-gray-700 border-b-4 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-brand hover:text-brand transition-all font-mono text-sm font-bold active:translate-y-1 active:border-b-2 shadow-sm text-gray-700 dark:text-gray-200"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
      {isTypeMode && (
        <p className="text-center text-xs text-gray-500 font-bold uppercase tracking-wider">
          Type the missing code manually
        </p>
      )}
    </div>
  )
}

// --- 7. Callout Widget ---
export const CalloutWidget: React.FC<{ widget: Widget }> = ({ widget }) => {
  if (!widget.callout) return null
  const { title, text, variant } = widget.callout

  const styles = {
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800',
    warning:
      'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800',
    success:
      'bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-200 border-green-200 dark:border-green-800',
    tip: 'bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-800',
  }

  return (
    <div className={`flex gap-4 mb-6`}>
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm shrink-0 border-2 bg-white dark:bg-dark-card border-gray-200 dark:border-gray-700`}
      >
        {variant === 'tip' ? (
          <Zap
            size={20}
            className="text-purple-500"
          />
        ) : (
          <Lightbulb
            size={20}
            className="text-yellow-500"
          />
        )}
      </div>
      <div
        className={`relative p-4 rounded-2xl rounded-tl-none max-w-[85%] text-sm shadow-sm border-2 ${
          styles[variant || 'info']
        }`}
      >
        <h4 className="font-extrabold text-xs uppercase mb-1 opacity-70 flex items-center gap-1">
          {title}
        </h4>
        <p className="font-medium">{formatText(text)}</p>
      </div>
    </div>
  )
}

// --- 8. Code Editor Widget (Enhanced with 3 Layouts) ---
interface CodeEditorProps {
  widget: Widget
  onUpdateStatus: (status: 'idle' | 'running' | 'success' | 'error') => void
  preferences: UserPreferences
}

type LayoutMode = 'vertical' | 'tabs' | 'leetcode';

export const CodeEditorWidget: React.FC<CodeEditorProps> = ({
  widget,
  onUpdateStatus,
  preferences,
}) => {
  if (!widget.codeEditor) return null
  // Fallback defaults to prevent undefined crashes
  const { solutionTemplate = '', problemDescription = '' } = widget.codeEditor
  
  const [code, setCode] = useState(solutionTemplate)
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [layout, setLayout] = useState<LayoutMode>('vertical')
  const [activeTab, setActiveTab] = useState<'problem' | 'code'>('problem')
  
  // Ref to ensure editor container has size before mount
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Force 'leetcode' layout on large screens initially
  useEffect(() => {
      const checkScreen = () => {
          if (window.innerWidth >= 1024) setLayout('leetcode');
          else setLayout('vertical');
      };
      checkScreen();
      window.addEventListener('resize', checkScreen);
      return () => window.removeEventListener('resize', checkScreen);
  }, []);

  useEffect(() => {
    setCode(solutionTemplate)
    setOutput('')
    setIsRunning(false)
    onUpdateStatus('idle')
  }, [widget.id, solutionTemplate])

  const handleRun = async () => {
    setIsRunning(true)
    onUpdateStatus('running')
    setOutput('Running tests...')

    const result = await validateUserCode(code, problemDescription, preferences)

    setIsRunning(false)
    if (result.correct) {
      setOutput(result.output + '\n\n✅ Passed!')
      onUpdateStatus('success')
    } else {
      setOutput(`Error:\n${result.output}\n\nHint: ${result.feedback}`)
      onUpdateStatus('error')
    }
  }

  const markdownComponents = {
    h1: (props: any) => <h1 className="text-2xl font-bold mb-4 text-white" {...props} />,
    h2: (props: any) => <h2 className="text-xl font-bold mb-3 text-gray-200" {...props} />,
    h3: (props: any) => <h3 className="text-lg font-bold mb-2 text-gray-300" {...props} />,
    p: (props: any) => <p className="mb-4 text-gray-300 leading-relaxed" {...props} />,
    ul: (props: any) => <ul className="list-disc list-inside mb-4 text-gray-300" {...props} />,
    li: (props: any) => <li className="mb-1" {...props} />,
    code: (props: any) => <code className="bg-gray-700 text-sm rounded px-1 py-0.5 font-mono text-brand-light" {...props} />,
    pre: (props: any) => <pre className="bg-gray-800 p-3 rounded-lg mb-4 overflow-x-auto" {...props} />,
  }

  const ProblemPanel = () => (
      <div className="p-5 h-full overflow-y-auto custom-scrollbar bg-[#1e1e1e]">
          {problemDescription ? (
              <ReactMarkdown components={markdownComponents}>
                {problemDescription}
              </ReactMarkdown>
          ) : (
              <div className="text-gray-400 italic">No problem description available.</div>
          )}
      </div>
  );

  const EditorPanel = () => (
    <div className="flex flex-col h-full bg-[#1e1e1e] relative">
       <div className="flex-1 relative" ref={editorContainerRef}>
            <Editor
                height="100%"
                defaultLanguage={preferences.targetLanguage.toLowerCase()}
                theme="vs-dark"
                value={code}
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true, // Critical for preventing freeze/layout issues
                    padding: { top: 10 }
                }}
                onChange={(newValue) => setCode(newValue || '')}
            />
       </div>
       <div className={`bg-[#1e1e1e] border-t border-gray-700 p-3 font-mono text-xs overflow-y-auto custom-scrollbar flex flex-col ${layout === 'leetcode' ? 'h-[30%]' : 'h-32'}`}>
            <div className="flex justify-between items-center mb-2 text-gray-500 font-bold uppercase tracking-wider">
                <span>Console Output</span>
                {isRunning && <span className="animate-pulse text-brand">Running...</span>}
            </div>
            <pre className={`${output.includes('Error') ? 'text-red-400' : 'text-green-400'} whitespace-pre-wrap flex-1`}>
              {output || 'Ready to run...'}
            </pre>
       </div>
    </div>
  );

  return (
    <div className="mb-6 w-full h-[80vh] max-h-[800px]">
      <div className="bg-[#252526] rounded-xl shadow-2xl overflow-hidden border-2 border-gray-700 w-full h-full flex flex-col">
        
        {/* Toolbar */}
        <div className="bg-[#333333] px-3 py-2 flex items-center justify-between border-b border-gray-700 shrink-0">
          <div className="flex items-center gap-3">
             {/* Layout Switcher (Visible on all screens for preference override) */}
            <div className="flex bg-gray-900/50 p-1 rounded-lg">
              <button onClick={() => setLayout('vertical')} className={`p-1.5 rounded-md transition-colors ${layout === 'vertical' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'}`} title="Vertical">
                  <Rows size={14} />
              </button>
              <button onClick={() => setLayout('tabs')} className={`p-1.5 rounded-md transition-colors ${layout === 'tabs' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'}`} title="Tabs">
                  <Columns size={14} />
              </button>
              <button onClick={() => setLayout('leetcode')} className={`hidden lg:block p-1.5 rounded-md transition-colors ${layout === 'leetcode' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'}`} title="Side-by-Side">
                  <LayoutTemplate size={14} />
              </button>
            </div>
            
            {layout === 'tabs' && (
                <div className="flex bg-gray-900/50 p-1 rounded-lg text-xs font-bold">
                    <button onClick={() => setActiveTab('problem')} className={`px-3 py-1 rounded ${activeTab === 'problem' ? 'bg-gray-600 text-white' : 'text-gray-400'}`}>Problem</button>
                    <button onClick={() => setActiveTab('code')} className={`px-3 py-1 rounded ${activeTab === 'code' ? 'bg-gray-600 text-white' : 'text-gray-400'}`}>Code</button>
                </div>
            )}
          </div>

          <button
            onClick={handleRun}
            disabled={isRunning}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg bg-green-600 text-white text-xs font-bold hover:bg-green-500 transition-all active:scale-95 ${isRunning ? 'opacity-50 cursor-wait' : ''}`}
          >
            <Play size={14} fill="currentColor" />
            {isRunning ? 'Running...' : 'Run Code'}
          </button>
        </div>

        {/* Layout Rendering */}
        <div className="flex-1 overflow-hidden relative">
            {layout === 'vertical' && (
                <div className="flex flex-col h-full">
                    <div className="h-1/2 border-b border-gray-700 overflow-hidden"><ProblemPanel /></div>
                    <div className="h-1/2 overflow-hidden"><EditorPanel /></div>
                </div>
            )}

            {layout === 'tabs' && (
                <div className="h-full w-full">
                    {activeTab === 'problem' ? <ProblemPanel /> : <EditorPanel />}
                </div>
            )}

            {layout === 'leetcode' && (
                <div className="flex h-full w-full">
                    <div className="w-1/2 border-r border-gray-700 overflow-hidden"><ProblemPanel /></div>
                    <div className="w-1/2 overflow-hidden"><EditorPanel /></div>
                </div>
            )}
        </div>
      </div>
    </div>
  )
}

// --- 9. Quiz Presenter (Styled) ---
export const QuizWidgetPresenter: React.FC<{
  widget: Widget
  selectedIdx: number | null
  onSelect: (i: number) => void
  status: string
}> = ({ widget, selectedIdx, onSelect, status }) => {
  if (!widget.quiz) return null
  return (
    <div className="mb-6">
      <div className="flex gap-4 mb-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm shrink-0 border-2 bg-brand text-white border-brand-dark">
          <Bot size={20} />
        </div>
        <div className="bg-white dark:bg-dark-card border-2 border-gray-200 dark:border-gray-700 p-4 rounded-2xl rounded-tl-none shadow-sm text-gray-800 dark:text-dark-text font-bold">
          {formatText(widget.quiz.question)}
        </div>
      </div>

      <div className="pl-14 space-y-3">
        {(widget.quiz.options || []).map((opt, idx) => {
          let style =
            'border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400'
          
          // Selected State (Idle)
          if (status === 'idle' && selectedIdx === idx)
            style =
              'border-brand bg-brand-bg dark:bg-brand/20 text-brand-dark dark:text-brand-light ring-2 ring-brand ring-offset-1 dark:ring-offset-dark-bg shadow-md'
          
          // Correct State
          if (status === 'correct' && idx === widget.quiz!.correctIndex)
            style =
              'border-green-500 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 ring-2 ring-green-500'
          
          // Wrong State
          if (status === 'wrong' && idx === selectedIdx)
            style =
              'border-red-500 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 ring-2 ring-red-500'

          return (
            <button
              key={idx}
              onClick={() => status === 'idle' && onSelect(idx)}
              className={`w-full text-left p-5 rounded-2xl border-2 ${style} transition-all text-sm font-bold shadow-sm active:scale-[0.99] flex items-center gap-3`}
            >
               <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs 
                   ${selectedIdx === idx || (status !== 'idle' && idx === widget.quiz!.correctIndex) ? 'border-current' : 'border-gray-300 text-gray-400'}`}>
                   {String.fromCharCode(65+idx)}
               </div>
              {formatText(opt)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// --- 10. View Solution Widget ---
interface ViewSolutionProps extends Omit<WidgetProps, 'widgetData'> {
    widgetData?: SolutionDisplay; // Make optional to handle safe access
}

export const ViewSolutionWidget: React.FC<ViewSolutionProps> = ({ widgetData, onComplete }) => {
    if (!widgetData) return null;
    const { fullCode, explanation } = widgetData;
    const [activeTab, setActiveTab] = useState<'code' | 'explain'>('code');

    return (
        <div className="mb-6 w-full max-w-4xl mx-auto">
            <div className="bg-[#252526] rounded-xl shadow-2xl border-2 border-gray-700 overflow-hidden flex flex-col h-[500px]">
                 {/* Header / Tabs */}
                 <div className="bg-[#333333] px-4 py-3 border-b border-gray-700 flex justify-between items-center">
                      <div className="flex gap-2">
                          <div className="flex bg-gray-900/50 p-1 rounded-lg text-xs font-bold">
                              <button 
                                onClick={() => setActiveTab('code')}
                                className={`px-4 py-1.5 rounded-md transition-all flex items-center gap-2 ${activeTab === 'code' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                              >
                                  <Code2 size={14} /> Code
                              </button>
                              <button 
                                onClick={() => setActiveTab('explain')}
                                className={`px-4 py-1.5 rounded-md transition-all flex items-center gap-2 ${activeTab === 'explain' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                              >
                                  <ListOrdered size={14} /> Breakdown
                              </button>
                          </div>
                      </div>
                      <div className="text-xs text-gray-500 font-mono uppercase tracking-wider font-bold">Solution View</div>
                 </div>

                 {/* Content */}
                 <div className="flex-1 overflow-hidden relative">
                     {activeTab === 'code' && (
                         <Editor
                            height="100%"
                            defaultLanguage="python" // Defaulting to python, could be dynamic
                            theme="vs-dark"
                            value={fullCode}
                            options={{
                                readOnly: true,
                                minimap: { enabled: false },
                                fontSize: 14,
                                automaticLayout: true,
                                scrollBeyondLastLine: false,
                                padding: { top: 16 }
                            }}
                         />
                     )}
                     
                     {activeTab === 'explain' && (
                         <div className="h-full overflow-y-auto custom-scrollbar p-6 bg-[#1e1e1e]">
                             <h3 className="text-lg font-bold text-white mb-4">Line-by-Line Explanation</h3>
                             <div className="space-y-4">
                                 {explanation.map((item, idx) => (
                                     <div key={idx} className="flex gap-4 group">
                                         <div className="w-12 pt-1 text-right font-mono text-sm text-blue-400 font-bold shrink-0 group-hover:text-blue-300">
                                             L{item.lineNumber}
                                         </div>
                                         <div className="flex-1 text-gray-300 text-sm leading-relaxed border-l-2 border-gray-700 pl-4 py-1 group-hover:border-blue-500 transition-colors">
                                             {item.explanation}
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         </div>
                     )}
                 </div>
            </div>
            
            <div className="mt-6 flex justify-end">
                 <Button onClick={() => onComplete(true)} variant="primary" className="shadow-lg">
                     I Understand, Continue
                 </Button>
            </div>
        </div>
    );
}
