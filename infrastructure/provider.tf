terraform {
  required_version = "~> 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.0"
    }
    tls = {
      # Needed to read EKS OIDC thumbprint for IRSA (used in eks.tf)
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }

  #Hardcoded From backend-bootstrap/terraform.tfvars --dont forget to make these match!
  backend "s3" {
    bucket         = "medgrid-terraform-state1234"
    key            = "infra/terraform.tfstate"
    region         = "ap-south-1"
    encrypt        = true                          # AES-256 at rest
    dynamodb_table = "medgrid-terraform-locks"   # prevents concurrent applies
  }
}

# AWS provider configuration. 
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
      Repository  = "github.com/your-org/medgrid"
    }
  }
}

# Kubernetes provider
provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)

  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args = [
      "eks", "get-token",
      "--cluster-name", module.eks.cluster_name,
      "--region",       var.aws_region,
    ]
  }
}


# Helm provider
# Shares the same authentication as the Kubernetes provider.
provider "helm" {
  kubernetes {
    host                   = module.eks.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)

    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      command     = "aws"
      args = [
        "eks", "get-token",
        "--cluster-name", module.eks.cluster_name,
        "--region",       var.aws_region,
      ]
    }
  }
}