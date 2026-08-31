// Stub — fully implemented in M4
export type WsEvent = {
  type: 'generate' | 'defend' | 'coevolution'
  vector: string
  payload?: unknown
  score?: number
  shap?: Record<string, number>
  epoch?: number
  evasion_rate?: number
  auc?: number
  fpr?: number
}

export function createWsClient(_url: string): null {
  return null
}
