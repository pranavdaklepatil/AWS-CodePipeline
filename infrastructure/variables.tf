variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "medgrid"
}

variable "environment" {
  description = "Deployment environment (dev/staging/prod)"
  type        = string
  default     = "dev"
}

# Backend state
variable "backend_bucket_name" {
  description = "S3 bucket for Terraform state"
  type        = string
}

variable "backend_key" {
  description = "State file path"
  type        = string
  default     = "infra/terraform.tfstate"
}

variable "backend_region" {
  description = "Backend region"
  type        = string
  default     = "us-east-1"
}

variable "backend_dynamodb_table" {
  description = "DynamoDB table for locking"
  type        = string
}

# Network
variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnets" {
  description = "Public subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnets" {
  description = "Private subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

# CI/CD
variable "pipeline_artifacts_bucket_name" {
  description = "S3 bucket for pipeline artifacts"
  type        = string
}

variable "github_connection_arn" {
  description = "CodeStar connection ARN"
  type        = string
}

variable "repository_name" {
  description = "GitHub repo (owner/repo)"
  type        = string
}

variable "branch_name" {
  description = "Branch name"
  type        = string
  default     = "main"
}

# EKS
variable "eks_cluster_name" {
  description = "EKS cluster name"
  type        = string
}

variable "eks_cluster_version" {
  description = "EKS cluster version"
  type        = string
  default     = "1.28"
}

variable "cluster_endpoint_public_access" {
  description = "Enable public access to EKS API"
  type        = bool
  default     = true
}

variable "enable_irsa" {
  description = "Enable IAM Roles for Service Accounts"
  type        = bool
  default     = true
}

variable "node_group_name" {
  type    = string
  default = "main-node-group"
}

variable "node_min_size" {
  type    = number
  default = 2
}

variable "node_max_size" {
  type    = number
  default = 4
}

variable "node_desired_size" {
  type    = number
  default = 2
}

variable "node_instance_types" {
  type    = list(string)
  default = ["t3.medium"]
}

variable "node_disk_size" {
  type    = number
  default = 20
}

# ECR
variable "ecr_frontend_name" {
  type = string
}

variable "ecr_backend_name" {
  type = string
}

variable "ecr_image_tag_mutability" {
  type    = string
  default = "MUTABLE"
}

variable "ecr_scan_on_push" {
  type    = bool
  default = true
}

# DocumentDB (NO PASSWORD VARIABLES ANYMORE)
variable "docdb_subnet_group_name" {
  type = string
}

variable "docdb_sg_name" {
  type = string
}

variable "docdb_sg_description" {
  type    = string
  default = "Allow DocumentDB traffic"
}

variable "docdb_port" {
  type    = number
  default = 27017
}

variable "docdb_allowed_cidr_blocks" {
  type = list(string)
}

variable "docdb_cluster_identifier" {
  type = string
}

variable "docdb_engine" {
  type    = string
  default = "docdb"
}

variable "docdb_skip_final_snapshot" {
  type    = bool
  default = true
}

variable "docdb_instance_count" {
  type    = number
  default = 1
}

variable "docdb_instance_identifier_prefix" {
  type = string
}

# ONLY INSTANCE CLASS REMAINS
variable "db_instance_class" {
  type = string
}