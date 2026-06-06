export function SkeletonCard() {
  return (
    <div className="search-card skeleton">
      <span className="search-ava skeleton-ava" />
      <span className="search-meta">
        <span className="search-nick skeleton-text" />
        <span className="search-place skeleton-text" style={{ width: '60%' }} />
      </span>
    </div>
  )
}
