import type { ReactNode } from 'react'

// Riga etichetta/valore per le card informative del profilo — markup "pf-row"
// già esistente, prima duplicato identico in ProfilePreview e PublicProfileScreen.
export function ProfileRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="pf-row">
      <span className="pf-label">{label}</span>
      <span className="pf-value">{children}</span>
    </div>
  )
}
