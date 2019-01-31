# build stage
FROM node:11-alpine as build-stage
WORKDIR /app
ENV DEBUG="*"
RUN echo "@edge http://nl.alpinelinux.org/alpine/edge/main" >> /etc/apk/repositories
RUN apk update && apk upgrade && \
    apk --no-cache add curl && \
    apk --no-cache add --update \
    nodejs nodejs-npm \
    nano \
    git \
    build-base \
    libtool \
    autoconf \
    automake \
    jq \
    zlib \
    nasm \
    libexecinfo-dev@edge
COPY ./package*.json ./
RUN npm install
COPY . .
RUN npm run build

# production stage
FROM nginx:stable-alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
