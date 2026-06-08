import type { RoomMember } from '../lib/chat'

const MENTION_RE = /@([a-zA-Z0-9_]{3,24})/g

// Visualizza il testo di un messaggio evidenziando le "@nickname" che
// corrispondono a una persona nella stanza, rendendole cliccabili (aprono il
// suo profilo). Le altre "@parole" restano testo semplice.
export function MentionText({
  body,
  members,
  onOpenProfile,
}: {
  body: string
  members: RoomMember[]
  onOpenProfile: (userId: string) => void
}) {
  if (members.length === 0) return <>{body}</>

  const byNickname = new Map(members.map((m) => [m.nickname.toLowerCase(), m]))
  const parts: React.ReactNode[] = []
  let last = 0
  let match: RegExpExecArray | null
  MENTION_RE.lastIndex = 0
  while ((match = MENTION_RE.exec(body))) {
    const member = byNickname.get(match[1].toLowerCase())
    if (!member) continue
    if (match.index > last) parts.push(body.slice(last, match.index))
    parts.push(
      <button
        key={`${match.index}-${member.id}`}
        type="button"
        className="mention"
        onClick={() => onOpenProfile(member.id)}
      >
        @{member.nickname}
      </button>,
    )
    last = match.index + match[0].length
  }
  if (last < body.length) parts.push(body.slice(last))
  return <>{parts}</>
}
