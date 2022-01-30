#!/bin/sh

aws s3 mv /downloads/complete/ s3://${BUCKET}/downloads/complete/ --recursive