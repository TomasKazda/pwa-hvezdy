# Stage 1: Build client
FROM node:22-alpine AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json* ./
RUN npm install
COPY client/ .
RUN npm run build

# Stage 2: Build server
FROM node:22-alpine AS server-build
WORKDIR /app/server
COPY server/package.json server/package-lock.json* ./
RUN npm install
COPY server/ .
RUN npm run build

# Stage 3: Production
FROM node:22-alpine
WORKDIR /app

COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm install --omit=dev

COPY --from=server-build /app/server/dist ./server/dist
COPY --from=server-build /app/server/src/db/migrations ./server/dist/db/migrations
COPY --from=client-build /app/client/dist ./client/dist

EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "server/dist/index.js"]
