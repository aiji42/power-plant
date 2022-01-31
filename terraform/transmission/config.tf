terraform {
  backend "s3" {
    bucket = "power-plant-terraform"
    key    = "global/s3/transmission/terraform.tfstate"
    region = "ap-northeast-1"
  }
}