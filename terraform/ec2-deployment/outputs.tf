output "ec2_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = module.ec2_instance.public_ip
}

output "ssh_command" {
  description = "Command to SSH into the instance"
  value       = "ssh -i ~/.ssh/id_rsa ubuntu@${module.ec2_instance.public_ip}"
}
