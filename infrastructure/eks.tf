module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = "${var.project_name}-eks-cluster"
  cluster_version = var.eks_cluster_version

  cluster_endpoint_public_access  = var.cluster_endpoint_public_access
  cluster_endpoint_private_access = true

  enable_irsa = true

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  # Logging
  cluster_enabled_log_types = ["api", "audit", "authenticator"]

  # Addons
  cluster_addons = {
    coredns    = {}
    kube-proxy = {}
    vpc-cni    = {}
  }

  eks_managed_node_groups = {
    main = {
      name = var.node_group_name

      min_size     = var.node_min_size
      max_size     = var.node_max_size
      desired_size = var.node_desired_size

      instance_types = var.node_instance_types

      ami_type      = "AL2023_x86_64_STANDARD"
      capacity_type = "ON_DEMAND"

      version = var.eks_cluster_version

      block_device_mappings = {
        xvda = {
          device_name = "/dev/xvda"
          ebs = {
            volume_size = var.node_disk_size
            volume_type = "gp3"
          }
        }
      }

      iam_role_additional_policies = {
        AmazonEC2ContainerRegistryReadOnly = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
        CloudWatchAgentServerPolicy        = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
      }

      labels = {
        role = "${var.project_name}-nodes"
      }

      tags = {
        Name = "${var.project_name}-node-group"
      }
    }
  }

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}