import { supabase } from '../supabase'
import type { Profile } from '../../types'

export async function loadProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) {
    console.error('Errore nel caricamento del profilo:', error.message)
    return null
  }
  return (data as Profile) ?? null
}

export async function loadRoles(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
  if (error) {
    console.error('Errore nel caricamento dei ruoli:', error.message)
    return []
  }
  return ((data as { role: string }[]) ?? []).map((r) => r.role)
}
