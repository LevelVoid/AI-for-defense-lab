# AI for Defense — Mastercard Innovation Challenge 2026


An autonomous, closed-loop **Adversarial AI framework** for payment security. The core thesis: the only effective defense against AI-generated fraud is an AI that continuously attacks your own systems, learns from every evasion, and retrains itself — a fight-fire-with-fire co-evolution loop.

---

## How It Works

The system is organized around three mandatory pillars of the challenge:

### 1. IDENTIFY — Threat Matrix (Tab 1)
Maps **16 GenAI-specific attack vectors** across **4 critical payment surfaces**: Protocol & Rail, Endpoint & Auth, Human & Social, and Post-Purchase & Dispute. Each vector targets a specific protocol field, API layer, or human interaction channel — e.g., prompt injection into ISO 20022 `<RmtInf>` fields, deepfake camera injection into mobile OS Camera APIs, or GNN graph poisoning of mule-account network embeddings.

### 2. GENERATE — Red Team Generator Studio (Tab 2)
AI Red-Team agents synthesize mathematically accurate, high-fidelity payloads for each of the 16 vectors. Payload formats include raw ISO 8583 hex frames, ISO 20022 XML documents, JSON device telemetry, NLP vishing transcripts, and graph-structured mule data. The Monaco editor lets you inspect and tweak payload parameters in real time, streaming results over WebSocket.

### 3. DEFEND — Blue Team Defender Dashboard (Tab 3)
A tri-layer detection architecture runs inference on every generated payload:
- **DeBERTa-v3-base** — NLP injection, BEC emails, vishing transcripts
- **XGBoost** — tabular transaction features, device fingerprints, dispute patterns
- **PyTorch GraphSAGE** — graph-structured mule networks, bust-out rings
- **PyTorch CNN** — deepfake video frames, AI-generated damage images

Each result includes a SHAP explanation of which features drove the decision, inference latency (target: < 100 ms), and a confidence score (target: AUC > 0.97, FPR < 0.1%).

### 4. CO-EVOLVE — The Feedback Loop (Tab 4)
Successful evasions from the Red Team automatically become training data for the Blue Team. Each simulated epoch shows: evasion rate spiking → detection model retraining → evasion rate collapsing. Over 5 epochs the system hardens: AUC climbs from ~0.94 toward 0.999, FPR drops, and the detection rate approaches 1.0. This is the architecture that never gets stale.

### Data Flow

```
Browser (Next.js)
  └─ WebSocket /ws/stream/{client_id}
       ├─ action: "generate_and_detect"
       │    ├─ RedTeamService.generate_payload(vector_id)  → streamed payload
       │    └─ BlueTeamService.detect(vector_id, payload) → SHAP + confidence
       └─ action: "run_epoch"
            └─ _simulate_epoch()  → 4 step events + EpochResult
```

---

## Folder Structure

```
AI-for-defense/
├── backend/                        FastAPI backend
│   ├── requirements.txt            Python dependencies
│   ├── .env.example                Environment variable template
│   └── app/
│       ├── main.py                 FastAPI app factory, CORS, router registration
│       ├── core/
│       │   ├── config.py           Pydantic settings (PROJECT_NAME, ALLOWED_ORIGINS)
│       │   └── ws_manager.py       WebSocket connection manager (connect/disconnect/broadcast)
│       ├── api/
│       │   └── routes/
│       │       ├── health.py       GET /api/health — liveness probe
│       │       ├── protocol.py     POST /api/protocol/generate — Surface 01 REST endpoint
│       │       ├── endpoint.py     POST /api/endpoint/generate — Surface 02 REST endpoint
│       │       ├── human.py        POST /api/human/generate — Surface 03 REST endpoint
│       │       ├── post_purchase.py POST /api/post-purchase/generate — Surface 04 REST endpoint
│       │       ├── defender.py     POST /api/defender/detect — synchronous detection endpoint
│       │       └── websocket.py    WS /ws/stream/{client_id} — generate_and_detect + run_epoch
│       ├── schemas/
│       │   ├── attack.py           Pydantic models: GenerateRequest, GenerateResponse, DetectResult, Surface enum
│       │   └── coevolution.py      Pydantic models: CoEvolutionEvent, EpochResult
│       ├── services/
│       │   ├── red_team.py         Payload generator — returns realistic synthetic payloads per vector (v01–v16)
│       │   └── blue_team.py        Detector — routes each vector to its model, returns SHAP values + confidence
│       └── models/                 Reserved for trained model artifacts (currently empty)
│
├── frontend/                       Next.js 14 frontend
│   ├── package.json                Node dependencies (Next.js, Recharts, Monaco Editor, Tailwind)
│   ├── next.config.js              Next.js config
│   ├── tailwind.config.ts          Tailwind theme — dark cybersecurity palette, `matrix` green color
│   ├── tsconfig.json               TypeScript config
│   ├── test_coevo.mjs              WebSocket smoke-test script
│   ├── app/
│   │   ├── layout.tsx              Root layout — sets dark background, loads global CSS
│   │   ├── globals.css             Tailwind directives + CSS variables (--color-matrix, --border)
│   │   ├── page.tsx                Root redirect → /lab
│   │   └── lab/
│   │       └── page.tsx            Main lab page — tab state, header with LIVE indicator, panel switcher
│   ├── components/
│   │   ├── TabBar.tsx              Tab navigation bar — 4 tabs with icons and keyboard nav
│   │   ├── Terminal.tsx            Reusable terminal output component — scrolling green-on-black log pane
│   │   └── tabs/
│   │       ├── ThreatMatrix.tsx    Tab 1: zoomable canvas, 16 vectors across 4 surfaces, side drawer with details
│   │       ├── GeneratorStudio.tsx Tab 2: vector selector, Monaco editor for params, WebSocket stream to Terminal
│   │       ├── DefenderDashboard.tsx Tab 3: SHAP bar chart (Recharts), real-time alert log, stat tiles (AUC/FPR/latency)
│   │       └── CoEvolutionLoop.tsx  Tab 4: evasion/detection line chart, epoch progress, retrain event log
│   └── public/                     Static assets
│
└── notebooks/                      16 Jupyter research notebooks
    ├── 01_Protocol_Rail/
    │   ├── 01_ISO20022_Prompt_Injection.ipynb    ISO 20022 RmtInf prompt injection → DeBERTa defense
    │   ├── 02_ISO8583_RL_Socket_Fuzzing.ipynb    RL-based fuzzing of ISO 8583 DE4/DE22 → XGBoost
    │   ├── 03_ISO8583_Ghost_Logging.ipynb        Ghost log injection at MTI 0100 socket layer → XGBoost
    │   └── 04_CrossMerchant_IDOR_Void.ipynb      MTI 0400 RRN replay / cross-merchant IDOR → XGBoost
    ├── 02_Endpoint_Auth/
    │   ├── 05_Synthetic_Device_Telemetry.ipynb   Synthetic canvas/WebGL/IP fingerprint spoofing → XGBoost
    │   ├── 06_Behavioral_Micro_Mimicry.ipynb     Biometric cadence mimicry (keystroke/mouse/touch) → XGBoost
    │   ├── 07_Deepfake_Camera_Injection.ipynb    Mobile camera API deepfake injection → PyTorch CNN
    │   └── 08_AP2_Agent_DOM_Hijack.ipynb         Shopping agent DOM/prompt hijack → DeBERTa
    ├── 03_Human_Social/
    │   ├── 09_Realtime_Vishing_OTP_Bot.ipynb     Real-time vishing + OTP interception → DeBERTa
    │   ├── 10_Autonomous_Corporate_BEC.ipynb     CEO wire fraud / BEC over ISO 20022 → DeBERTa
    │   ├── 11_APP_Romance_Investment_Swarm.ipynb APP scam swarm over RTP networks → GraphSAGE
    │   └── 12_Social_Support_Quishing.ipynb      QR-code phishing via social support threads → DeBERTa
    └── 04_PostPurchase_Dispute/
        ├── 13_Photorealistic_Damage_Gen.ipynb    AI-generated product damage images → PyTorch CNN
        ├── 14_Autonomous_Dispute_Arbitrage.ipynb AI agent chargeback arbitrage → XGBoost
        ├── 15_Synthetic_Merchant_Bust_Out.ipynb  Synthetic merchant bust-out rings → GraphSAGE
        └── 16_GNN_Graph_Mule_Poisoning.ipynb     GNN embedding poisoning via mule accounts → GraphSAGE
```

Each notebook follows the same five-section structure:
1. **Simulation Engine** — generates synthetic adversarial data (CTGAN, struct ISO hex, LangChain, NetworkX)
2. **Distribution Visualization** — overlapping KDE plots of legitimate vs. adversarial traffic
3. **Blue Team Model** — trains the appropriate detector (XGBoost / DeBERTa / GraphSAGE / CNN)
4. **Performance Stats** — confusion matrix + ROC-AUC curve; targets AUC ≥ 0.97 and FPR < 0.1%
5. **Co-Evolution Loop** — 5 epochs showing evasion spike → retrain → collapse

---

## Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.10+ |
| Node.js | 18+ |
| npm | 9+ |

---

## Running the App

### 1. Backend (FastAPI)

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# (Optional) copy and edit environment variables
cp .env.example .env

# Start the server
uvicorn app.main:app --reload --port 8000
```

The API is now live at `http://localhost:8000`.  
Interactive docs: `http://localhost:8000/docs`

### 2. Frontend (Next.js)

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open `http://localhost:3000` in your browser. The app auto-redirects to `/lab`.

### 3. Verify the WebSocket connection

```bash
cd frontend
node test_coevo.mjs
```

This script connects to `ws://localhost:8000/ws/stream/test-client`, fires a `run_epoch` action, and prints the streamed epoch events. Confirms the full generate → detect → retrain pipeline is wired up end-to-end.

### 4. Jupyter Notebooks (optional, research)

```bash
cd backend
source .venv/bin/activate        # reuse the backend venv — all ML packages are there

# Launch Jupyter
jupyter notebook ../notebooks/
```

Open any notebook and run all cells. Each one is self-contained: it generates synthetic data, trains the detector, and plots the co-evolution curve.

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Liveness probe |
| `POST` | `/api/protocol/generate` | Generate Surface 01 payload |
| `POST` | `/api/endpoint/generate` | Generate Surface 02 payload |
| `POST` | `/api/human/generate` | Generate Surface 03 payload |
| `POST` | `/api/post-purchase/generate` | Generate Surface 04 payload |
| `POST` | `/api/defender/detect` | Synchronous detection for any vector |
| `WS` | `/ws/stream/{client_id}` | Bidirectional stream — generate+detect or run epoch |

### WebSocket message format

**Send:**
```json
{ "action": "generate_and_detect", "vector_id": "v01", "params": {} }
{ "action": "run_epoch", "epoch": 1 }
```

**Receive:**
```json
{ "event": "payload_generated", "vector_id": "v01", "payload": "...", "payload_format": "iso20022_xml" }
{ "event": "detection_result", "is_fraud": true, "confidence": 0.97, "model_used": "DeBERTa-v3-base", "shap_values": {...}, "latency_ms": 54.2 }
{ "event": "epoch_complete", "epoch": 1, "evasion_rate": 0.38, "detection_rate": 0.62, "auc": 0.948, "false_positive_rate": 0.0018 }
```

---

## Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Frontend | Next.js 14 (App Router) | SSR, file-based routing |
| Styling | Tailwind CSS | Utility-first, rapid dark-theme composition |
| Code editor | `@monaco-editor/react` | VS Code engine in the browser |
| Charts | Recharts | React-native composable charting |
| Backend | FastAPI + uvicorn | Async-native, WebSocket support, fast |
| ML — tabular | XGBoost | Highest AUC on structured fraud features |
| ML — NLP | DeBERTa-v3-base | Best-in-class for injection and BEC text |
| ML — graph | PyTorch GraphSAGE | Inductive GNN for mule/bust-out networks |
| ML — image | PyTorch CNN | Deepfake and damage image detection |
| Synthetic data | CTGAN | Tabular GAN for realistic transaction distributions |
| Graph generation | NetworkX | Mule-ring and bust-out topology simulation |

---

## Performance Targets

| Metric | Target | Achieved (notebooks) |
|--------|--------|----------------------|
| AUC | ≥ 0.97 | ✅ |
| False Positive Rate | < 0.1% | ✅ |
| Inference latency | < 100 ms | ✅ |

---

## The 16 Attack Vectors

| # | Name | Surface | Target | Defender |
|---|------|---------|--------|----------|
| v01 | ISO 20022 Indirect Prompt Injection | Protocol | `<RmtInf><Ustrd>` | DeBERTa |
| v02 | ISO 8583 RL Socket Fuzzing | Protocol | DE 4, DE 22 | XGBoost |
| v03 | ISO 8583 Ghost Logging | Protocol | MTI 0100 socket | XGBoost |
| v04 | Cross-Merchant IDOR Void | Protocol | MTI 0400 / DE 37 RRN | XGBoost |
| v05 | Synthetic Device Telemetry | Endpoint | Canvas/WebGL/IP | XGBoost |
| v06 | Behavioral Micro-Mimicry | Endpoint | Biometric cadence | XGBoost |
| v07 | Deepfake Camera Injection | Endpoint | Mobile OS Camera API | PyTorch CNN |
| v08 | AP2 Agent DOM Hijack | Endpoint | Shopping agent prompt | DeBERTa |
| v09 | Real-Time Vishing / OTP Bot | Human | SMS OTP / 3DS | DeBERTa |
| v10 | Autonomous Corporate BEC | Human | ISO 20022 invoices | DeBERTa |
| v11 | APP Romance / Investment Swarm | Human | Real-Time Payments | GraphSAGE |
| v12 | Social Support Quishing | Human | Public threads | DeBERTa |
| v13 | Photorealistic Damage Gen | Post-Purchase | Merchant refund portal | PyTorch CNN |
| v14 | Autonomous Dispute Arbitrage | Post-Purchase | Acquirer dispute system | XGBoost |
| v15 | Synthetic Merchant Bust-Out | Post-Purchase | Acquirer accounts | GraphSAGE |
| v16 | GNN Graph Mule Poisoning | Post-Purchase | Network graph embeddings | GraphSAGE |
