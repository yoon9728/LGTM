FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev && npm install tsx

COPY . .

EXPOSE 4300
ENV NODE_ENV=production
ENV PORT=4300

CMD ["npx", "tsx", "src/index.ts"]
