## Multi-stage build for frontend (Vite + React)
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies and build
COPY package.json package-lock.json* ./
RUN npm install --production=false --prefer-offline || npm install
COPY . .
RUN npm run build

## Production image: serve with nginx
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Copy a custom nginx config to enable SPA fallback (try_files)
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
