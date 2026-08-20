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

# Declare build args — Render passes matching env vars as Docker build args
ARG VITE_GROQ_API_KEY
ARG VITE_TAVILY_API_KEY

# Make them available as env vars during build so Vite can bake them in
ENV VITE_GROQ_API_KEY=$VITE_GROQ_API_KEY
ENV VITE_TAVILY_API_KEY=$VITE_TAVILY_API_KEY

# Build the Vite React frontend
RUN npm run build

# Set production mode so Express serves the built frontend
ENV NODE_ENV=production

# Expose the API port
EXPOSE 5000

# Start the Express server
CMD ["node", "server/index.js"]
