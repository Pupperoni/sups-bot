# base image
FROM node:18

# set working directory inside container
WORKDIR /app

# install npm deps
COPY package*.json ./
RUN npm install

# copy source code
COPY . .

# expose port so we can access app
EXPOSE 3000

# start server
CMD ["npm", "start"]