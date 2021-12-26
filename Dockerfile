FROM node:16-alpine
WORKDIR /usr/src/node
COPY . .
RUN npm install
CMD ["npm", "start"]