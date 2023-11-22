# FROM public.ecr.aws/bitnami/node:14.19.0-debian-10-r19
FROM public.ecr.aws/bitnami/node:16.20.2-debian-11-r48
RUN wget http://download.redis.io/redis-stable.tar.gz && \
    tar xvzf redis-stable.tar.gz && \
    cd redis-stable && \
    make && \
    mv src/redis-server /usr/bin/ && \
    cd .. && \
    rm -r redis-stable && \
    npm install -g concurrently 

EXPOSE 6379
WORKDIR /app
COPY package*.json /app/
RUN npm install --legacy-peer-deps
RUN npm install redis
COPY . /app
RUN npm run build
EXPOSE 3000
EXPOSE 6379
CMD concurrently "/usr/bin/redis-server --bind '0.0.0.0'" "sleep 5s; npm run start:dev"
# CMD npm run start:dev