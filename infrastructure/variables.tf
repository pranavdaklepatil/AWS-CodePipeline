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

# Backend variables --------------------------------------------
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
  default     = "ap-south-1"
}

variable "backend_dynamodb_table" {
  description = "DynamoDB table for locking"
  type        = string
}
# ----------------------------------------------------------------
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

variable "db_instance_class" {
  description = "DocumentDB instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "db_master_username" {
  description = "DocumentDB master username"
  type        = string
  default     = "medgridadmin"
}

variable "db_master_password" {
  description = "DocumentDB master password"
  type        = string
  sensitive   = true
}

variable "pipeline_artifacts_bucket_name" {
  description = "S3 bucket for pipeline artifacts"
  type        = string
}

variable "frontend_ecr_repo" {
  description = "Frontend ECR repo URL"
  type        = string
}

variable "backend_ecr_repo" {
  description = "Backend ECR repo URL"
  type        = string
}

variable "eks_cluster_name" {
  description = "EKS cluster name"
  type        = string
}

variable "docdb_endpoint" {
  description = "DocumentDB endpoint"
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

