import { useState, useEffect, useRef } from 'react'
import { getAllMoments } from '../../lib/db/queries'
import { momentMatchesQuery, highlight } from '../../lib/utils'
import type { Moment, MomentType } from '../../types'
import { MOMENT_COLORS } from '../../types'
import { MomentCard } from '../../components/MomentCard/MomentCard'
import { SearchIcon } from '../../components/icons/Icons'

const ALL_TYPES: MomentType[] = [
  'photo','beautiful','idea','gratitude','anxiety','conversation',
  'reading','music','quote','workout','coffee','nicotine','place','insight',
]

function ResultCard({ moment, query }: { moment: Moment; query: string }) {
  const highlighted = moment.text ? highlight(moment.text, query) : undefined
  return <MomentCard moment={moment} dateFormat="date" highlightHtml={highlighted} />
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
    <div className="min-h-screen bg-base dark:bg-base-dark px-4 pt-14 pb-24 lg:px-10 lg:pt-16 lg:max-w-[1200px] lg:mx-auto">
      {/* Search input */}
      <div className="relative mb-4 lg:mb-6">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-hint dark:text-hint-dark">
          <SearchIcon size={17} color="currentColor" />
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search memories..."
          className="w-full pl-11 pr-4 py-3.5 rounded-card bg-surface dark:bg-surface-dark border border-hairline dark:border-hairline-dark text-ink dark:text-ink-dark text-[15px] outline-none focus:border-terracotta"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-hint dark:text-hint-dark text-[18px] leading-none"
          >&times;</button>
        )}
      </div>

      {/* Type filter chips (mobile: horizontal scroll) */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-5 no-scrollbar lg:hidden">
        <button
          onClick={() => setTypeFilter(null)}
          className="flex-shrink-0 px-4 py-1.5 rounded-pill text-[13px] font-medium border-2 transition-colors"
          style={{
            borderColor: !typeFilter ? 'var(--color-terracotta)' : 'var(--color-hairline)',
            backgroundColor: !typeFilter ? 'color-mix(in srgb, var(--color-terracotta) 8%, transparent)' : 'transparent',
            color: !typeFilter ? 'var(--color-terracotta)' : 'var(--color-muted)',
          }}
        >All</button>
        {ALL_TYPES.map(type => {
          const color = MOMENT_COLORS[type]
          const active = typeFilter === type
          return (
            <button
              key={type}
              onClick={() => setTypeFilter(active ? null : type)}
              className="flex-shrink-0 px-4 py-1.5 rounded-pill text-[13px] font-medium border-2 transition-colors capitalize"
              style={{
                borderColor: active ? color : 'var(--color-hairline)',
                backgroundColor: active ? `color-mix(in srgb, ${color} 13%, transparent)` : 'transparent',
                color: active ? color : 'var(--color-muted)',
              }}
            >{type}</button>
          )
        })}
      </div>

      <div className="lg:grid lg:grid-cols-[200px_1fr] lg:gap-8 lg:items-start">
        {/* Type filter (desktop: persistent left column) */}
        <div className="hidden lg:block lg:sticky lg:top-8">
          <p className="text-[12px] font-medium text-hint dark:text-hint-dark uppercase tracking-wide mb-3">Filter</p>
          <div className="space-y-0.5">
            <button
              onClick={() => setTypeFilter(null)}
              className="w-full text-left px-3 py-2 rounded-btn-sm text-[14px] font-medium transition-colors"
              style={{
                color: !typeFilter ? 'var(--color-terracotta)' : 'var(--color-muted)',
                backgroundColor: !typeFilter ? 'color-mix(in srgb, var(--color-terracotta) 8%, transparent)' : 'transparent',
              }}
            >All</button>
            {ALL_TYPES.map(type => {
              const color = MOMENT_COLORS[type]
              const active = typeFilter === type
              return (
                <button
                  key={type}
                  onClick={() => setTypeFilter(active ? null : type)}
                  className="w-full text-left px-3 py-2 rounded-btn-sm text-[14px] font-medium capitalize transition-colors"
                  style={{
                    color: active ? color : 'var(--color-muted)',
                    backgroundColor: active ? `color-mix(in srgb, ${color} 13%, transparent)` : 'transparent',
                  }}
                >{type}</button>
              )
            })}
          </div>
        </div>

        <div>
          {/* Results */}
          {showRecent && allMoments.length > 0 && (
            <p className="text-[12px] font-medium text-hint dark:text-hint-dark uppercase tracking-wide mb-3">Recent</p>
          )}

          {results.length === 0 && !showRecent && (
            <div className="flex flex-col items-center py-20 text-center">
              <SearchIcon size={30} color="var(--color-hint)" className="mb-3" />
              <p className="text-[15px] text-muted dark:text-muted-dark">Nothing found — try different words</p>
            </div>
          )}

          {results.length === 0 && showRecent && (
            <div className="flex flex-col items-center py-20 text-center">
              <SearchIcon size={30} color="var(--color-hint)" className="mb-3" />
              <p className="text-[15px] text-muted dark:text-muted-dark">Capture a moment to search it later</p>
            </div>
          )}

          <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-4 lg:items-start">
            {results.map((m, i) => (
              <ResultCard key={i} moment={m} query={query} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
