FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY frontend/package*.json ./frontend/

RUN cd frontend && npm ci

COPY . .

# NOTE: frontend/ needs its devDependencies (typescript, tailwindcss, etc.)
# to build, then they're pruned so the image only ships the runtime pieces
# server.js actually spawns ("npm run start" -> "next start").
RUN cd frontend && npm run build && npm prune --omit=dev

ENV NODE_ENV=production

EXPOSE 4444

USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4444/api/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["npm", "start"]
