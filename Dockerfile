#
# alpine node.js runtime Dockerfile
#

FROM node:9.11.2-slim

# Set instructions on build.
# RUN apk add --update make gcc g++ python git bash
RUN apt-get update && apt-get install -y \
  git \
  python \
  make \
  gcc \
  g++ \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ADD . /app
RUN npm install --production

# RUN apk del make gcc g++ python git && rm -rf /tmp/* /var/cache/apk/* /root/.npm /root/.node-gyp
ENV NODE_ENV production

EXPOSE 8080

CMD ["npm", "run", "serve"]
