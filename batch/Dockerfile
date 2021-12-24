FROM node:16-alpine3.12

ARG AWS_ACCESS_KEY_ID
ARG AWS_SECRET_ACCESS_KEY
ARG AWS_DEFAULT_REGION
ARG BUCKET
ARG KEY_PREFIX

RUN apk update && apk add aria2
RUN npm install -g ts-node

COPY package.json /package.json
COPY yarn.lock /yarn.lock

RUN yarn

COPY script.ts /script.ts

RUN mkdir /downloads
WORKDIR /workdir

ENV AWS_ACCESS_KEY_ID $AWS_ACCESS_KEY_ID
ENV AWS_SECRET_ACCESS_KEY $AWS_SECRET_ACCESS_KEY
ENV AWS_DEFAULT_REGION $AWS_DEFAULT_REGION
ENV BUCKET $BUCKET
ENV KEY_PREFIX $KEY_PREFIX

#ENTRYPOINT ["ts-node", "/script.ts"]