#!/bin/sh

IMAGE_NAME=998366166562.dkr.ecr.ap-northeast-1.amazonaws.com/power-plant-transmission

sudo yum install -y docker
sudo systemctl enable docker
sudo systemctl start docker

aws ecr get-login --no-include-email --region ap-northeast-1 | sudo sh
sudo docker run -d -p 9091:9091 -p 51413:51413 -p 51413:51413/udp $IMAGE_NAME