import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from '../store/store'
import AnimatedPage from '../components/AnimatedPage'
import { SEARCH_MIN_CHARS } from '../constants'

// Search types available on this page (same set as the navbar dropdown)
const SEARCH_TYPES = [
    { id: 'media', label: 'Media' },
    { id: 'tags',  label: 'Tags'  },
    { id: 'lists', label: 'Lists' },
] as const

type SearchType = 'media' | 'tags' | 'lists'

export default function AdvancedSearchPage() {
    const navigate = useNavigate()
    const { roleLevel } = useSelector((state: RootState) => state.auth)

    const [query, setQuery] = useState('')
    const [searchType, setSearchType] = useState<SearchType>('media')
    const [scope, setScope] = useState<'all' | 'mine'>('all')

    // Role check: admins and moderators get access to the extra filter section
    const isModerator = roleLevel === 'Moderator' || roleLevel === 'Administrator'

    const handleSubmit = () => {
        if (query.length < SEARCH_MIN_CHARS) return
        const params = new URLSearchParams({
            q: encodeURIComponent(query),
            type: searchType,
            scope,
            page: '1',
        })
        navigate(`/search?${params}`)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSubmit()
    }

    return (
        <AnimatedPage>
        <div className="page max-w-xl">

            {/* Back link */}
            <Link to="/search" className="text-sm text-text/50 hover:text-text transition-colors mb-4 inline-block">
                ← Back to search
            </Link>

            <h1 className="h1-styling">Advanced Search</h1>

            {/* Query input */}
            <div className="relative mt-4">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text/50 pointer-events-none text-sm select-none">🔍</span>
                <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search…"
                    className="form-input pl-9 pr-4 py-2 w-full text-sm rounded-lg"
                    autoFocus
                />
            </div>

            {/* Search type selector */}
            <div className="mt-4">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Type</p>
                <div className="flex flex-wrap gap-2">
                    {SEARCH_TYPES.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setSearchType(t.id)}
                            className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                                searchType === t.id
                                    ? 'bg-primary text-white border-primary'
                                    : 'border-border text-text/70 hover:border-primary/60 hover:text-text'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Scope selector — hidden for Media (external API has no "mine" concept) */}
            {searchType !== 'media' && (
                <div className="mt-4">
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Scope</p>
                    <div className="flex gap-2">
                        {(['all', 'mine'] as const).map(s => (
                            <button
                                key={s}
                                onClick={() => setScope(s)}
                                className={`px-3 py-1 rounded-full border text-sm transition-colors capitalize ${
                                    scope === s
                                        ? 'bg-primary text-white border-primary'
                                        : 'border-border text-text/70 hover:border-primary/60 hover:text-text'
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Admin / Moderator only section — hidden from Basic users */}
            {isModerator && (
                <div className="mt-6 rounded-xl border border-border p-4 bg-surface">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs bg-amber-500 text-white px-1.5 py-0.5 rounded font-semibold">
                            {roleLevel === 'Administrator' ? 'ADMIN' : 'MOD'}
                        </span>
                        <p className="text-sm font-semibold text-text">Moderation Filters</p>
                    </div>
                    {/* Placeholder for future admin/moderator-only filter options */}
                    <p className="text-sm text-text/50">
                        Additional filters for moderators and administrators will appear here.
                    </p>
                </div>
            )}

            {/* Submit button */}
            <button
                onClick={handleSubmit}
                disabled={query.length < SEARCH_MIN_CHARS}
                className="btn btn-primary mt-6 w-full py-2 disabled:opacity-40"
            >
                Search
            </button>

        </div>
        </AnimatedPage>
    )
}
