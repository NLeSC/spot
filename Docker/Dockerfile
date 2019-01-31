# build stage
FROM node:11-alpine
WORKDIR /app
ENV DEBUG="*"
RUN apk update && apk upgrade && \
    apk --no-cache add curl && \
    apk --no-cache add --update \
    nodejs nodejs-npm nano
COPY ../package*.json ./
RUN npm install
COPY .. .
RUN npm run build

# production stage
FROM nginx:stable-alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
