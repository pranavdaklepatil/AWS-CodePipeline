resource "aws_s3_bucket" "pipeline_artifacts" {
  bucket        = var.pipeline_artifacts_bucket_name
  force_destroy = true
}

# CodePipeline Role
resource "aws_iam_role" "codepipeline_role" {
  name = "${var.project_name}-codepipeline-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "codepipeline.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "codepipeline_policy" {
  role = aws_iam_role.codepipeline_role.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = [
        "s3:*",
        "codebuild:*",
        "codestar-connections:*"
      ]
      Effect   = "Allow"
      Resource = "*"
    }]
  })
}

# CodeBuild Role
resource "aws_iam_role" "codebuild_role" {
  name = "${var.project_name}-codebuild-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "codebuild.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "codebuild_policy" {
  role = aws_iam_role.codebuild_role.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [

      # Core permissions
      {
        Action = [
          "logs:*",
          "ecr:*",
          "s3:*",
          "eks:DescribeCluster"
        ]
        Effect   = "Allow"
        Resource = "*"
      },

      #Secrets Manager (IMPORTANT)
      {
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

# CodeBuild Project
resource "aws_codebuild_project" "medgrid_build" {
  name         = "${var.project_name}-build"
  service_role = aws_iam_role.codebuild_role.arn

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type    = "BUILD_GENERAL1_SMALL"
    image           = "aws/codebuild/amazonlinux-x86_64-standard:5.0"
    type            = "LINUX_CONTAINER"
    privileged_mode = true

    # 🔧 Basic env
    environment_variable {
      name  = "AWS_DEFAULT_REGION"
      value = var.aws_region
    }

    # ✅ Use Terraform outputs instead of tfvars
    environment_variable {
      name  = "FRONTEND_ECR_REPO"
      value = aws_ecr_repository.frontend.repository_url
    }

    environment_variable {
      name  = "BACKEND_ECR_REPO"
      value = aws_ecr_repository.backend.repository_url
    }

    environment_variable {
      name  = "EKS_CLUSTER_NAME"
      value = module.eks.cluster_name
    }

    environment_variable {
      name  = "DOCDB_ENDPOINT"
      value = aws_docdb_cluster.main.endpoint
    }

    # Pass secret name (not password!)
    environment_variable {
      name  = "DOCDB_SECRET_NAME"
      value = "${var.project_name}/docdb/credentials"
    }
  }

  source {
    type = "CODEPIPELINE"
  }
}

########################################
# CodePipeline
########################################
resource "aws_codepipeline" "medgrid_pipeline" {
  name     = "${var.project_name}-pipeline"
  role_arn = aws_iam_role.codepipeline_role.arn

  artifact_store {
    location = aws_s3_bucket.pipeline_artifacts.bucket
    type     = "S3"
  }

  ########################################
  # Source Stage
  ########################################
  stage {
    name = "Source"

    action {
      name             = "Source"
      category         = "Source"
      owner            = "AWS"
      provider         = "CodeStarSourceConnection"
      version          = "1"
      output_artifacts = ["source_output"]

      configuration = {
        ConnectionArn    = var.github_connection_arn
        FullRepositoryId = var.repository_name
        BranchName       = var.branch_name
      }
    }
  }

  ########################################
  # Build Stage
  ########################################
  stage {
    name = "Build"

    action {
      name             = "BuildAndDeploy"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      input_artifacts  = ["source_output"]
      output_artifacts = ["build_output"]
      version          = "1"

      configuration = {
        ProjectName = aws_codebuild_project.medgrid_build.name
      }
    }
  }

}