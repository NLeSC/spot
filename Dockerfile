# build stage
FROM node:lts-alpine as build-stage
LABEL maintainer="f.diblen@esciencecenter.nl"
ENV NPM_CONFIG_LOGLEVEL info

WORKDIR /app
#ENV DEBUG="*"
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
    nasm \
    libexecinfo-dev@edge \
    gcc \
    musl-dev \
    make \
    tiff \
    jpeg \
    zlib \
    zlib-dev \
    file \
    pkgconf

COPY package*.json ./
RUN npm install --silent
COPY . .
COPY .env.sample .env

RUN npm run build

# EXPOSE 80 443 8080 9966
# CMD ["npm", "run", "start"]


# production stage - nginx
FROM nginx:stable-alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

RUN mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.orig
COPY conf/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]