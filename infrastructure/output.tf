output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = var.eks_cluster_name
}

output "eks_cluster_endpoint" {
  description = "EKS cluster API endpoint"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_ca" {
  description = "EKS cluster certificate authority data"
  value       = module.eks.cluster_certificate_authority_data
  sensitive   = true
}

output "docdb_endpoint" {
  description = "DocumentDB endpoint"
  value       = aws_docdb_cluster.main.endpoint
  sensitive   = true
}

output "docdb_secret_arn" {
  description = "Secrets Manager ARN"
  value       = aws_secretsmanager_secret.docdb.arn
}

output "frontend_ecr_url" {
  description = "Frontend ECR repository URL"
  value       = aws_ecr_repository.frontend.repository_url
}

output "backend_ecr_url" {
  description = "Backend ECR repository URL"
  value       = aws_ecr_repository.backend.repository_url
}

output "aws_region" {
  description = "AWS region"
  value       = var.aws_region
}