# Build Stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Production Stage
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app ./

# Install only production dependencies
RUN npm prune --production

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "server.js"]
