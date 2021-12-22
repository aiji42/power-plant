#!/bin/bash

wget -P /watch $TARGET_URL

while [ ! -f /downloads/complete/completed ]
do
  sleep 10
done

echo "COMPLETED!!"
