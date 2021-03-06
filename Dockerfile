# For development
# Use directory binding instead of copy
FROM node:12-alpine

WORKDIR /usr/AuthServer
COPY package.json .
RUN npm install
COPY . .
EXPOSE 5000
CMD [ "npm", "run", "dev" ]