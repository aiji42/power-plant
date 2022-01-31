resource "aws_ecr_repository" "power-plant" {
  name = "power-plant"
  tags = {}
  encryption_configuration {
    encryption_type = "AES256"
  }
  image_scanning_configuration {
    scan_on_push = false
  }
  timeouts {}
}