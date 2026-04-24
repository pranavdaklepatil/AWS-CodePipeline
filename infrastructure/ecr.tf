# Frontend ECR Repository
resource "aws_ecr_repository" "frontend" {
  name                 = var.ecr_frontend_name
  image_tag_mutability = var.ecr_image_tag_mutability

  image_scanning_configuration {
    scan_on_push = var.ecr_scan_on_push
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name        = "${var.project_name}-frontend-ecr"
    Environment = var.environment
  }
}


#Backend ECR Repository
resource "aws_ecr_repository" "backend" {
  name                 = var.ecr_backend_name
  image_tag_mutability = var.ecr_image_tag_mutability

  image_scanning_configuration {
    scan_on_push = var.ecr_scan_on_push
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name        = "${var.project_name}-backend-ecr"
    Environment = var.environment
  }
}