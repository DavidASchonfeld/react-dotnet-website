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
        <div className="flex items-center gap-3 mt-4">
            <button
                className="btn btn-secondary text-sm py-1 px-3 disabled:opacity-40"
                disabled={!hasPreviousPage}
                onClick={() => onPageChange(page - 1)}
            >
                ← Prev
            </button>
            <span className="text-sm text-text/60">
                {totalPages != null ? `Page ${page} of ${totalPages}` : `Page ${page}`}
            </span>
            <button
                className="btn btn-secondary text-sm py-1 px-3 disabled:opacity-40"
                disabled={!hasNextPage}
                onClick={() => onPageChange(page + 1)}
            >
                Next →
            </button>
        </div>
    )
}
