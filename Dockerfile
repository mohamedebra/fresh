FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npm rebuild bcrypt --build-from-source

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
