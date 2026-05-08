FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN chmod -R 777 /app/node_modules/.cache 2>/dev/null || true

EXPOSE 3000

CMD ["npm", "start"]
