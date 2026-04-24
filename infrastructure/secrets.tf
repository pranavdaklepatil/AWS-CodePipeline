############################################
# Generate Secure Password
############################################
resource "random_password" "docdb" {
  length  = 20
  special = true
}

############################################
# AWS Secrets Manager - Store Credentials
############################################
resource "aws_secretsmanager_secret" "docdb" {
  name        = "${var.project_name}/docdb"
  description = "DocumentDB credentials for MedGrid"

  tags = {
    Name        = "${var.project_name}-docdb-secret"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "docdb" {
  secret_id = aws_secretsmanager_secret.docdb.id

  secret_string = jsonencode({
    username = var.db_master_username
    password = random_password.docdb.result
  })
}

############################################
# Subnet Group
############################################
resource "aws_docdb_subnet_group" "main" {
  name       = var.docdb_subnet_group_name
  subnet_ids = module.vpc.private_subnets

  tags = {
    Name        = "${var.project_name}-docdb-subnet-group"
    Environment = var.environment
  }
}

############################################
# Security Group
############################################
resource "aws_security_group" "docdb" {
  name        = var.docdb_sg_name
  description = var.docdb_sg_description
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = var.docdb_port
    to_port     = var.docdb_port
    protocol    = "tcp"
    cidr_blocks = var.docdb_allowed_cidr_blocks
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-docdb-sg"
    Environment = var.environment
  }
}

############################################
# DocumentDB Cluster
############################################
resource "aws_docdb_cluster" "main" {
  cluster_identifier      = var.docdb_cluster_identifier
  engine                  = var.docdb_engine

  master_username = var.db_master_username
  master_password = random_password.docdb.result

  db_subnet_group_name   = aws_docdb_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.docdb.id]
  skip_final_snapshot    = var.docdb_skip_final_snapshot

  tags = {
    Name        = "${var.project_name}-docdb-cluster"
    Environment = var.environment
  }

  depends_on = [aws_secretsmanager_secret_version.docdb]
}

############################################
# DocumentDB Instances
############################################
resource "aws_docdb_cluster_instance" "main" {
  count              = var.docdb_instance_count
  identifier         = "${var.docdb_instance_identifier_prefix}-${count.index}"
  cluster_identifier = aws_docdb_cluster.main.id
  instance_class     = var.db_instance_class

  tags = {
    Name        = "${var.project_name}-docdb-instance-${count.index}"
    Environment = var.environment
  }
}