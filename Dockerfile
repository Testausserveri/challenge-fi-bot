FROM node:16.13.2-alpine
WORKDIR /usr/src/node
COPY . .
RUN npm install
CMD ["npm", "start"]