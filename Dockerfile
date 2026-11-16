# 🐳 Production image — Render / Railway / any VPS-la deploy panna.
# Build:  docker build -t e-service .
# Run:    docker run -p 5000:5000 --env-file server/.env -v eservice-data:/app/server/data -v eservice-files:/app/server/storage e-service

FROM node:24-slim

# PDF create panna Chromium + fonts (Tamil-um serthu)
RUN apt-get update \
  && apt-get install -y --no-install-recommends chromium fonts-noto-core fonts-liberation ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    CHROME_PATH=/usr/bin/chromium \
    PORT=5000

WORKDIR /app

# Dependencies mothalla (cache-ku)
COPY server/package*.json server/
COPY client/package*.json client/
RUN npm ci --prefix server --omit=dev && npm ci --prefix client --include=dev

# Code
COPY shared shared
COPY server server
COPY client client

# React build → client/dist (server idha serve pannum)
RUN npm run build --prefix client && rm -rf client/node_modules

WORKDIR /app/server
USER node
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://localhost:'+(process.env.PORT||5000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "src/server.js"]
