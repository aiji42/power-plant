FROM node:16.15-bullseye-slim as base

RUN apt-get update && apt-get install -y tini ca-certificates \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

FROM base as builder

COPY dataproxy/package.json .
COPY dataproxy/yarn.lock .
COPY remix/prisma/schema.prisma ./prisma/schema.prisma
COPY dataproxy/index.ts .

RUN yarn install

RUN yarn prisma generate
RUN yarn tsc index.ts --esModuleInterop

FROM base

ENV PORT=8080

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/index.js .

USER node

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "index.js"]