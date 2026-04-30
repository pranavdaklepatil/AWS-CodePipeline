# KMS KEY (ENCRYPTION)
resource "aws_kms_key" "docdb" {
  description             = "KMS key for DocDB encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = {
    Name        = "${var.project_name}-kms"
    Environment = var.environment
  }
}

# SUBNET GROUP
resource "aws_docdb_subnet_group" "main" {
  name       = "${var.project_name}-docdb-subnet-group"
  subnet_ids = module.vpc.private_subnets

  tags = {
    Name        = "${var.project_name}-docdb-subnet-group"
    Environment = var.environment
  }
}

# SECURITY GROUP
resource "aws_security_group" "docdb" {
  name        = "${var.project_name}-docdb-sg"
  description = " Allow Ingress and egress for DocumentDB"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = var.docdb_port
    to_port         = var.docdb_port
    protocol        = "tcp"
    security_groups = var.allowed_security_groups
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

resource "aws_docdb_cluster_parameter_group" "main" {
  name   = "${var.project_name}-docdb-params"
  family = "${var.project_name}-docdb-family"

  parameter {
    name  = "tls"
    value = "enabled"
  }

  tags = {
    Name        = "${var.project_name}-docdb-params"
    Environment = var.environment
  }
}

# DOCDB CLUSTER
resource "aws_docdb_cluster" "main" {
  cluster_identifier = var.docdb_cluster_identifier
  engine             = var.docdb_engine
  engine_version     = "4.0.0"

  master_username = var.docdb_username
  master_password = random_password.docdb.result

  db_subnet_group_name            = aws_docdb_subnet_group.main.name
  vpc_security_group_ids          = [aws_security_group.docdb.id]
  db_cluster_parameter_group_name = aws_docdb_cluster_parameter_group.main.name

  # SECURITY
  storage_encrypted   = true
  kms_key_id          = aws_kms_key.docdb.arn
  deletion_protection = true

  # BACKUP
  backup_retention_period = 7
  preferred_backup_window = "07:00-09:00"

  # MAINTENANCE
  preferred_maintenance_window = "sun:05:00-sun:07:00"

  # LOGGING
  enabled_cloudwatch_logs_exports = ["audit", "profiler"]

  skip_final_snapshot = var.docdb_skip_final_snapshot

  tags = {
    Name        = "${var.project_name}-docdb-cluster"
    Environment = var.environment
  }

  depends_on = [aws_secretsmanager_secret.docdb]
}

# INSTANCES
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