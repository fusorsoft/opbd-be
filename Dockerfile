FROM node:carbon

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --production

COPY src/ ./

EXPOSE 8080
CMD [ "npm", "start" ]