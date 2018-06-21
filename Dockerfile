#
# alpine node.js runtime Dockerfile
#

FROM node:10-alpine

# Set instructions on build.
RUN apk add --update make gcc g++ python git

WORKDIR /app
ADD . /app
RUN npm install --production

RUN apk del make gcc g++ python git && rm -rf /tmp/* /var/cache/apk/* /root/.npm /root/.node-gyp
ENV NODE_ENV production

EXPOSE 8080

CMD ["npm", "run", "serve"]
