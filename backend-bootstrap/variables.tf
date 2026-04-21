variable "aws_region" {
  type        = string
  description = "AWS region"
}

variable "s3_bucket_name" {
  type        = string
  description = "S3 bucket name for Terraform state"
}

variable "dynamodb_table_name" {
  type        = string
  description = "DynamoDB table for state locking"
}