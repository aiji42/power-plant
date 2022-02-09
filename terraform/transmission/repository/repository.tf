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

resource "aws_ecr_lifecycle_policy" "expire-policy" {
  repository = aws_ecr_repository.power-plant-transmission.name

  policy = jsonencode({
    "rules": [
      {
        "rulePriority": 1,
        "description": "Keep last 2 images",
        "selection": {
          "tagStatus": "any",
          "countType": "imageCountMoreThan",
          "countNumber": 2
        },
        "action": {
          "type": "expire"
        }
      }
    ]
  })
}