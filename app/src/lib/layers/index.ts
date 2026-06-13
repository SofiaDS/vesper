import { supabase } from '../supabase'
import type { Layer, LayerPermissions } from './types'
import { LAYER_PERMISSIONS } from './types'

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
  missingHours: number
  missingMessages: number
  reputationOk: boolean
}

// Usa la RPC check_my_layer_eligibility (security definer): replica esattamente
// la logica server-side di promote_my_layer, incluso il check di reputazione
// (che il client non può leggere direttamente per via della RLS).
export async function checkLayerEligibility(): Promise<LayerEligibility | null> {
  const { data, error } = await supabase.rpc('check_my_layer_eligibility')
  if (error) throw error
  return data as LayerEligibility | null
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
