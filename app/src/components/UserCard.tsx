import { Avatar } from './Avatar'
import type { SearchResult } from '../lib/search'

export function UserCard({
  result,
  showAffinity,
  onOpen,
}: {
  result: SearchResult
  showAffinity: boolean
  onOpen: () => void
}) {
  const place = result.city || result.city_region
  return (
    <button type="button" className="search-card" onClick={onOpen}>
      <span
        className="search-ava"
        style={result.accent_color ? { background: result.accent_color } : undefined}
      >
        <Avatar preset={result.avatar_preset} nickname={result.nickname} />
      </span>
      <span className="search-meta">
        <span className="search-nick">
          @{result.nickname}
          {result.age != null && <span className="search-age"> · {result.age}</span>}
        </span>
        {place && <span className="search-place">{place}</span>}
        {result.common_interests.length > 0 && (
          <span className="search-tags">
            {result.common_interests.slice(0, 3).map((t) => (
              <span key={t} className="search-tag">
                {t}
              </span>
            ))}
          </span>
        )}
      </span>
      {showAffinity && result.match_count > 0 && (
        <span className="search-aff">
          {result.match_count} {result.match_count === 1 ? 'cosa' : 'cose'} in comune
        </span>
      )}
    </button>
  )
}
