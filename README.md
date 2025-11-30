# Hurry Curry Backend 🍛

**Docs URL:** [http://localhost:3000/api](http://localhost:3000/api) (Swagger)

Hurry Curry is a high-performance backend for food truck ordering. It handles burst traffic from students using an asynchronous queue system, ensures atomic scheduling for cooking slots, and delivers real-time status updates via WebSockets.

---

## 🚀 Features

* **Asynchronous Ordering** — Uses **BullMQ (Redis)** to buffer high-concurrency order requests without blocking the main thread.
* **Atomic Scheduling** — Implements a singleton `TruckState` lock to serialize cooking times (FIFO) and prevent double-booking.
* **Real-time Notifications** — **Socket.IO** integration pushes `order_confirmed` and `order_ready` events directly to the client.
* **Secure Auth** — Robust **JWT** implementation with Access and Refresh tokens + Role-based access (Student/Admin).
* **Type-Safe DB** — **Prisma ORM** with **PostgreSQL** for reliable data integrity.
* **Containerized** — Fully Dockerized development and production environments.

---

## 📦 Setup Instructions

### With Docker Compose (Recommended)

```bash
# Clone the repo
git clone https://github.com/your-repo/hurry-curry-be.git
cd hurry-curry-be

# Start DB and Redis
docker compose up -d

# Apply Migrations
npx prisma migrate deploy

# Run the app
npm run start:dev
```

Environment variables required in `.env`:

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/hurry-curry
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_super_secret_access_key
JWT_REFRESH_SECRET=your_super_secret_refresh_key
PORT=3000
TIMEZONE=Asia/Seoul
```

### Manual Setup

```bash
git clone https://github.com/your-repo/hurry-curry-be.git
cd hurry-curry-be
npm ci
npx prisma migrate deploy
npm run start:dev
```

Ensure local PostgreSQL and Redis instances are running.

---

## 📖 API Endpoints

<details>
<summary>🔐 Auth Endpoints</summary>

<details>
<summary>Register — POST /auth/register</summary>

Payload:

```json
{
    "email": "student@gist.ac.kr",
    "password": "securePassword123",
    "name": "Azamat",
    "role": "STUDENT" // Optional, defaults to STUDENT
}
```
</details>

<details>
<summary>Login — POST /auth/login</summary>

Payload:

```json
{
    "email": "student@gist.ac.kr",
    "password": "securePassword123"
}
```

Response:

```json
{
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
}
```
</details>

<details>
<summary>Refresh Token — POST /auth/refresh</summary>

Headers: `Authorization: Bearer <RefreshToken>`

</details>

<details>
<summary>Logout — POST /auth/logout</summary>

Headers: `Authorization: Bearer <AccessToken>`

Payload:

```json
{
    "refreshToken": "..."
}
```
</details>
</details>

<details>
<summary>🍛 Order Endpoints (Student)</summary>

<details>
<summary>Place Order — POST /orders</summary>

Enqueues job to BullMQ. Returns immediately.

Payload:

```json
{
    "curryQuantity": 2,
    "naanQuantity": 1
}
```
</details>

<details>
<summary>My Processing Orders — GET /orders/processing</summary>

Returns active orders for the logged-in user.

</details>

<details>
<summary>My Completed Orders — GET /orders/completed</summary>

Returns order history for the logged-in user.

</details>
</details>

<details>
<summary>👨‍🍳 Admin Endpoints (Kitchen)</summary>

<details>
<summary>Mark Ready — PATCH /orders/:id/ready</summary>

Updates status to COMPLETED and emits WebSocket event.

</details>

<details>
<summary>Kitchen View — GET /orders/processing</summary>

When called by ADMIN, returns ALL processing orders sorted by pickup time.

</details>
</details>

---

## 🔄 Workflow Diagram

This diagram illustrates the Asynchronous Queue pattern and the WebSocket notification loop.

```mermaid
flowchart TD
    Client((Student)) -->|POST /orders| API[NestJS Controller]
    API -->|Add Job| Redis[(BullMQ / Redis)]
    API -.->|201 Accepted| Client
    
    Redis --> Worker[Orders Processor]
    
    subgraph "Atomic Worker Process"
    Worker -->|Lock TruckState| DB[(PostgreSQL)]
    Worker -->|Calc Pickup Time| Logic{FIFO Logic}
    Logic -->|Create Order| DB
    Worker -->|Update TruckState| DB
    end

    Worker -->|Emit: order_confirmed| WS[WebSocket Gateway]
    
    Admin((Chef)) -->|PATCH /ready| API
    API -->|Update Status| DB
    API -->|Emit: order_ready| WS

    WS -->|Push Event| Client
```

---

## 📊 ER Diagram

```mermaid
erDiagram
    User {
        UUID id PK
        String email
        String password
        String name
        Enum role "STUDENT|ADMIN"
        String refreshToken
    }

    Order {
        Int id PK
        UUID userId FK
        Enum status "PROCESSING|COMPLETED"
        Int curryQuantity
        Int naanQuantity
        DateTime pickupTime
        DateTime createdAt
    }

    TruckState {
        Int id PK
        DateTime endTime "Serialized Cooking End Time"
    }

    %% Relationships
    User ||--o{ Order : places
```

---

## 🔌 Real-Time Integration (Socket.IO)

Clients should connect to the WebSocket namespace to receive updates.

Connection:

```javascript
const socket = io("http://localhost:3000/orders", {
  auth: {
    token: "YOUR_ACCESS_JWT"
  }
});
```

Events:

- `order_confirmed`: Sent when the Worker successfully processes the queue job and schedules a pickup time.
- `order_ready`: Sent when the Admin marks the order as ready for pickup.
