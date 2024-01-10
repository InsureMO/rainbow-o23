FROM node:18 as BUILD
ADD ./ /app/
WORKDIR /app
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN yarn install && yarn build:standalone

FROM node:18
WORKDIR /app/o23-n99
ENV NODE_ENV=production

#COPY --from=BUILD /app/puppeteer ./puppeteer
#ENV PUPPETEER_EXECUTABLE_PATH=/app/puppeteer/chrome/linux-115.0.5790.98/chrome-linux64/chrome
ENV CFG_LOGGER_ERROR_FILE=/app/o23-n99/logs/error-%DATE%.log
ENV CFG_LOGGER_COMBINED_FILE=/app/o23-n99/logs/combined-%DATE%.log
ENV CFG_TYPEORM_O23_HOST=host.docker.internal
ENV CFG_TYPEORM_O23_USERNAME=o23
ENV CFG_TYPEORM_O23_PASSWORD=o23
ENV CFG_TYPEORM_O23_DATABASE=o23
ENV CFG_ENV_FILE=envs/common/.basic,envs/dev/.mysql.basic,envs/common/.print,envs/dev/.server
COPY --from=BUILD /app/envs/ ./envs/
COPY --from=BUILD /app/db-scripts/ ./db-scripts/
COPY --from=BUILD /app/server/ ./server/
COPY --from=BUILD /app/scripts/ ./scripts/
COPY --from=BUILD /app/dist/ ./dist/

EXPOSE 3100

CMD ["node","dist/server"]
