FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install

COPY . .

# Set user to root temporarily
USER root

# Change permissions
# RUN chown -R 10014:10014 /app

# Switch back to non-root user
USER 10014


EXPOSE 5005

CMD ["node", "server.js"]
