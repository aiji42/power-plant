resource "aws_vpc" "default" {
  cidr_block = "172.31.0.0/16"
}

resource "aws_subnet" "subnet1" {
  cidr_block              = "172.31.32.0/20"
  map_public_ip_on_launch = true
  vpc_id                  = aws_vpc.default.id
}

resource "aws_subnet" "subnet2" {
  cidr_block              = "172.31.16.0/20"
  map_public_ip_on_launch = true
  vpc_id                  = aws_vpc.default.id
}

resource "aws_subnet" "subnet3" {
  cidr_block              = "172.31.0.0/20"
  map_public_ip_on_launch = true
  vpc_id                  = aws_vpc.default.id
}

resource "aws_security_group" "default" {
  name        = "default"
  description = "default VPC security group"
  tags        = {}
  egress = [
    {
      cidr_blocks = [
        "0.0.0.0/0",
      ]
      description      = ""
      from_port        = 0
      ipv6_cidr_blocks = []
      prefix_list_ids  = []
      protocol         = "-1"
      security_groups  = []
      self             = false
      to_port          = 0
    }
  ]
  ingress = [
    {
      cidr_blocks      = []
      description      = ""
      from_port        = 0
      ipv6_cidr_blocks = []
      prefix_list_ids  = []
      protocol         = "-1"
      security_groups  = []
      self             = true
      to_port          = 0
    },
  ]
  timeouts {}
}

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

resource "aws_batch_compute_environment" "power-plant-A" {
  type = "MANAGED"
  compute_environment_name = "power-plant-A"
  compute_resources {
    allocation_strategy = "BEST_FIT"
    bid_percentage      = 0
    instance_role       = aws_iam_instance_profile.ecsInstanceRole.arn
    instance_type       = ["optimal"]
    max_vcpus           = 2
    min_vcpus           = 0
    security_group_ids  = [aws_security_group.default.id]
    subnets = [
      aws_subnet.subnet1.id,
      aws_subnet.subnet2.id,
      aws_subnet.subnet3.id
    ]
    type = "EC2"
  }
}

resource "aws_batch_compute_environment" "power-plant-B" {
  type = "MANAGED"
  compute_environment_name = "power-plant-B"
  compute_resources {
    allocation_strategy = "BEST_FIT"
    bid_percentage      = 0
    instance_role       = aws_iam_instance_profile.ecsInstanceRole.arn
    instance_type       = ["optimal"]
    max_vcpus           = 4
    min_vcpus           = 0
    security_group_ids  = [aws_security_group.default.id]
    subnets = [
      aws_subnet.subnet1.id,
      aws_subnet.subnet2.id,
      aws_subnet.subnet3.id
    ]
    type = "EC2"
  }
}

resource "aws_batch_compute_environment" "power-plant-C" {
  type = "MANAGED"
  compute_environment_name = "power-plant-C"
  compute_resources {
    allocation_strategy = "BEST_FIT"
    bid_percentage      = 0
    instance_role       = aws_iam_instance_profile.ecsInstanceRole.arn
    instance_type       = ["optimal"]
    max_vcpus           = 8
    min_vcpus           = 0
    security_group_ids  = [aws_security_group.default.id]
    subnets = [
      aws_subnet.subnet1.id,
      aws_subnet.subnet2.id,
      aws_subnet.subnet3.id
    ]
    type = "EC2"
  }
}

resource "aws_batch_compute_environment" "power-plant-D" {
  type = "MANAGED"
  compute_environment_name = "power-plant-D"
  compute_resources {
    allocation_strategy = "BEST_FIT"
    bid_percentage      = 0
    instance_role       = aws_iam_instance_profile.ecsInstanceRole.arn
    instance_type       = ["optimal"]
    max_vcpus           = 16
    min_vcpus           = 0
    security_group_ids  = [aws_security_group.default.id]
    subnets = [
      aws_subnet.subnet1.id,
      aws_subnet.subnet2.id,
      aws_subnet.subnet3.id
    ]
    type = "EC2"
  }
}

resource "aws_batch_job_queue" "power-plant" {
  compute_environments = [
    aws_batch_compute_environment.power-plant-A.arn,
    aws_batch_compute_environment.power-plant-B.arn,
    aws_batch_compute_environment.power-plant-C.arn,
  ]
  name     = "power-plant"
  priority = 1
  state    = "ENABLED"
}

resource "aws_batch_job_queue" "power-plant-high" {
  compute_environments = [
    aws_batch_compute_environment.power-plant-C.arn,
    aws_batch_compute_environment.power-plant-D.arn,
  ]
  name     = "power-plant-high"
  priority = 1
  state    = "ENABLED"
}

resource "aws_batch_job_definition" "power-plant-download" {
  name = "power-plant-download"
  type = "container"
  parameters            = {}
  tags                  = {}
  container_properties = jsonencode({
    command     = ["ts-node", "/download.ts"]
    environment = []
    image       = "${aws_ecr_repository.power-plant.repository_url}:latest"
    linuxParameters = {
      devices = []
      tmpfs   = []
    }
    mountPoints = []
    resourceRequirements = [{
      type  = "VCPU"
      value = "1"
      }, {
      type  = "MEMORY"
      value = "1024"
    }]
    secrets = []
    ulimits = []
    volumes = []
  })
  platform_capabilities = ["EC2"]
  timeout {
    attempt_duration_seconds = 1800
  }
}

resource "aws_batch_job_definition" "power-plant-compression" {
  name = "power-plant-compression"
  type = "container"
  container_properties = jsonencode({
    command     = ["ts-node", "/compression.ts"]
    environment = []
    image       = "${aws_ecr_repository.power-plant.repository_url}:latest"
    linuxParameters = {
      devices = []
      tmpfs   = []
    }
    mountPoints = []
    resourceRequirements = [{
      type  = "VCPU"
      value = "8"
    }, {
      type  = "MEMORY"
      value = "4096"
    }]
    secrets = []
    ulimits = []
    volumes = []
  })
  parameters            = {}
  platform_capabilities = ["EC2"]
  tags                  = {}
  timeout {
    attempt_duration_seconds = 1800
  }
}