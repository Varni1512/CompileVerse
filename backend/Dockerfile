# Use an official Node.js runtime as a parent image.
# Using 'slim' is a good practice for smaller image sizes.
FROM node:20-slim

# Install all necessary compilers and runtimes in one layer.
# build-essential: Installs gcc (for C) and g++ (for C++).
# openjdk-17-jdk: Installs the Java Development Kit (JDK).
# python3: Installs the Python 3 runtime.
RUN apt-get update && apt-get install -y build-essential openjdk-17-jdk python3 && \
    # Clean up the apt cache to keep the image size down
    rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker's layer caching.
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the rest of your application's source code into the container
COPY . .

# Make the app port available to the world outside this container
EXPOSE 8000

# Define the command to run your app
CMD ["node", "index.js"]