#
# alpine node.js runtime Dockerfile
#

FROM mhart/alpine-node:8.9

# Set instructions on build.
RUN apk add --update make gcc g++ python git

WORKDIR /app
ADD . /app
RUN npm install --production

RUN apk del make gcc g++ python git && rm -rf /tmp/* /var/cache/apk/* /root/.npm /root/.node-gyp
ENV NODE_ENV production

EXPOSE 8080

CMD ["npm", "run", "serve"]
