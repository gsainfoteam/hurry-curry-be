# Hurry Curry Backend

NestJS + Prisma backend for ordering curry/naan from a food truck. Students place orders; admins mark them ready. Orders flow through BullMQ/Redis and notify clients via Socket.IO.

## Stack
- Runtime: Node.js, NestJS (REST + WebSockets)
- Queue: BullMQ on Redis
- DB: PostgreSQL via Prisma
- Auth: JWT (access + refresh), Passport
- Docs: Swagger (OpenAPI)
- Realtime: Socket.IO namespace `orders`

## Quick Start
1) Install deps: `npm ci`
2) Env: copy `.env.example` to `.env` and set `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `REDIS_HOST`, `REDIS_PORT`, `PORT`, `TIMEZONE`
3) DB: `npx prisma migrate deploy` (or `prisma db push` for dev)
4) Run dev: `npm run start:dev`  
   Run prod: `npm run build && npm run start:prod`
5) Swagger: `http://localhost:3000/api`
6) WebSocket connect: `io("http://localhost:3000/orders", { auth: { token: <access_jwt> } })`

## Environment Variables
- `DATABASE_URL=postgresql://user:pass@host:5432/hurry-curry`
- `JWT_SECRET=...` (15m access)
- `JWT_REFRESH_SECRET=...` (7d refresh)
- `REDIS_HOST=localhost`
- `REDIS_PORT=6379`
- `PORT=3000`
- `TIMEZONE=Asia/Seoul` (used for pickup time formatting)

## Architecture (text diagram)
REST (HTTP) ─┬─ AuthController (/auth)
             └─ OrdersController (/orders)
                  │
                  ├─ BullMQ Queue: `curry-queue`
                  │      └─ OrdersProcessor (validates job, writes DB, notifies WS)
                  │
                  └─ Prisma (PostgreSQL)
                         ├─ User (uuid, role, tokens)
                         ├─ Order (status PROCESSING/COMPLETED, pickupTime)
                         └─ TruckState (single row to serialize prep end-time)

WebSocket (Socket.IO, namespace `orders`)
- Auth via JWT on connection
- Rooms: `user-<uuid>`
- Events out: `order_confirmed`, `order_ready`

## Data Flow
1) Student `POST /orders` with quantities (JWT required; role STUDENT).
2) Controller enqueues `process-order` job.
3) Worker validates job, ensures user exists, calculates pickup ETA (FIFO via `TruckState`), creates order in DB.
4) Worker emits `order_confirmed` to `user-<uuid>` room with pickupTime.
5) Admin `PATCH /orders/:id/ready` sets status to COMPLETED and emits `order_ready`.
6) Queries:
   - Admin: `/orders/completed`, `/orders/processing`
   - Student: `/orders/:id/completed`, `/orders/:id/processing` (returns caller’s orders)

## Prisma Schema (summary)
- `User`: uuid, name, email (unique), password (hashed), studentId, role (STUDENT/ADMIN), refreshToken
- `Order`: id, userId → User, status, curryQuantity, naanQuantity, pickupTime, createdAt
- `TruckState`: singleton row with `endTime` to serialize cooking schedule

## Running with Docker Compose
- Services: `postgres:16-alpine` (5432), `redis:7-alpine` (6379)
- Start: `docker compose up -d`
- Set `DATABASE_URL` to point at the compose Postgres.

## Common Workflows
- **Register**: `POST /auth/register` → tokens
- **Login**: `POST /auth/login` → tokens
- **Refresh**: `POST /auth/refresh` with refresh token → new tokens
- **Logout**: `POST /auth/logout` (Authorization: Bearer access) + refreshToken in body
- **Create order (student)**: `POST /orders` with quantities
- **Mark ready (admin)**: `PATCH /orders/:id/ready`
- **Subscribe WS**: connect with access token; listen for `order_confirmed`/`order_ready`

## Diagrams (lightweight)
**Request/Queue/Worker**
Client → REST (/orders) → BullMQ job → OrdersProcessor → Prisma → WebSocket emit

**WebSocket Rooms**
User connects (JWT) → join `user-<uuid>` → server emits events to that room only.

## Conventions
- Queue names: `curry-queue`, job name `process-order`
- Roles: `STUDENT`, `ADMIN`
- Statuses: `PROCESSING`, `COMPLETED`
- Timezone formatting: `TIMEZONE` (default Asia/Seoul)
