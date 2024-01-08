FROM node:lts-alpine3.18 as builder

COPY ./ /app/
WORKDIR /app

# ignore following env when chromium need to be installed by yarn
ENV NODE_CHROMIUM_SKIP_INSTALL=true

RUN yarn install
RUN yarn build:standalone

FROM node:lts-alpine3.18

# debian install dependencies of chromium, which installed by yarn
#RUN apt-get update && apt-get install -y libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2
# alpine install chromium by apk, 170 is the closest version with bound verison 98
RUN apk add --no-cache chromium=119.0.6045.105

WORKDIR /app/o23-n99
ENV NODE_ENV=production
# use following env when use the installed chromium by yarn
#ENV PUPPETEER_EXECUTABLE_PATH=/app/puppeteer/chrome/linux-115.0.5790.98/chrome-linux64/chrome
# use following env when use the install chromium by apk/agt-get/etc.
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# logger
ENV CFG_LOGGER_ERROR_FILE=/app/o23-n99/logs/error-%DATE%.log
ENV CFG_LOGGER_COMBINED_FILE=/app/o23-n99/logs/combined-%DATE%.log

# configuration database
ENV CFG_TYPEORM_O23_HOST=127.0.0.1
ENV CFG_TYPEORM_O23_USERNAME=o23
ENV CFG_TYPEORM_O23_PASSWORD=o23
ENV CFG_TYPEORM_O23_DATABASE=o23

ENV CFG_ENV_FILE=.env.common.basic,.env.prod.basic,.env.common.print,.env.prod.server

COPY --from=builder /app/o23-n99/.env.common.basic ./
COPY --from=builder /app/o23-n99/.env.prod.basic ./
COPY --from=builder /app/o23-n99/.env.common.print ./
COPY --from=builder /app/o23-n99/.env.prod.server ./
# copy other .env files

COPY --from=builder /app/o23-n99/db-scripts ./db-scripts
COPY --from=builder /app/o23-n99/server ./server
COPY --from=builder /app/o23-n99/scripts ./scripts
COPY --from=builder /app/o23-n99/dist ./dist

# if use chromium installed by puppeteer
#COPY --from=builder /app/.puppeteerrc ./.puppeteerrc
# run following cmd when use the installed chromium by yarn
#COPY --from=builder /app/puppeteer ./puppeteer

ENV HOST 0.0.0.0
# internal app port is 3100, in .env.common.basic
EXPOSE 3100

CMD ["node","dist/server"]
