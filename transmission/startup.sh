#!/bin/bash

wget -P /watch $@

while [ ! -f /downloads/complete/completed ]
do
  sleep 10
done

echo "COMPLETED!!"
