resource "aws_instance" "transmission-ec2" {
  instance_type          = "t3.nano"
  ami                    = "ami-03d79d440297083e3"
  vpc_security_group_ids = [aws_security_group.transmission-ec2.id]
  subnet_id              = local.subnet2_id
  iam_instance_profile   = "ecsInstanceRole"
  user_data              = "IyEvYmluL3NoCgpJTUFHRV9OQU1FPTk5ODM2NjE2NjU2Mi5ka3IuZWNyLmFwLW5vcnRoZWFzdC0xLmFtYXpvbmF3cy5jb20vcG93ZXItcGxhbnQtdHJhbnNtaXNzaW9uCgpzdWRvIHl1bSBpbnN0YWxsIC15IGRvY2tlcgpzdWRvIHN5c3RlbWN0bCBlbmFibGUgZG9ja2VyCnN1ZG8gc3lzdGVtY3RsIHN0YXJ0IGRvY2tlcgoKYXdzIGVjciBnZXQtbG9naW4gLS1uby1pbmNsdWRlLWVtYWlsIC0tcmVnaW9uIGFwLW5vcnRoZWFzdC0xIHwgc3VkbyBzaApzdWRvIGRvY2tlciBydW4gLWQgLXAgOTA5MTo5MDkxIC1wIDUxNDEzOjUxNDEzIC1wIDUxNDEzOjUxNDEzL3VkcCAkSU1BR0VfTkFNRQ=="
  ebs_block_device {
    device_name = "/dev/xvda"
    volume_size = 20
  }
}
