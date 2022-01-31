resource "aws_iam_role" "ecsInstanceRole" {
  assume_role_policy = jsonencode(
    {
      Statement = [
        {
          Action = "sts:AssumeRole"
          Effect = "Allow"
          Principal = {
            Service = "ec2.amazonaws.com"
          }
          Sid = ""
        }
      ]
      Version = "2008-10-17"
    }
  )
  name = "ecsInstanceRole"
  tags = {}
}

resource "aws_iam_instance_profile" "ecsInstanceRole" {
  role = aws_iam_role.ecsInstanceRole.name
}