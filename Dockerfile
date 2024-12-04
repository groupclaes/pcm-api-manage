# ---- deps ----
FROM groupclaes/esbuild:v0.24.0 AS deps
WORKDIR /usr/src/app

COPY package.json ./package.json
COPY .npmrc ./.npmrc

RUN npm install --omit=dev --ignore-scripts

# ---- build ----
FROM deps AS build
COPY index.ts ./index.ts
COPY src/ ./src

RUN npm install --ignore-scripts && npm run build

# ---- final ----
FROM groupclaes/node:20
# add lib form pdf and image manipulation
USER root
RUN apk add --no-cache file imagemagick

USER node
WORKDIR /usr/src/app

# removed --chown=node:node
COPY --from=deps /usr/src/app ./
COPY --from=build /usr/src/app/index.min.js ./

CMD ["node","index.min.js"]