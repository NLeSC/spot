FROM node:alpine
LABEL maintainer="f.diblen@esciencecenter.nl"
ENV NPM_CONFIG_LOGLEVEL info

RUN apk update && \
    apk add git

RUN mkdir /app && cd /app
RUN git clone https://github.com/NLeSC/spot.git /app/spot
RUN cd /app/spot && npm install --silent

WORKDIR /app/spot

RUN npm run fonts && \
    npm run templates && \
    npm run build && \
    npm run dist

# application's default port
EXPOSE 9966

ENTRYPOINT npm run start

# docker build --tag spot-client --label spot-client .
# docker run -it --rm -p 9966:9966 --name spot-client-container spot-client