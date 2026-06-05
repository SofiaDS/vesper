// TODO: getUserLayer(userId) — legge il campo `strato` dal profilo
// TODO: checkLayerEligibility(userId) — verifica se l'utente soddisfa i requisiti per lo strato successivo
// TODO: promoteLayer(userId) — promuove l'utente allo strato successivo (chiamato da un job o trigger)
// TODO: getLayerPermissions(layer) — restituisce i permessi associati allo strato
// TODO: hasPermission(userId, permission) — shortcut per verificare un permesso specifico

export type { Layer, LayerRequirements, LayerPermissions } from './types'
export { LAYER_REQUIREMENTS, LAYER_PERMISSIONS } from './types'
