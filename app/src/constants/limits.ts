// Limiti allineati ai CHECK constraint del DB e a profilo_utente.md.
export const BIO_MAX = 300
export const PRONOUNS_MAX = 40
export const MAX_INTERESTS = 4

// Slug della chatroom globale a cui si fa auto-join dopo l'onboarding.
export const FOYER_SLUG = 'foyer'

// Numero massimo di stanze tematiche a cui un utente può unirsi
// (enforced anche dal trigger DB enforce_membership_cap).
export const MAX_TEMATICHE = 3

export const INTEREST_CATEGORIES = [
  {
    label: 'Tecnologia & Gaming',
    options: ['videogiochi', 'programmazione', 'hardware', 'intelligenza artificiale'],
  },
  {
    label: 'Tempo Libero & Natura',
    options: ['escursionismo', 'viaggi', 'giardinaggio', 'animali'],
  },
  {
    label: 'Cultura & Spettacolo',
    options: ['cinema', 'serie tv', 'musica', 'arte'],
  },
  {
    label: 'Sport & Benessere',
    options: ['yoga', 'palestra', 'ciclismo', 'meditazione'],
  },
  {
    label: 'Gastronomia',
    options: ['cucina locale', 'cucina etnica', 'sperimentazione culinaria', 'aperitivi'],
  },
  {
    label: 'Stile di Vita',
    options: ['volontariato', 'minimalismo', 'sostenibilità', 'fai-da-te'],
  },
]

export const INTEREST_SUGGESTIONS: string[] = INTEREST_CATEGORIES.flatMap(
  (c) => c.options,
)
