FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy root package.json and install frontend dependencies
COPY package*.json ./
RUN npm install

# Copy server package.json and install backend dependencies
COPY server/package*.json ./server/
RUN cd server && npm install

# Copy all source files
COPY . .

# Build the Vite React frontend
RUN npm run build

# Set production mode so Express serves the built frontend
ENV NODE_ENV=production

# Expose the API port
EXPOSE 5000

# Start the Express server
CMD ["node", "server/index.js"]
