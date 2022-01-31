resource "aws_ecr_repository" "power-plant-transmission" {
  name = "power-plant-transmission"
  tags = {}
  encryption_configuration {
    encryption_type = "AES256"
  }
  image_scanning_configuration {
    scan_on_push = false
  }
  timeouts {}
}