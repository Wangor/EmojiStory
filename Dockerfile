# Use Node.js LTS image with Debian for glibc compatibility
FROM node:20-bullseye

# Install ffmpeg so fluent-ffmpeg can execute it
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install --production || true

# Copy application including fonts
COPY . .

CMD ["npm", "start"]
