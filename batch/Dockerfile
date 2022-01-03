FROM node:16-alpine3.12

ARG AWS_ACCESS_KEY_ID
ARG AWS_SECRET_ACCESS_KEY
ARG AWS_DEFAULT_REGION
ARG BUCKET
ARG KEY_PREFIX
ARG DATABASE_URL

RUN apk update && apk add aria2 ffmpeg python3 py3-pip \
    && pip3 install --upgrade pip \
    && pip3 install awscli \
    && rm -rf /var/cache/apk/* \
    && npm install -g ts-node

COPY batch/package.json /package.json
COPY batch/yarn.lock /yarn.lock

RUN yarn

COPY db/prisma/schema.prisma /schema.prisma
COPY batch/script.ts /script.ts

RUN yarn prisma generate --schema=/schema.prisma

RUN mkdir /downloads
WORKDIR /workdir

ENV AWS_ACCESS_KEY_ID $AWS_ACCESS_KEY_ID
ENV AWS_SECRET_ACCESS_KEY $AWS_SECRET_ACCESS_KEY
ENV AWS_DEFAULT_REGION $AWS_DEFAULT_REGION
ENV BUCKET $BUCKET
ENV KEY_PREFIX $KEY_PREFIX
ENV DATABASE_URL $DATABASE_URL

#ENTRYPOINT ["ts-node", "/script.ts"]