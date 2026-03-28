type Props = {
    page: number
    totalPages?: number
    hasNextPage: boolean
    hasPreviousPage: boolean
    onPageChange: (newPage: number) => void
}

export default function PaginationControls({ page, totalPages, hasNextPage, hasPreviousPage, onPageChange }: Props) {
    if (!hasNextPage && !hasPreviousPage) return null

    return (
        // a11y: role="navigation" + aria-label creates a named landmark so screen reader users can find pagination easily
        <nav role="navigation" aria-label="Pagination" className="flex items-center gap-3 mt-4">
            <button
                className="btn btn-secondary text-sm py-1 px-3 disabled:opacity-40"
                disabled={!hasPreviousPage}
                onClick={() => onPageChange(page - 1)}
                // a11y: aria-label gives the button a meaningful name for screen readers instead of just "← Prev"
                aria-label={`Go to page ${page - 1}`}
            >
                ← Prev
            </button>
            {/* a11y: aria-live="polite" + aria-atomic="true" announce the new page number to screen readers after navigation */}
            <span aria-live="polite" aria-atomic="true" className="text-sm text-text/60">
                {totalPages != null ? `Page ${page} of ${totalPages}` : `Page ${page}`}
            </span>
            <button
                className="btn btn-secondary text-sm py-1 px-3 disabled:opacity-40"
                disabled={!hasNextPage}
                onClick={() => onPageChange(page + 1)}
                // a11y: aria-label gives the button a meaningful name for screen readers instead of just "Next →"
                aria-label={`Go to page ${page + 1}`}
            >
                Next →
            </button>
        </nav>
    )
}
