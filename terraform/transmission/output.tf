output "transmission-ec2-ip" {
  value = aws_instance.transmission-ec2.public_ip
}