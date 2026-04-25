module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = var.eks_cluster_name
  cluster_version = var.eks_cluster_version

  cluster_endpoint_public_access = var.cluster_endpoint_public_access
  enable_irsa                    = var.enable_irsa

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    main = {
      name         = var.node_group_name
      min_size     = var.node_min_size
      max_size     = var.node_max_size
      desired_size = var.node_desired_size

      instance_types = var.node_instance_types
      disk_size      = var.node_disk_size

      # ✅ FIX FOR AMI ERROR (IMPORTANT)
      ami_type       = "AL2_x86_64"
      capacity_type  = "ON_DEMAND"

      tags = {
        "k8s.io/cluster-autoscaler/enabled" = "true"
      }
    }
  }

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}