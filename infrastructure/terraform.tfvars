project_name = "medgrid"
environment  = "dev"  

aws_region = "us-east-1"

vpc_cidr = "10.0.0.0/16"
public_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnets = ["10.0.10.0/24", "10.0.11.0/24"]

db_instance_class = "db.t3.medium"
db_master_username = "medgridadmin"
db_master_password = "Admin@123"