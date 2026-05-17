# --- Stage 1: Build the Application Assets ---
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies using clean install
COPY package*.json ./
RUN npm ci

# Copy remaining source code and execute Webpack production compilation
COPY . .
RUN npm run build

# --- Stage 2: Microscopic Production Runtime Enclosure ---
FROM nginx:stable-alpine

# Remove default boilerplate server configs
RUN rm -rf /usr/share/nginx/html/*

# Safely extract strictly needed production distribution primitives
COPY --from=builder /app/index.html /usr/share/nginx/html/
COPY --from=builder /app/dist /usr/share/nginx/html/dist
COPY --from=builder /app/images /usr/share/nginx/html/images

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
