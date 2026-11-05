# ===================================================
# Stage 1: Build Angular Application
# ===================================================
FROM node:22-alpine AS build

WORKDIR /app

# Copy dependency definition files
COPY package.json package-lock.json ./

# Install exact dependencies using lockfile
RUN npm ci

# Copy project source files
COPY . .

# Build Angular application for production
RUN npm run build -- --configuration production

# ===================================================
# Stage 2: Production Runtime with Nginx
# ===================================================
FROM nginx:alpine

# Default PORT fallback for local execution (Railway overrides this with $PORT)
ENV PORT=80

# Restrict envsubst to PORT so Nginx variables ($uri, $host, etc.) are preserved
ENV NGINX_ENVSUBST_FILTER="PORT"

# Clean default Nginx html content
RUN rm -rf /usr/share/nginx/html/*

# Copy built browser bundle from build stage
COPY --from=build /app/dist/company-file-hub/browser /usr/share/nginx/html

# Copy Nginx template for dynamic PORT substitution on container startup
COPY nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

