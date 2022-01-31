terraform {
  backend "s3" {
    bucket = "power-plant-terraform"
    key    = "global/s3/terraform.tfstate"
    region = "ap-northeast-1"
  }
}