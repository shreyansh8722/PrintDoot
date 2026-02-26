# Use an official Node runtime as a parent image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
# Note: Admin usually runs on a different port if running simultaneously, e.g., 5174
EXPOSE 5174

# Start the application in development mode
# We pass --host to ensure it's accessible from outside the container
# We also enforce port 5174 so it doesn't conflict with frontend if it tries to grab 5173
CMD ["npm", "run", "dev", "--", "--host", "--port", "5174"]
