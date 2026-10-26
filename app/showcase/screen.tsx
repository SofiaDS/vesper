// Vetrina per gli screenshot di installazione (manifest `screenshots`).
// Monta i componenti VERI dell'app (header, tab bar, avatar, composer,
// reazioni) con dati finti: nessun login, nessuna chiamata a Supabase.
// Le parti che nell'app dipendono da hook di rete (elenco stanze, badge
// online) sono ricopiate con le stesse classi CSS dei componenti originali.
// Uso: /showcase/screen.html?s=rooms|foyer|dm  (solo dev, non entra nella build)
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { House, ChatCircleDots, MagnifyingGlass, User, DotsThreeOutline } from '@phosphor-icons/react'
import '../src/index.css'
import { AppHeader } from '../src/components/AppHeader'
import { TabBar, type TabBarItem } from '../src/components/TabBar'
import { Avatar } from '../src/components/Avatar'
import { MessageComposer } from '../src/components/MessageComposer'
import { MessageReactions } from '../src/components/MessageReactions'
import { HeaderMenu } from '../src/components/HeaderMenu'
import type { MessageReaction } from '../src/lib/reactions'

const noop = () => {}
const ME = 'me'

function tabs(active: string): TabBarItem[] {
  return [
    { key: 'stanze', label: 'Stanze', icon: <House size={22} weight="duotone" />, onClick: noop, active: active === 'stanze' },
    { key: 'dm', label: 'DM', icon: <ChatCircleDots size={22} weight="duotone" />, onClick: noop, active: active === 'dm', badge: 2 },
    { key: 'ricerca', label: 'Ricerca', icon: <MagnifyingGlass size={22} weight="duotone" />, onClick: noop, active: false },
    { key: 'profilo', label: 'Profilo', icon: <User size={22} weight="duotone" />, onClick: noop, active: false },
    { key: 'altro', label: 'Altro', icon: <DotsThreeOutline size={22} weight="duotone" />, onClick: noop, active: false },
  ]
}

// ── Stanze ───────────────────────────────────────────────────────────────
const ROOMS = [
  { name: 'Foyer', desc: 'La chat principale: saluti, presentazioni, discussione libera.', online: 128, unread: 12, mention: true, joined: true },
  { name: 'Cult', desc: "Letteratura, cinema, musica e altre forme d'arte.", online: 41, unread: 3, joined: true },
  { name: "L'amaro giardino di Lesbo", desc: 'Storie, dinamiche di coppia e confronti aperti sulle relazioni.', online: 36, joined: true },
  { name: 'Wander', desc: 'Viaggi, gite ed eventi da vivere insieme.', online: 22, joined: false },
  { name: 'Pulse', desc: 'Fitness, sport e vita in movimento.', online: 17, joined: false },
]

function RoomsShot() {
  return (
    <>
      <main className="app rooms">
        <AppHeader title="Vesper" />
        <ul className="room-list">
          {ROOMS.map((r) => (
            <li key={r.name} className={r.mention ? 'room-card has-mention' : r.unread ? 'room-card has-unread' : 'room-card'}>
              <button type="button" className="room-main">
                <span className="room-name-row">
                  <span className={r.unread ? 'room-name unread' : 'room-name'}>{r.name}</span>
                  {r.mention && <span className="mention-pill" aria-hidden="true">@</span>}
                  {!!r.unread && <span className="unread-pill" aria-hidden="true">{r.unread}</span>}
                </span>
                <span className="room-desc">{r.desc}</span>
                <span className="room-online">{r.online} online</span>
              </button>
              <div className="room-action">
                <button type="button" className="btn-primary btn-sm">{r.joined ? 'Apri' : 'Unisciti'}</button>
              </div>
            </li>
          ))}
        </ul>
        <p className="hint hint-active rooms-hint">Stanze tematiche: 2/3.</p>
      </main>
      <TabBar items={tabs('stanze')} />
    </>
  )
}

// ── Chat (Foyer e DM) ────────────────────────────────────────────────────
interface Msg { id: number; from: string; nick: string; avatar?: string; body: string; time: string; reactions?: MessageReaction[] }

function react(id: number, emoji: string, n: number, mine = false): MessageReaction[] {
  const out: MessageReaction[] = Array.from({ length: n }, (_, i) => ({ message_id: id, user_id: `u${i}`, emoji }))
  if (mine) out[0] = { message_id: id, user_id: ME, emoji }
  return out
}

const FOYER: Msg[] = [
  { id: 1, from: 'a', nick: 'marz_', avatar: 'dicebear:planets:caldo:marz', body: 'Qualcuna stasera per il cineforum queer? 🌙', time: '20:41', reactions: react(1, '🙋‍♀️', 4) },
  { id: 2, from: 'b', nick: 'soledad', avatar: 'dicebear:constellation:oro:soledad', body: 'Ci sono! Avete già scelto il film?', time: '20:43' },
  { id: 3, from: ME, nick: 'tu', body: 'Io proporrei qualcosa di Céline Sciamma 💛', time: '20:44', reactions: react(3, '💛', 3, true) },
  { id: 4, from: 'c', nick: 'vale.k', avatar: 'dicebear:planets:elettrico:valek', body: 'Sì sì, Petite Maman per me', time: '20:46' },
  { id: 5, from: ME, nick: 'tu', body: 'Perfetto, apro una discussione in Cult', time: '20:47' },
]

const DM: Msg[] = [
  { id: 11, from: 'g', nick: 'giulia.m', body: 'Ho visto che anche tu sei nel gruppo lettura ✨', time: '18:02' },
  { id: 12, from: ME, nick: 'tu', body: 'Sì! Sto finendo proprio ora «Le assaggiatrici»', time: '18:05' },
  { id: 13, from: 'g', nick: 'giulia.m', body: 'Una delle mie preferite 😍 ne parliamo davanti a un caffè?', time: '18:07', reactions: react(13, '☕', 1, true) },
  { id: 14, from: ME, nick: 'tu', body: 'Volentieri 💛 sabato sei libera?', time: '18:09' },
  { id: 15, from: 'g', nick: 'giulia.m', body: 'Perfetto, fammi sapere il posto', time: '18:10' },
]

function Messages({ msgs, avatars }: { msgs: Msg[]; avatars: boolean }) {
  return (
    <section className="messages">
      {msgs.map((m, i) => {
        const mine = m.from === ME
        return (
          <div key={m.id} className="msg-group">
            {i === 0 && (
              <div className="day-divider" role="separator"><span>Oggi</span></div>
            )}
            <div className={mine ? 'msg-row msg-row-mine' : 'msg-row'}>
              {avatars && !mine && (
                <button type="button" className="msg-avatar-btn">
                  <span className="msg-avatar"><Avatar preset={m.avatar ?? null} nickname={m.nick} /></span>
                </button>
              )}
              <div className="msg-col">
                {avatars && !mine && <button type="button" className="msg-author">{m.nick}</button>}
                <div className={mine ? 'msg msg-mine' : 'msg'}>
                  <span className="msg-body">{m.body}</span>
                </div>
                <div className="msg-meta">
                  <MessageReactions reactions={m.reactions ?? []} myId={ME} onToggle={noop} />
                  <span className="msg-footer">
                    <span className="msg-time">{m.time}</span>
                    <button type="button" className="msg-reply" aria-label="Rispondi citando">↩</button>
                    {avatars && !mine && <button type="button" className="msg-report" aria-label="Segnala messaggio">⚑</button>}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </section>
  )
}

function FoyerShot() {
  return (
    <main className="chat chat-focus">
      <AppHeader
        onBack={noop}
        title="Foyer"
        extra={
          <div className="roster-wrap">
            <button type="button" className="link roster-toggle">128 online</button>
          </div>
        }
      />
      <Messages msgs={FOYER} avatars />
      <MessageComposer value="" onChange={noop} onSubmit={(e) => e.preventDefault()} sending={false} />
    </main>
  )
}

function DmShot() {
  return (
    <main className="chat chat-focus">
      <AppHeader
        onBack={noop}
        title={
          <span className="dm-title">
            <button type="button" className="link" style={{ margin: 0, fontSize: '1.1rem', textDecoration: 'none' }}>
              @giulia.m
            </button>
            <span className="dm-title-online">
              <span className="presence-dot presence-dot-inline" aria-hidden="true" />
              online
            </span>
          </span>
        }
        action={<HeaderMenu label="Opzioni conversazione" items={[{ key: 'r', label: 'Segnala', onClick: noop }]} />}
      />
      <Messages msgs={DM} avatars={false} />
      <MessageComposer value="" onChange={noop} onSubmit={(e) => e.preventDefault()} sending={false} />
    </main>
  )
}

const which = new URLSearchParams(location.search).get('s') ?? 'rooms'
const Shot = which === 'dm' ? DmShot : which === 'foyer' ? FoyerShot : RoomsShot

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Shot />
  </StrictMode>,
)
