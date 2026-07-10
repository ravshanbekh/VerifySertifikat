# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# OpenSSL va sharp uchun kerakli kutubxonalar
RUN apk add --no-cache openssl libc6-compat vips-dev

COPY package*.json ./
RUN npm install
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app

# OpenSSL (Prisma uchun) va sharp (rasm generatsiya uchun) kerakli kutubxonalar
RUN apk add --no-cache openssl libc6-compat vips fontconfig

COPY package*.json ./
RUN npm ci --only=production
COPY prisma ./prisma
RUN npx prisma generate
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/assets ./assets

# System fonts config for librsvg/sharp
RUN mkdir -p /usr/share/fonts/truetype/custom && \
    cp /app/assets/fonts/*.ttf /usr/share/fonts/truetype/custom/ && \
    fc-cache -f

EXPOSE 4000
CMD ["node", "dist/app.js"]
