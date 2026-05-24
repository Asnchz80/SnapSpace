import { useState, useEffect, useRef } from 'react'
import { Send, Loader2, Sparkles } from 'lucide-react'

const SUGGESTIONS = [
  'Make it more minimalist',
  'Add more plants',
  'Use warmer lighting',
  'Change the flooring to wood',
  'Make it darker and moodier',
  'Add a fireplace',
  'Remove the rug',
  'Make the walls white',
]

export default function ChatBar({ chatHistory = [], onSend, isLoading = false }) {
  const [input, setInput]           = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const historyRef                  = useRef(null)
  const inputRef                    = useRef(null)

  // Auto-scroll history to bottom on new messages
  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight
    }
  }, [chatHistory])

  const handleSubmit = (e) => {
    e?.preventDefault()
    const msg = input.trim()
    if (!msg || isLoading) return
    setInput('')
    setShowSuggestions(false)
    onSend(msg)
  }

  const handleSuggestion = (s) => {
    if (isLoading) return
    setShowSuggestions(false)
    onSend(s)
  }

  const hasHistory = chatHistory.length > 0

  return (
    <div className="card p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles size={13} className="text-[#7C3AED]" />
        <span className="text-xs font-medium text-[#6B6B8A]">Ask AI to modify this design</span>
      </div>

      {/* Chat history */}
      {hasHistory && (
        <div
          ref={historyRef}
          className="flex flex-col gap-2 max-h-40 overflow-y-auto no-scrollbar pr-1"
        >
          {chatHistory.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`px-3 py-2 rounded-xl text-xs leading-relaxed max-w-[85%] ${
                  msg.role === 'user'
                    ? 'bg-violet-50 text-violet-700 border border-violet-200'
                    : 'bg-[#F5F5FA] text-[#6B6B8A] border border-black/[0.07]'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="px-3 py-2 rounded-xl text-xs bg-[#F5F5FA] border border-black/[0.07] text-[#9B9BB8] flex items-center gap-2">
                <Loader2 size={10} className="animate-spin text-[#7C3AED]" />
                Redesigning…
              </div>
            </div>
          )}
        </div>
      )}

      {/* Suggestion chips — show only when no history and not loading */}
      {!hasHistory && !isLoading && (
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSuggestion(s)}
              className="px-2.5 py-1 rounded-full text-[11px] bg-[#F0F0F8] border border-black/[0.07] text-[#6B6B8A] hover:border-[#7C3AED]/40 hover:text-[#7C3AED] transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input row */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='e.g. "add a fireplace", "make it darker", "remove the rug"'
          disabled={isLoading}
          className="flex-1 bg-[#F5F5FA] border border-black/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-[#0D0D1A] placeholder-[#9B9BB8] focus:outline-none focus:border-[#7C3AED]/50 transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="btn-brand flex items-center justify-center w-10 h-10 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 transition-all"
        >
          {isLoading
            ? <Loader2 size={15} className="animate-spin" />
            : <Send size={15} />
          }
        </button>
      </form>
    </div>
  )
}
