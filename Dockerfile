FROM node:alpine3.17
EXPOSE 8080/tcp
WORKDIR /app
COPY ./package* ./
RUN npm ci
COPY ./ ./
RUN npm run build
ENTRYPOINT [ "npm", "run" ]
CMD [ "server-prod" ]
# For development inside docker: -v ./:/app minipaint server