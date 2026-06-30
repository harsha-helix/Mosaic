import { useState, useEffect, useRef } from 'react'
import { getAllMoments } from '../../lib/db/queries'
import { formatDateLabel, momentMatchesQuery, highlight } from '../../lib/utils'
import type { Moment, MomentType } from '../../types'
import { MOMENT_COLORS } from '../../types'

const ALL_TYPES: MomentType[] = [
  'photo','beautiful','idea','gratitude','anxiety','conversation',
  'reading','music','quote','workout','coffee','nicotine','place','insight',
]

function ResultCard({ moment, query }: { moment: Moment; query: string }) {
  const color = MOMENT_COLORS[moment.type] ?? '#AAAAAA'
  const highlighted = moment.text ? highlight(moment.text, query) : ''
  return (
    <div
      className="rounded-[16px] p-4 bg-white dark:bg-[#1E1E1E]"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderLeft: '3px solid ' + color }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <span className="text-[12px] font-medium capitalize" style={{ color }}>{moment.type}</span>
        <span className="text-[12px] text-[#AAAAAA]">&middot; {formatDateLabel(moment.captured_at.slice(0, 10))}</span>
        {moment.remember && <span className="text-[#FFD93D] ml-auto">★</span>}
      </div>
      {highlighted && (
        <p
          className="text-[14px] text-[#333333] dark:text-[#CCCCCC] leading-relaxed line-clamp-3"
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      )}
    </div>
  )
}

export default function SearchScreen() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<MomentType | null>(null)
  const [allMoments, setAllMoments] = useState<Moment[]>([])

  useEffect(() => {
    getAllMoments().then(m => setAllMoments(m.sort((a, b) => b.captured_at.localeCompare(a.captured_at))))
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  const filtered = allMoments.filter(m => {
    const typeOk = !typeFilter || m.type === typeFilter
    const textOk = !query.trim() || momentMatchesQuery(m, query)
    return typeOk && textOk
  })

  const showRecent = !query.trim() && !typeFilter
  const results = showRecent ? allMoments.slice(0, 5) : filtered

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#141414] px-4 pt-14 pb-24">
      {/* Search input */}
      <div className="relative mb-4">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#AAAAAA] text-[16px]">&#128269;</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search memories..."
          className="w-full pl-10 pr-4 py-3.5 rounded-[16px] bg-white dark:bg-[#1E1E1E] border border-[#E8E8E8] dark:border-[#2E2E2E] text-[#111111] dark:text-[#F0F0F0] text-[15px] outline-none focus:border-[#7C4DFF]"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#AAAAAA] text-[18px] leading-none"
          >&times;</button>
        )}
      </div>

      {/* Type filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-5 no-scrollbar">
        <button
          onClick={() => setTypeFilter(null)}
          className="flex-shrink-0 px-4 py-1.5 rounded-[999px] text-[13px] font-medium border-2 transition-colors"
          style={{
            borderColor: !typeFilter ? '#7C4DFF' : '#E8E8E8',
            backgroundColor: !typeFilter ? '#7C4DFF15' : 'transparent',
            color: !typeFilter ? '#7C4DFF' : '#666666',
          }}
        >All</button>
        {ALL_TYPES.map(type => {
          const color = MOMENT_COLORS[type]
          const active = typeFilter === type
          return (
            <button
              key={type}
              onClick={() => setTypeFilter(active ? null : type)}
              className="flex-shrink-0 px-4 py-1.5 rounded-[999px] text-[13px] font-medium border-2 transition-colors capitalize"
              style={{
                borderColor: active ? color : '#E8E8E8',
                backgroundColor: active ? color + '22' : 'transparent',
                color: active ? color : '#666666',
              }}
            >{type}</button>
          )
        })}
      </div>

      {/* Results */}
      {showRecent && allMoments.length > 0 && (
        <p className="text-[12px] font-medium text-[#AAAAAA] uppercase tracking-wide mb-3">Recent</p>
      )}

      {results.length === 0 && !showRecent && (
        <div className="flex flex-col items-center py-20 text-center">
          <p className="text-[32px] mb-3">&#128269;</p>
          <p className="text-[15px] text-[#666666] dark:text-[#999999]">Nothing found — try different words</p>
        </div>
      )}

      {results.length === 0 && showRecent && (
        <div className="flex flex-col items-center py-20 text-center">
          <p className="text-[32px] mb-3">&#128269;</p>
          <p className="text-[15px] text-[#666666] dark:text-[#999999]">Capture a moment to search it later</p>
        </div>
      )}

      <div className="space-y-3">
        {results.map((m, i) => (
          <ResultCard key={i} moment={m} query={query} />
        ))}
      </div>
    </div>
  )
}
