#
# alpine node.js runtime Dockerfile
#

FROM mhart/alpine-node:8.9

ENV NODE_ENV=development

CMD ["./initialize.sh"]