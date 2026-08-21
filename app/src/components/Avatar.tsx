import { avatarDataUri } from '../lib/profile/avatars'
import { glyphFor } from '../lib/profile/formatters'

// Contenuto di un avatar, da inserire dentro le bolle esistenti
// (.avatar-bubble, .msg-avatar, .search-ava, .dm-avatar…). Se il preset è un
// avatar DiceBear mostra l'SVG; altrimenti ricade sul glifo (emoji legacy o
// iniziale del nickname), preservando lo sfondo colorato della bolla.
export function Avatar({
  preset,
  nickname,
  photoUrl,
}: {
  preset: string | null
  nickname: string
  // Foto di profilo già firmata, se disponibile: quando c'è batte l'avatar
  // generato, perché è la persona vera.
  photoUrl?: string | null
}) {
  if (photoUrl) {
    return <img src={photoUrl} alt="" className="avatar-img" draggable={false} />
  }
  const uri = avatarDataUri(preset)
  if (uri) {
    return <img src={uri} alt="" className="avatar-img" draggable={false} />
  }
  return <>{glyphFor(preset, nickname)}</>
}
