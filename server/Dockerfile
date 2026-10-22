# Use official Node.js runtime (Debian slim includes glibc and compatibility with Prisma)
FROM node:20-slim

# Install OpenSSL for Prisma engine
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies and generate Prisma Client
RUN npm install --omit=dev
RUN npx prisma generate

# Copy application source code
COPY . .

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

CMD ["node", "src/index.js"]
