# ────────────────────────────────────────────────────
# Stage: development  →  hot-reload con Vite
# ────────────────────────────────────────────────────
FROM node:24-alpine AS dev

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]

# ────────────────────────────────────────────────────
# Stage: builder  →  compila el bundle optimizado
# ────────────────────────────────────────────────────
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ────────────────────────────────────────────────────
# Stage: production  →  sirve la build con nginx
# ────────────────────────────────────────────────────
FROM nginx:stable-alpine AS prod

COPY --from=builder /app/dist /usr/share/nginx/html

# Configuración mínima de nginx para SPA (react-router)
RUN printf 'server {\n\
  listen 80;\n\
  root /usr/share/nginx/html;\n\
  index index.html;\n\
  location / {\n\
    try_files $uri $uri/ /index.html;\n\
  }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
