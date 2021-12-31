FROM node:16.13.0-buster
WORKDIR /usr/src/node
COPY . .
RUN npm install
CMD ["npm", "start"]