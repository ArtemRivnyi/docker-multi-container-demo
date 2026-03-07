variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "public_key" {
  description = "Public SSH key for EC2 instance access"
  type        = string
}
