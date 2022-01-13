resource "aws_batch_compute_environment" "power-plant-A" {
  type = "MANAGED"
  compute_resources {
    allocation_strategy = "BEST_FIT"
    bid_percentage      = 0
    instance_role       = "arn:aws:iam::998366166562:instance-profile/ecsInstanceRole"
    instance_type       = ["optimal"]
    max_vcpus           = 2
    min_vcpus           = 0
    security_group_ids  = ["sg-842cb7fe"]
    subnets = [
      "subnet-2745a80c",
      "subnet-75c4902e",
      "subnet-aeabb1e7"
    ]
    type = "EC2"
  }
}

resource "aws_batch_compute_environment" "power-plant-B" {
  type = "MANAGED"
  compute_resources {
    allocation_strategy = "BEST_FIT"
    bid_percentage      = 0
    instance_role       = "arn:aws:iam::998366166562:instance-profile/ecsInstanceRole"
    instance_type       = ["optimal"]
    max_vcpus           = 4
    min_vcpus           = 0
    security_group_ids  = ["sg-842cb7fe"]
    subnets = [
      "subnet-2745a80c",
      "subnet-75c4902e",
      "subnet-aeabb1e7"
    ]
    type = "EC2"
  }
}

resource "aws_batch_compute_environment" "power-plant-C" {
  type = "MANAGED"
  compute_resources {
    allocation_strategy = "BEST_FIT"
    bid_percentage      = 0
    instance_role       = "arn:aws:iam::998366166562:instance-profile/ecsInstanceRole"
    instance_type       = ["optimal"]
    max_vcpus           = 8
    min_vcpus           = 0
    security_group_ids  = ["sg-842cb7fe"]
    subnets = [
      "subnet-2745a80c",
      "subnet-75c4902e",
      "subnet-aeabb1e7"
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

resource "aws_batch_job_definition" "power-plant" {
  name                 = "power-plant"
  type                 = "container"
  container_properties = ""
}