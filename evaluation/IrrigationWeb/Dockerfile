# build stage
FROM node:lts-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# production stage
FROM python:3.8-alpine
WORKDIR /app
COPY ./requirements.txt /app/requirements.txt
RUN pip install -r requirements.txt

COPY http-server.py /app
COPY --from=build-stage /app/dist /app/http

EXPOSE 80
ENTRYPOINT [ "python" ]
CMD ["http-server.py"]