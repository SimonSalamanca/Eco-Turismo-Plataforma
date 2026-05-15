FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm@9 && pnpm install 

COPY . .

RUN pnpm build || true

EXPOSE 3000

CMD ["sh", "-c", "node src/db/migrate.js && node server.js"]