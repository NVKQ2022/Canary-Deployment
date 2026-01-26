# Use a lightweight Node.js image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package files and install dependencies first (caching layer)
COPY package*.json ./
RUN npm install

# Copy the Configuration File (CRITICAL STEP)
COPY config.json ./

# Copy the Source Code and Public Assets
COPY server.js .
COPY public ./public

# Expose the application port
EXPOSE 8080

# Start the application
CMD [ "node", "server.js" ]