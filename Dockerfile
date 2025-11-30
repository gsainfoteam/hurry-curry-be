FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate

RUN npm run build


RUN npm prune --production


FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV production

RUN apk add --no-cache dumb-init

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma


USER node

EXPOSE 3000

CMD ["dumb-init", "sh", "-c", "npx prisma migrate deploy && node dist/main"]