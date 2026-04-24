data "aws_secretsmanager_secret_version" "docdb" {
  secret_id = "medgrid/docdb"
}

locals {
  docdb_secret = jsondecode(data.aws_secretsmanager_secret_version.docdb.secret_string)
}

resource "aws_docdb_subnet_group" "main" {
  name       = var.docdb_subnet_group_name
  subnet_ids = module.vpc.private_subnets
  
   tags = {
    Name        = "${var.project_name}-docdb-sg"
    Environment = var.environment
  }
}

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

resource "aws_docdb_cluster" "main" {
  cluster_identifier      = var.docdb_cluster_identifier
  engine                  = var.docdb_engine

  master_username = local.docdb_secret.username
  master_password = local.docdb_secret.password

  db_subnet_group_name   = aws_docdb_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.docdb.id]
  skip_final_snapshot    = var.docdb_skip_final_snapshot

  tags = {
    Name        = "${var.project_name}-docdb-cluster"
    Environment = var.environment
  }

}

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