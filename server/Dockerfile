FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Prisma reads DATABASE_URL while loading its config, but client generation does not connect.
RUN DATABASE_URL=postgresql://hostin:hostin@localhost:5432/hostin npx prisma generate

FROM base AS development
EXPOSE 5001
CMD ["sh", "./docker-entrypoint.sh"]

FROM base AS build
RUN npm run build
RUN npm prune --omit=dev

FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/generated ./generated
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
EXPOSE 5001
CMD ["npm", "start"]
