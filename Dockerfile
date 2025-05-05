# Gunakan image node
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Salin package files terlebih dahulu
COPY package*.json ./

# Salin folder prisma dulu, supaya prisma bisa generate
COPY prisma ./prisma

# Install dependensi (termasuk prisma generate)
RUN npm install

# Salin seluruh project setelah install
COPY . .

# Build project
RUN npm run build

# Buka port 3000
EXPOSE 3000

# Jalankan server
CMD ["npm", "start"]
