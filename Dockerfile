# Dockerfile for deploying PayRolleey backend from root
FROM node:20-slim

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy server package and prisma
COPY server/package*.json ./
COPY server/prisma ./prisma/

# Install dependencies and generate Prisma Client
RUN npm install --omit=dev
RUN npx prisma generate

# Copy server source code
COPY server/ .

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

CMD ["node", "src/index.js"]
