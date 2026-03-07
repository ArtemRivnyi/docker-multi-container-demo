# Fetch available Availability Zones
data "aws_availability_zones" "available" {}

locals {
  name = "caching-api-deployment"
}

# -----------------------------------------------------------------------------
# VPC Configuration
# -----------------------------------------------------------------------------
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${local.name}-vpc"
  cidr = "10.0.0.0/16"

  azs             = slice(data.aws_availability_zones.available.names, 0, 1)
  public_subnets  = ["10.0.101.0/24"]

  # For simple EC2 deployment we only need public subnets
  enable_nat_gateway   = false
  enable_dns_hostnames = true
}

# -----------------------------------------------------------------------------
# Security Group
# -----------------------------------------------------------------------------
module "security_group" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "~> 5.0"

  name        = "${local.name}-sg"
  description = "Security group for Caching API (SSH, HTTP, Traefik Dashboard)"
  vpc_id      = module.vpc.vpc_id

  # Ingress rules
  ingress_with_cidr_blocks = [
    {
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      description = "SSH Access"
      cidr_blocks = "0.0.0.0/0"
    },
    {
      from_port   = 80
      to_port     = 80
      protocol    = "tcp"
      description = "HTTP Access for API"
      cidr_blocks = "0.0.0.0/0"
    },
    {
      from_port   = 8080
      to_port     = 8080
      protocol    = "tcp"
      description = "Traefik Dashboard"
      cidr_blocks = "0.0.0.0/0"
    }
  ]

  # Egress rule: allow all outbound traffic
  egress_rules = ["all-all"]
}

# -----------------------------------------------------------------------------
# EC2 Instance
# -----------------------------------------------------------------------------
# Find latest Ubuntu 22.04 AMI
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_key_pair" "deployer" {
  key_name   = "${local.name}-key"
  public_key = var.public_key
}

module "ec2_instance" {
  source  = "terraform-aws-modules/ec2-instance/aws"
  version = "~> 5.0"

  name = "${local.name}-srv"

  instance_type          = "t2.micro" # Free tier eligible
  ami                    = data.aws_ami.ubuntu.id
  key_name               = aws_key_pair.deployer.key_name
  vpc_security_group_ids = [module.security_group.security_group_id]
  subnet_id              = module.vpc.public_subnets[0]

  associate_public_ip_address = true

  tags = {
    Environment = "production"
    Project     = "Caching-Microservice"
  }
}
