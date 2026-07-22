import { avatarDataUri } from '../lib/profile/avatars'
import { glyphFor } from '../lib/profile/formatters'

// Contenuto di un avatar, da inserire dentro le bolle esistenti
// (.avatar-bubble, .msg-avatar, .search-ava, .dm-avatar…). Se il preset è un
// avatar DiceBear mostra l'SVG; altrimenti ricade sul glifo (emoji legacy o
// iniziale del nickname), preservando lo sfondo colorato della bolla.
export function Avatar({
  preset,
  nickname,
}: {
  preset: string | null
  nickname: string
}) {
  const uri = avatarDataUri(preset)
  if (uri) {
    return <img src={uri} alt="" className="avatar-img" draggable={false} />
  }
  return <>{glyphFor(preset, nickname)}</>
}
