# Stage 1: Build the React app
FROM node:20 as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve the built app using 'serve'
FROM node:20-alpine
RUN npm install -g serve
COPY --from=build /app/dist /app
WORKDIR /app
EXPOSE 3111
CMD ["serve", "-s", ".", "-l", "3111"]
