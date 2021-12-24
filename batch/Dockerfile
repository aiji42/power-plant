FROM node:16-alpine3.12

RUN apk update && apk add aria2
RUN npm install -g ts-node

COPY package.json /package.json
COPY yarn.lock /yarn.lock

RUN yarn

COPY script.ts /script.ts

RUN mkdir /downloads
WORKDIR /workdir

#ENTRYPOINT ["ts-node", "/script.ts"]