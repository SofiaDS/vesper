import { useState } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { ProfilePreview } from './ProfilePreview'
import { ProfileEditor } from './ProfileEditor'

export function ProfileScreen({
  onBack,
}: {
  onBack: () => void
}) {
  const { profile, refreshProfile } = useAuth()
  const [mode, setMode] = useState<'view' | 'edit'>('view')

  if (!profile) return null

  if (mode === 'view') {
    return (
      <ProfilePreview
        profile={profile}
        onBack={onBack}
        onEdit={() => setMode('edit')}
      />
    )
  }
  return (
    <ProfileEditor
      profile={profile}
      onCancel={() => setMode('view')}
      onSaved={async () => {
        await refreshProfile()
        setMode('view')
      }}
    />
  )
}
