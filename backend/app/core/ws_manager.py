"""WebSocket connection manager — broadcast events to subscribed clients."""
import json
from typing import Any
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self._connections: dict[str, WebSocket] = {}

    async def connect(self, client_id: str, websocket: WebSocket):
        await websocket.accept()
        self._connections[client_id] = websocket

    def disconnect(self, client_id: str, websocket: "WebSocket | None" = None):
        # Guard against StrictMode double-mount race: only remove the entry
        # if the disconnecting socket is still the one currently registered.
        if websocket is None or self._connections.get(client_id) is websocket:
            self._connections.pop(client_id, None)

    async def send(self, client_id: str, data: dict[str, Any]):
        ws = self._connections.get(client_id)
        if ws:
            await ws.send_text(json.dumps(data))

    async def broadcast(self, data: dict[str, Any]):
        dead = []
        for cid, ws in self._connections.items():
            try:
                await ws.send_text(json.dumps(data))
            except Exception:
                dead.append(cid)
        for cid in dead:
            self.disconnect(cid)


manager = ConnectionManager()
