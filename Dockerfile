FROM node:22.14-alpine

WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./
COPY src ./src

RUN npm install

ENV NODE_ENV=production

# Build TypeScript
RUN npm run build

ENTRYPOINT ["node", "build/index.js"]