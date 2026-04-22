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

variable "pipeline_artifacts_bucket_name" {
  description = "S3 bucket for pipeline artifacts"
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

# EkS Cluster variables ------------------------------------------------
variable "eks_cluster_name" {
  description = "EKS cluster name"
  type        = string
}

variable "eks_cluster_version" {
  description = "EKS cluster Kubernetes version"
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
  description = "Name of node group"
  type        = string
  default     = "main-node-group"
}

variable "node_min_size" {
  description = "Minimum nodes"
  type        = number
  default     = 2
}

variable "node_max_size" {
  description = "Maximum nodes"
  type        = number
  default     = 4
}

variable "node_desired_size" {
  description = "Desired nodes"
  type        = number
  default     = 2
}

variable "node_instance_types" {
  description = "Instance types for worker nodes"
  type        = list(string)
  default     = ["t3.medium"]
}

variable "node_disk_size" {
  description = "Disk size in GB"
  type        = number
  default     = 20
}

# ECR variables ------------------------------------------------
variable "ecr_frontend_name" {
  description = "ECR repository name for frontend"
  type        = string
}

variable "ecr_backend_name" {
  description = "ECR repository name for backend"
  type        = string
}

variable "ecr_image_tag_mutability" {
  description = "ECR image tag mutability"
  type        = string
  default     = "MUTABLE"
}

variable "ecr_scan_on_push" {
  description = "Enable image scan on push"
  type        = bool
  default     = true
}

variable "frontend_ecr_repo" {
  description = "Frontend ECR repo URL"
  type        = string
}

variable "backend_ecr_repo" {
  description = "Backend ECR repo URL"
  type        = string
}

# DocumentDB variables ------------------------------------------------
variable "docdb_subnet_group_name" {
  description = "DocumentDB subnet group name"
  type        = string
}

variable "docdb_sg_name" {
  description = "Security group name for DocumentDB"
  type        = string
}

variable "docdb_sg_description" {
  description = "Security group description"
  type        = string
  default     = "Allow DocumentDB traffic"
}

variable "docdb_port" {
  description = "DocumentDB port"
  type        = number
  default     = 27017
}

variable "docdb_allowed_cidr_blocks" {
  description = "Allowed CIDR blocks for DocumentDB access"
  type        = list(string)
}

variable "docdb_cluster_identifier" {
  description = "DocumentDB cluster identifier"
  type        = string
}

variable "docdb_engine" {
  description = "DocumentDB engine"
  type        = string
  default     = "docdb"
}

variable "docdb_skip_final_snapshot" {
  description = "Skip final snapshot on delete"
  type        = bool
  default     = true
}

variable "docdb_instance_count" {
  description = "Number of DocumentDB instances"
  type        = number
  default     = 1
}

variable "docdb_instance_identifier_prefix" {
  description = "Prefix for instance identifier"
  type        = string
}

# Already existing (keep them)
variable "db_master_username" {
  type = string
}

variable "db_master_password" {
  type      = string
  sensitive = true
}

variable "db_instance_class" {
  type = string
}