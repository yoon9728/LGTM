FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 4300
ENV NODE_ENV=production
ENV PORT=4300

USER node
CMD ["./node_modules/.bin/tsx", "src/index.ts"]
