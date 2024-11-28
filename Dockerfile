# ---- deps ----
FROM groupclaes/npm AS depedencies
WORKDIR /usr/src/app

COPY package.json ./package.json
COPY .npmrc ./.npmrc

RUN npm install --omit=dev --ignore-scripts

# ---- build ----
FROM depedencies AS build
COPY index.ts ./index.ts
COPY src/ ./src

RUN npm install --ignore-scripts && npm run build

# ---- final ----
FROM groupclaes/node:latest
# add lib form pdf and image manipulation
USER root
RUN apk add --no-cache file imagemagick

USER node
WORKDIR /usr/src/app

COPY --chown=node:node --from=depedencies /usr/src/app ./
COPY --chown=node:node --from=build /usr/src/app/index.min.js ./

CMD ["node","index.min.js"]