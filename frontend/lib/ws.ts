export type WsEvent = {
  event?: string
  event_type?: string
  vector_id?: string
  payload?: string
  payload_format?: string
  metadata?: Record<string, unknown>
  is_fraud?: boolean
  confidence?: number
  model_used?: string
  shap_values?: Record<string, number>
  latency_ms?: number
  explanation?: string
  epoch?: number
  evasion_rate?: number
  detection_rate?: number
  false_positive_rate?: number
  auc?: number
  new_samples?: number
  data?: unknown
}

export interface WsClient {
  send: (data: object) => void
  close: () => void
}

export function createWsClient(
  url: string,
  onMessage: (evt: WsEvent) => void,
  onOpen?: () => void,
  onClose?: () => void,
): WsClient {
  const ws = new WebSocket(url)

  ws.onopen = () => onOpen?.()
  ws.onclose = () => onClose?.()
  ws.onmessage = (e) => {
    try {
      onMessage(JSON.parse(e.data) as WsEvent)
    } catch {
      // ignore malformed frames
    }
  }

  return {
    send: (data) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data))
    },
    close: () => ws.close(),
  }
}
