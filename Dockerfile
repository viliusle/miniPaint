# Stage 1 - the build process
FROM node:12 as build-deps

WORKDIR /usr/src/app

COPY package.json /usr/src/app
COPY package-lock.json /usr/src/app
RUN npm install

COPY . /usr/src/app
RUN npm run build

# Stage 2 - the production environment
FROM nginx:1-alpine

COPY --from=build-deps /usr/src/app/dist /usr/share/nginx/html/dist
COPY --from=build-deps /usr/src/app/index.html /usr/share/nginx/html
COPY --from=build-deps /usr/src/app/images /usr/share/nginx/html/images

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
