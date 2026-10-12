FROM python:3.11-slim

# Prevent Python from writing .pyc files and buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install Node.js 20
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Verify installed versions
RUN node --version && npm --version && python --version

# Application directory
WORKDIR /app

# Copy backend package files first
COPY backend/package*.json ./backend/

# Install backend dependencies
WORKDIR /app/backend
RUN npm install --omit=dev

# Return to project root
WORKDIR /app

# Copy Python requirements
COPY requirements.txt ./requirements.txt

# Install Python/ML dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the complete FarmAI project
COPY . .

# Production environment
ENV NODE_ENV=production

# Start Express backend
CMD ["node", "backend/server.js"]