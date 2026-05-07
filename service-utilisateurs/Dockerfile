FROM node:20-alpine

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY src/ ./src/

USER appuser

EXPOSE 3002

CMD ["node", "src/app.js"]
