// Strati di permessi progressivi (vedi permessi_e_strati.md).

export type Layer = 1 | 2 | 3

export interface LayerRequirements {
  minHours: number
  minMessages: number
}

// Soglie provvisorie: da calibrare dopo 3 mesi dal lancio (punti_aperti.md §3).
// Il requisito di reputazione (punteggio >= -1) è gestito server-side
// (RPC promote_my_layer / check_my_layer_eligibility) e decade nel tempo.
export const LAYER_REQUIREMENTS: Record<2 | 3, LayerRequirements> = {
  2: { minHours: 48, minMessages: 15 },
  3: { minHours: 30 * 24, minMessages: 100 },
}

// Permessi per strato: cosa si sblocca a ciascun livello.
export interface LayerPermissions {
  canSendDmRequest: boolean
  canSetDmFilter: boolean
  canVouchForOthers: boolean
  canApplyAsModerator: boolean
}

export const LAYER_PERMISSIONS: Record<Layer, LayerPermissions> = {
  1: {
    canSendDmRequest: false,
    canSetDmFilter: false,
    canVouchForOthers: false,
    canApplyAsModerator: false,
  },
  2: {
    canSendDmRequest: true,
    canSetDmFilter: true,
    canVouchForOthers: false,
    canApplyAsModerator: false,
  },
  3: {
    canSendDmRequest: true,
    canSetDmFilter: true,
    canVouchForOthers: true,
    canApplyAsModerator: true,
  },
}
