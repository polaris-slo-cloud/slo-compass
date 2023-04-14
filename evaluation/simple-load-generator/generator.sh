#!/bin/sh
while true
do
  curl http://api-gateway/api/weather/current
  curl http://api-gateway/api/irrigation/recommendation
  curl http://irrigation-web
  sleep 10
done
