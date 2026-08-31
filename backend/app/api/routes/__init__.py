from fastapi import APIRouter

from app.api.routes.health import router as health_router
from app.api.routes.protocol import router as protocol_router
from app.api.routes.endpoint import router as endpoint_router
from app.api.routes.human import router as human_router
from app.api.routes.post_purchase import router as post_purchase_router
from app.api.routes.websocket import router as ws_router

router = APIRouter()
router.include_router(health_router, tags=["health"])
router.include_router(protocol_router)
router.include_router(endpoint_router)
router.include_router(human_router)
router.include_router(post_purchase_router)

# WebSocket router is mounted at root (not under /api prefix)
ws_router_export = ws_router
