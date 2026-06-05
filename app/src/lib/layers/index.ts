import { supabase } from '../supabase'
import type { Layer, LayerPermissions } from './types'
import { LAYER_PERMISSIONS, LAYER_REQUIREMENTS } from './types'

export type { Layer, LayerRequirements, LayerPermissions } from './types'
export { LAYER_REQUIREMENTS, LAYER_PERMISSIONS } from './types'

export async function getUserLayer(userId: string): Promise<Layer> {
  const { data } = await supabase
    .from('profiles')
    .select('strato')
    .eq('id', userId)
    .single()
  return (((data as { strato: number } | null)?.strato) ?? 1) as Layer
}

export interface LayerEligibility {
  currentLayer: Layer
  nextLayer: Layer | null
  eligible: boolean
  missingDays: number
  missingMessages: number
}

export async function checkLayerEligibility(userId: string): Promise<LayerEligibility | null> {
  const { data } = await supabase
    .from('profiles')
    .select('strato, created_at, message_count')
    .eq('id', userId)
    .single()

  if (!data) return null

  const p = data as { strato: number; created_at: string; message_count: number }
  const current = p.strato as Layer

  if (current >= 3) {
    return { currentLayer: 3, nextLayer: null, eligible: false, missingDays: 0, missingMessages: 0 }
  }

  const next = (current + 1) as Layer
  const req = LAYER_REQUIREMENTS[next]
  const daysSince = (Date.now() - new Date(p.created_at).getTime()) / 86_400_000
  const missingDays = Math.max(0, Math.ceil(req.minDays - daysSince))
  const missingMessages = Math.max(0, req.minMessages - p.message_count)

  return {
    currentLayer: current,
    nextLayer: next,
    eligible: missingDays === 0 && missingMessages === 0,
    missingDays,
    missingMessages,
  }
}

// Chiama l'RPC server-side che usa auth.uid(): sicuro, non accetta userId esterno.
// Restituisce il nuovo strato (o quello corrente se nessun avanzamento).
export async function promoteLayer(): Promise<Layer> {
  const { data, error } = await supabase.rpc('promote_my_layer')
  if (error) throw error
  return (data as number) as Layer
}

export function getLayerPermissions(layer: Layer): LayerPermissions {
  return LAYER_PERMISSIONS[layer]
}

export async function hasPermission(
  userId: string,
  permission: keyof LayerPermissions,
): Promise<boolean> {
  const layer = await getUserLayer(userId)
  return LAYER_PERMISSIONS[layer][permission]
}
