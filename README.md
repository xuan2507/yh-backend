# YH Studio Backend

Order management and AI concept generation system for YH Studio.

## Features

- **Order Reception API** — Accepts client briefs from the website
- **4 AI Agents** — Color, Typography, Layout, Mood agents analyze briefs and generate concepts
- **OpenAI Integration** — Optional GPT-4 enrichment for higher quality concepts
- **Admin Dashboard** — View orders, inspect AI logs, regenerate concepts, manual generation
- **Real-time Status** — Clients can check order status and view generated concepts

## AI Agents

| Agent | Function |
|-------|----------|
| **Color Agent** | Generates palettes using color psychology and brand theory |
| **Typography Agent** | Recommends font pairings based on brand personality |
| **Layout Agent** | Proposes grid systems and spatial organization |
| **Mood Agent** | Defines emotional atmosphere and art direction |

## Setup

```bash
npm install
```

Create `.env`:
```
OPENAI_API_KEY=your_key_here
PORT=3000
ADMIN_PASSWORD=yhstudio2026
```

## Run

```bash
npm start
```

Dashboard: http://localhost:3000  
API: http://localhost:3000/api

## API Endpoints

### Public
- `POST /api/orders` — Submit new order
- `GET /api/orders/:id` — Check order status

### Admin (requires Bearer token)
- `GET /api/admin/orders` — List all orders
- `GET /api/admin/orders/:id` — Order details
- `PATCH /api/admin/orders/:id` — Update order
- `POST /api/admin/orders/:id/regenerate` — Regenerate concepts
- `DELETE /api/admin/orders/:id` — Delete order
- `GET /api/admin/stats` — Dashboard stats
