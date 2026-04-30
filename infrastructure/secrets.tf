# RANDOM PASSWORDS
resource "random_password" "docdb" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "random_password" "jwt_secret" {
  length  = 64
  special = false
}

# SECRETS MANAGER
resource "aws_secretsmanager_secret" "docdb" {
  name        = "${var.project_name}/docdb"
  description = "MedGrid DB + JWT Secrets"

  tags = {
    Name        = "${var.project_name}-secret"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "docdb" {
  secret_id = aws_secretsmanager_secret.docdb.id

  secret_string = jsonencode({
    username   = var.docdb_username
    password   = random_password.docdb.result
    JWT_SECRET = random_password.jwt_secret.result
  })
}