FROM node:20-alpine AS build
WORKDIR /app
# rewrites() is evaluated at build time — the proxy target must be set here
ENV BACKEND_URL=http://backend:8000
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 3000
CMD ["npm", "start"]
