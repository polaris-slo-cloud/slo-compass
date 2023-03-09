FROM alpine:3.17.2
RUN apk --no-cache add curl

COPY ./generator.sh /app/generator.sh

WORKDIR /app
ENTRYPOINT ["sh", "generator.sh"]