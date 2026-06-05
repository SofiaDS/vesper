// Strati di permessi progressivi (vedi permessi_e_strati.md).

export type Layer = 1 | 2 | 3

export interface LayerRequirements {
  minDays: number
  minMessages: number
  maxGraveReports: number
}

// Soglie provvisorie: da calibrare dopo 3 mesi dal lancio (punti_aperti.md §3).
export const LAYER_REQUIREMENTS: Record<2 | 3, LayerRequirements> = {
  2: { minDays: 7, minMessages: 20, maxGraveReports: 0 },
  3: { minDays: 30, minMessages: 100, maxGraveReports: 0 },
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
