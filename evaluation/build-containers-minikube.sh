#!/bin/bash
cd "$(dirname "$0")"

BLUE_BOLD='\033[1;34m'
NO_COLOR='\033[0m'

cd polaris-components
printf "${BLUE_BOLD}Building Cost Efficiency Metric Controller...${NO_COLOR}\n"
docker build -f ./apps/cost-efficiency/Dockerfile --build-arg POLARIS_APP_TYPE=slo --build-arg POLARIS_APP_NAME=cost-efficiency -t localhost:5000/cost-efficiency:latest .
docker push localhost:5000/cost-efficiency:latest

printf "${BLUE_BOLD}Building Cost Efficiency SLO Controller...${NO_COLOR}\n"
docker build -f ./apps/cost-efficiency-slo-controller/Dockerfile --build-arg POLARIS_APP_TYPE=slo --build-arg POLARIS_APP_NAME=cost-efficiency-slo-controller -t localhost:5000/cost-efficiency-slo-controller:latest .
docker push localhost:5000/cost-efficiency-slo-controller:latest

cd ../simple-load-generator
printf "${BLUE_BOLD}Building Simple Load Generator...${NO_COLOR}\n"
docker build . -t localhost:5000/smart-irrigation-simple-load-generator:latest
docker push localhost:5000/smart-irrigation-simple-load-generator:latest

cd ../ApiGateway
printf "${BLUE_BOLD}Building Api Gateway...${NO_COLOR}\n"
dotnet publish --os linux --arch x64 -p:PublishProfile=DefaultContainer -c Release --self-contained true
docker tag smart-irrigation-api-gateway:1.0.0 localhost:5000/smart-irrigation-api-gateway:latest
docker push localhost:5000/smart-irrigation-api-gateway:latest

cd ../IrrigationService
printf "${BLUE_BOLD}Building Irrigation Service...${NO_COLOR}\n"
dotnet publish --os linux --arch x64 -p:PublishProfile=DefaultContainer -c Release --self-contained true -p:PublishSingleFile=true
docker tag smart-irrigation-service:1.0.0 localhost:5000/smart-irrigation-service:latest
docker push localhost:5000/smart-irrigation-service:latest

cd ../WeatherMonitoringService
printf "${BLUE_BOLD}Building Weather Monitoring Service...${NO_COLOR}\n"
dotnet publish --os linux --arch x64 -p:PublishProfile=DefaultContainer -c Release --self-contained true -p:PublishSingleFile=true
docker tag smart-irrigation-weather-monitoring:1.0.0 localhost:5000/smart-irrigation-weather-monitoring:latest
docker push localhost:5000/smart-irrigation-weather-monitoring:latest

cd ../IrrigationWeb
printf "${BLUE_BOLD}Building Irrigation Web...${NO_COLOR}\n"
docker build . -t localhost:5000/smart-irrigation-web:latest
docker push localhost:5000/smart-irrigation-web:latest

cd ../prediction-service
printf "${BLUE_BOLD}Building Weather Prediciton Service...${NO_COLOR}\n"
docker build . -t localhost:5000/smart-irrigation-weather-prediction:latest
docker push localhost:5000/smart-irrigation-weather-prediction:latest
