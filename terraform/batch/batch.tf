resource "aws_batch_compute_environment" "power-plant-A" {
  type                     = "MANAGED"
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
      local.subnet1_id,
      local.subnet2_id,
      local.subnet3_id
    ]
    type = "EC2"
  }
}

resource "aws_batch_compute_environment" "power-plant-B" {
  type                     = "MANAGED"
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
      local.subnet1_id,
      local.subnet2_id,
      local.subnet3_id
    ]
    type = "EC2"
  }
}

resource "aws_batch_compute_environment" "power-plant-C" {
  type                     = "MANAGED"
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
      local.subnet1_id,
      local.subnet2_id,
      local.subnet3_id
    ]
    type = "EC2"
  }
}

resource "aws_batch_compute_environment" "power-plant-D" {
  type                     = "MANAGED"
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
      local.subnet1_id,
      local.subnet2_id,
      local.subnet3_id
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
  name       = "power-plant-download"
  type       = "container"
  parameters = {}
  tags       = {}
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