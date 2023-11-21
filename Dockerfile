FROM public.ecr.aws/bitnami/node:14.19.0-debian-10-r19
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
