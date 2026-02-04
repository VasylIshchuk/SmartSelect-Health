# syntax=docker/dockerfile:1

# Lightweight base image Node (Alpine is lighter (Linux) than full but has the necessary libraries)
FROM node:20-alpine


# Working Directory
WORKDIR /frontend


# Copying dependency definitions
COPY package*.json yarn.lock ./

# Dependency installation
RUN yarn install --frozen-lockfile


# Disabling Next.js telemetry (speeds up startup and reduces log noise)
ENV NEXT_TELEMETRY_DISABLED=1


# Uploading the application to Docker
COPY . .


# Port Documentation
EXPOSE 3000

# Running
CMD ["yarn", "dev", "-H", "0.0.0.0"]