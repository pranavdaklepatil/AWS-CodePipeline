module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${var.project_name}-vpc"
  cidr = var.vpc_cidr

  azs             = ["${var.aws_region}a", "${var.aws_region}b"]
  private_subnets = var.private_subnets
  public_subnets  = var.public_subnets

  # ── NAT Gateway ───────
  enable_nat_gateway     = true
  single_nat_gateway     = false  
  one_nat_gateway_per_az = true   

  # ── DNS — both flags required together ─────────────────────────────────────
  # — needed by Route53, ECR VPC endpoints, EKS.
  enable_dns_hostnames = true
  enable_dns_support   = true      

  # ── EKS subnet tags ────────────────────────────────────────────────────────
  # Without these tags EKS cannot auto-discover subnets to place load balancers.
  # The ALB Ingress Controller and the EKS control plane both look for these.
  private_subnet_tags = {
    "kubernetes.io/role/internal-elb"             = "1"
    "kubernetes.io/cluster/${var.project_name}"   = "owned"
  }

  public_subnet_tags = {
    "kubernetes.io/role/elb"                      = "1"
    "kubernetes.io/cluster/${var.project_name}"   = "owned"
  }

  # ── VPC Flow Logs ──────
  enable_flow_log                      = true
  create_flow_log_cloudwatch_log_group = true
  create_flow_log_cloudwatch_iam_role  = true
  flow_log_max_aggregation_interval    = 60   

  tags = {
    Project     = var.project_name
    Environment = var.environment   
    ManagedBy   = "Terraform"      
}