project_name = "medgrid"
environment  = "dev"  

aws_region = "us-east-1"

# Backend configuration variables ------------------------------------------------
backend_bucket_name     = "medgrid-terraform-state1234"
backend_key             = "infra/terraform.tfstate"
backend_region          = "ap-south-1"
backend_dynamodb_table  = "medgrid-terraform-locks"
# --------------------------------------------------------------------------------

vpc_cidr = "10.0.0.0/16"
public_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnets = ["10.0.10.0/24", "10.0.11.0/24"]

db_instance_class = "db.t3.medium"
db_master_username = "medgridadmin"
db_master_password = "Admin@123"

pipeline_artifacts_bucket_name = "medgrid-pipeline-artifacts-1234"

frontend_ecr_repo = "123456789012.dkr.ecr.us-east-1.amazonaws.com/frontend"
backend_ecr_repo  = "123456789012.dkr.ecr.us-east-1.amazonaws.com/backend"

eks_cluster_name = "medgrid-eks-cluster"
docdb_endpoint   = "medgrid-docdb.cluster-xxxx.us-east-1.docdb.amazonaws.com"

github_connection_arn = "arn:aws:codestar-connections:ap-south-1:123456789012:connection/xxxx"
repository_name       = "pranavdaklepatil/AWS-CodePipeline"
branch_name           = "main"