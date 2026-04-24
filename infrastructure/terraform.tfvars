project_name = "medgrid"
environment  = "dev"

aws_region = "us-east-1"

# Backend state config
backend_bucket_name    = "medgrid-terraform-state1234"
backend_key            = "infra/terraform.tfstate"
backend_region         = "us-east-1"
backend_dynamodb_table = "medgrid-terraform-locks"

# Networking
vpc_cidr        = "10.0.0.0/16"
public_subnets  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnets = ["10.0.10.0/24", "10.0.11.0/24"]

# CI/CD
pipeline_artifacts_bucket_name = "medgrid-pipeline-artifacts-1234"

github_connection_arn = "arn:aws:codestar-connections:us-east-1:123456789012:connection/xxxx"
repository_name      = "pranavdaklepatil/AWS-CodePipeline"
branch_name          = "main"

# EKS
eks_cluster_name              = "medgrid-eks-cluster"
eks_cluster_version           = "1.28"
cluster_endpoint_public_access = true
enable_irsa                   = true

node_group_name   = "main-node-group"
node_min_size     = 2
node_max_size     = 4
node_desired_size = 2

node_instance_types = ["t3.medium"]
node_disk_size      = 20

# ECR 
ecr_frontend_name = "medgrid-frontend"
ecr_backend_name  = "medgrid-backend"

ecr_image_tag_mutability = "MUTABLE"
ecr_scan_on_push         = true

# DocumentDB
docdb_subnet_group_name       = "medgrid-docdb-subnet-group"
docdb_sg_name                 = "medgrid-docdb-sg"
docdb_allowed_cidr_blocks    = ["10.0.0.0/16"]

docdb_cluster_identifier      = "medgrid-docdb-cluster"
docdb_instance_identifier_prefix = "medgrid-docdb-instance"

docdb_instance_count = 1
db_instance_class     = "db.t3.medium"
