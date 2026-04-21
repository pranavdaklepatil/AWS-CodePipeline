<div align="center">

```
███╗   ███╗ ███████╗ ██████╗   ██████╗  ██████╗  ██╗ ██████╗
 ████╗ ████║ ██╔════╝ ██╔══██╗ ██╔════╝  ██╔══██╗ ██║ ██╔══██╗
 ██╔████╔██║ █████╗   ██║  ██║ ██║  ███╗ ██████╔╝ ██║ ██║  ██║
 ██║╚██╔╝██║ ██╔══╝   ██║  ██║ ██║   ██║ ██╔══██╗ ██║ ██║  ██║
 ██║ ╚═╝ ██║ ███████╗ ██████╔╝ ╚██████╔╝ ██║  ██║ ██║ ██████╔╝
╚═╝     ╚═╝ ╚══════╝ ╚═════╝   ╚═════╝  ╚═╝  ╚═╝ ╚═╝ ╚═════╝
```

### 🏥 Containerized Hospital Management System
### ⚡ Production-Grade AWS CI/CD Pipeline

<br/>

<img src="https://img.shields.io/badge/Project-MedGrid-00D4AA?style=for-the-badge&labelColor=0A0A0A" />
<img src="https://img.shields.io/badge/Status-In%20Progress-F5A623?style=for-the-badge&labelColor=0A0A0A" />
<img src="https://img.shields.io/badge/Type-DevOps%20%7C%20Cloud%20%7C%20Containers-7C3AED?style=for-the-badge&labelColor=0A0A0A" />

<br/><br/>

[![AWS](https://img.shields.io/badge/AWS-FF9900?style=flat-square&logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?style=flat-square&logo=kubernetes&logoColor=white)](https://kubernetes.io/)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/)
[![Amazon EKS](https://img.shields.io/badge/EKS-FF9900?style=flat-square&logo=amazon-eks&logoColor=white)](https://aws.amazon.com/eks/)
[![Amazon ECR](https://img.shields.io/badge/ECR-FF9900?style=flat-square&logo=amazon-aws&logoColor=white)](https://aws.amazon.com/ecr/)
[![CodePipeline](https://img.shields.io/badge/CodePipeline-4B9EDB?style=flat-square&logo=amazon-aws&logoColor=white)](https://aws.amazon.com/codepipeline/)
[![CodeBuild](https://img.shields.io/badge/CodeBuild-6DB33F?style=flat-square&logo=amazon-aws&logoColor=white)](https://aws.amazon.com/codebuild/)
[![CodeDeploy](https://img.shields.io/badge/CodeDeploy-E8442C?style=flat-square&logo=amazon-aws&logoColor=white)](https://aws.amazon.com/codedeploy/)
[![Terraform](https://img.shields.io/badge/Terraform-7B42BC?style=flat-square&logo=terraform&logoColor=white)](https://terraform.io/)

<br/><br/>

> **One `git push` → Fully automated build, test, containerize, push, and deploy to EKS.**
> No manual steps. No hardcoded credentials. No server babysitting.

<br/>

</div>

---

## 📌 Table of Contents

<div align="center">

| # | Section |
|:---:|:--------|
| 1 | [🔍 Project Overview](#-project-overview) |
| 2 | [🏛️ Architecture](#️-architecture) |
| 3 | [🔄 Pipeline Flow](#-pipeline-flow) |
| 4 | [☁️ AWS Services Deep Dive](#️-aws-services-deep-dive) |
| 5 | [🛠️ Tech Stack](#️-tech-stack) |
| 6 | [⚙️ Configuration — Variables File](#️-configuration--variables-file) |
| 7 | [🔧 Pipeline Stages In Detail](#-pipeline-stages-in-detail) |
| 8 | [☸️ Kubernetes Manifests Explained](#️-kubernetes-manifests-explained) |
| 9 | [🔐 Security Architecture](#-security-architecture) |
| 10 | [📊 Monitoring & Observability](#-monitoring--observability) |
| 11 | [🧪 Testing Strategy](#-testing-strategy) |
| 12 | [🗺️ Roadmap](#️-roadmap) |
| 13 | [❓ FAQ & Troubleshooting](#-faq--troubleshooting) |

</div>

---

## 🔍 Project Overview

**MedGrid** is a containerized, cloud-native hospital management system deployed on **Amazon EKS** with a fully automated CI/CD pipeline powered by **AWS CodePipeline**. This project demonstrates real-world production DevOps practices — from source control to zero-downtime deployments.

### 🎯 What This Project Achieves

```
Developer commits code
        │
        ▼
GitHub triggers CodePipeline automatically
        │
        ▼
CodeBuild compiles, tests & builds Docker image
        │
        ▼
Image pushed to Amazon ECR (versioned, scanned)
        │
        ▼
CodeDeploy rolls out update to EKS cluster
        │
        ▼
CloudWatch monitors health — auto-rollback on failure
```

### ✨ Key Highlights

<div align="center">

| Feature | Detail |
|:---:|:---|
| 🔁 **Fully Automated** | Zero manual steps from commit to production |
| 🔒 **Zero Hardcoded Values** | All config driven via a single `variables.tf` — nothing else needs touching |
| 📦 **Containerized** | Docker + ECR — immutable, versioned image artifacts |
| ☸️ **Orchestrated on EKS** | Kubernetes rolling updates, HPA, liveness probes |
| 🛡️ **Security-First** | IAM least privilege, ECR scanning, private subnets, IRSA |
| 📈 **Observable** | CloudWatch Container Insights, metrics, logs, alarms |
| ♻️ **Rollback-Ready** | Automatic rollback on failed deployment health checks |

</div>

---

## 🏛️ Architecture

> Full system architecture showing how all AWS services connect.

<div align="center">

![Architecture](./Architecture.svg)

</div>

---

## 🔄 Pipeline Flow

> Visual end-to-end flow from developer push to live deployment.

<div align="center">

![Pipeline Flow](./Pipeline-Flow.svg)

</div>

---

## ☁️ AWS Services Deep Dive

### 🔵 AWS CodePipeline — The Orchestrator

CodePipeline is the backbone that **coordinates every stage** automatically. It:
- Listens for GitHub pushes via webhook (no polling)
- Passes artifacts between stages via S3
- Supports parallel actions within a stage
- Sends SNS notifications on success/failure

### 🟠 AWS CodeBuild — The Build Engine

A **serverless build environment** — no EC2 instances to manage. Each build:
- Spins up a fresh container using the `buildspec.yml`
- Logs every command to CloudWatch
- Exports the Docker image to ECR
- Produces `imagedefinitions.json` for the deploy stage

**Environment Variables injected by CodeBuild (never hardcoded):**

```
AWS_DEFAULT_REGION      → injected automatically
ECR_REGISTRY            → from environment variable
IMAGE_REPO_NAME         → from variables.tf via Terraform
IMAGE_TAG               → $CODEBUILD_RESOLVED_SOURCE_VERSION (git SHA)
```

### 🔴 AWS CodeDeploy — The Deployment Manager

Handles **zero-downtime deployments** to EKS using:
- Rolling updates (gradual pod replacement)
- Blue/Green (optional, for production safety)
- Health check gates before marking success
- Automatic rollback on probe failures

### 🟡 Amazon ECR — The Container Registry

Every Docker image is:
- **Tagged** with the Git commit SHA (fully traceable)
- **Scanned** automatically for OS/library vulnerabilities on push
- **Lifecycle-policy managed** (old images auto-cleaned)
- **Encrypted** at rest with AWS KMS

### 🟢 Amazon EKS — The Runtime

Managed Kubernetes cluster running the MedGrid application:
- **Worker nodes** in private subnets (no direct internet exposure)
- **ALB Ingress Controller** for external traffic routing
- **IRSA (IAM Roles for Service Accounts)** — pods authenticate to AWS without any keys
- **Cluster Autoscaler** scales nodes based on demand
- **HPA (Horizontal Pod Autoscaler)** scales pods based on CPU/memory

---

## 🛠️ Tech Stack

<div align="center">

| Layer | Technology | Purpose |
|:---:|:---:|:---|
| **Source Control** | ![GitHub](https://img.shields.io/badge/GitHub-181717?logo=github&logoColor=white) | Code hosting, PR-based workflow |
| **CI/CD** | ![CodePipeline](https://img.shields.io/badge/CodePipeline-FF9900?logo=amazon-aws&logoColor=white) | Pipeline orchestration |
| **Build** | ![CodeBuild](https://img.shields.io/badge/CodeBuild-6DB33F?logo=amazon-aws&logoColor=white) | Serverless build & test runner |
| **Containerization** | ![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white) | Image build & packaging |
| **Registry** | ![ECR](https://img.shields.io/badge/ECR-FF9900?logo=amazon-aws&logoColor=white) | Private Docker image storage |
| **Orchestration** | ![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?logo=kubernetes&logoColor=white) | Container orchestration |
| **Managed K8s** | ![EKS](https://img.shields.io/badge/EKS-FF9900?logo=amazon-eks&logoColor=white) | AWS managed Kubernetes cluster |
| **Deployment** | ![CodeDeploy](https://img.shields.io/badge/CodeDeploy-E8442C?logo=amazon-aws&logoColor=white) | Rolling deployments to EKS |
| **Monitoring** | ![CloudWatch](https://img.shields.io/badge/CloudWatch-FF4F8B?logo=amazon-cloudwatch&logoColor=white) | Logs, metrics, alarms |
| **IaC** | ![Terraform](https://img.shields.io/badge/Terraform-7B42BC?logo=terraform&logoColor=white) | Infrastructure as Code |
| **Networking** | ![VPC](https://img.shields.io/badge/VPC-8C4FFF?logo=amazon-aws&logoColor=white) | Isolated cloud network |
| **Secrets** | ![SSM](https://img.shields.io/badge/SSM%20Parameter%20Store-FF9900?logo=amazon-aws&logoColor=white) | Secure secret management |

</div>

---

## ⚙️ Configuration — Variables File

> ### 🌟 Design Principle: Zero Hardcoded Values
>
> Every resource name, region, instance type, replica count, port number, and identifier in this project is parameterized.
> **To deploy MedGrid in your own AWS account, you edit exactly one file: `infra/variables.tf`**
>
> Changing `project_name` automatically renames the EKS cluster, ECR repo, CodePipeline, IAM roles, S3 bucket, CloudWatch log groups — everything. No grep-and-replace across files.
>
> All secrets (GitHub tokens, DB passwords, API keys) are **never written into any file**. They are stored in **AWS SSM Parameter Store** as encrypted `SecureString` entries and read at runtime by Terraform and CodeBuild via IAM role permissions.

<div align="center">

| Variable | Default | What It Controls |
|:---|:---:|:---|
| `aws_region` | `ap-south-1` | Region for all AWS resources |
| `aws_account_id` | _(your account)_ | Used in ECR URIs, IAM ARNs, S3 names |
| `project_name` | `medgrid` | Prefix for **every** resource name |
| `environment` | `dev` | Sizing, tagging, and isolation per env |
| `github_owner` | `pranavdaklepatil` | GitHub username / org |
| `github_repo` | `AWS-CodePipeline` | Repo the pipeline watches |
| `github_branch` | `main` | Any push here triggers the pipeline |
| `node_instance_type` | `t3.medium` | EKS worker node EC2 size |
| `node_min_count` | `1` | Cluster Autoscaler floor |
| `node_max_count` | `3` | Cluster Autoscaler ceiling |
| `node_desired_count` | `2` | Initial node count at creation |
| `app_port` | `8080` | Container port — used in K8s, ALB, SGs |
| `app_replicas` | `2` | Pod count (also sets HPA minimum) |
| `app_domain` | `medgrid.yourdomain.com` | ALB Ingress host rule |
| `ecr_image_retention_count` | `10` | Max images kept before auto-cleanup |
| `tags` | _(see file)_ | Applied to **all** AWS resources |

</div>

---

## 🔧 Pipeline Stages In Detail

### ━━ Stage 1: SOURCE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<div align="center">

| Parameter | Value | Where It's Set |
|:---|:---|:---:|
| Provider | GitHub (Version 2 via GitHub App) | `infra/codepipeline.tf` |
| Repository | `github_owner/github_repo` | `infra/variables.tf` ✏️ |
| Branch | `github_branch` | `infra/variables.tf` ✏️ |
| Trigger | Webhook on push event | automatic |
| Output Artifact | `SourceArtifact` (ZIP → S3) | automatic |

</div>

### ━━ Stage 2: BUILD ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Powered by `pipeline/buildspec.yml`:

```yaml
version: 0.2

env:
  variables:
    IMAGE_REPO_NAME: "medgrid-app"              # injected by Terraform from variables.tf
  parameter-store:
    GITHUB_TOKEN: "/medgrid/github/oauth-token" # read from SSM at runtime — never hardcoded

phases:
  install:
    runtime-versions:
      docker: 20

  pre_build:
    commands:
      - echo "Logging into Amazon ECR..."
      - |
        aws ecr get-login-password --region $AWS_DEFAULT_REGION \
          | docker login --username AWS --password-stdin \
            $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
      - export IMAGE_TAG=$CODEBUILD_RESOLVED_SOURCE_VERSION   # Git SHA as immutable tag
      - export ECR_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME

  build:
    commands:
      - echo "Building Docker image — tag $IMAGE_TAG..."
      - docker build -t $ECR_URI:$IMAGE_TAG -t $ECR_URI:latest .
      - echo "Running in-container tests..."
      - docker run --rm $ECR_URI:$IMAGE_TAG sh -c "npm test"

  post_build:
    commands:
      - docker push $ECR_URI:$IMAGE_TAG
      - docker push $ECR_URI:latest
      - |
        printf '[{"name":"%s","imageUri":"%s"}]' \
          $IMAGE_REPO_NAME $ECR_URI:$IMAGE_TAG > imagedefinitions.json

artifacts:
  files:
    - imagedefinitions.json
    - k8s/**/*

cache:
  paths:
    - '/root/.npm/**/*'
    - '/root/.docker/**/*'
```

### ━━ Stage 3: TEST (Security Gate) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```yaml
phases:
  build:
    commands:
      # Unit + integration tests
      - npm run test:unit
      - npm run test:integration

      # ECR vulnerability scan gate — fails pipeline if CRITICAL CVEs found
      - |
        CRITICAL=$(aws ecr describe-image-scan-findings \
          --repository-name $IMAGE_REPO_NAME \
          --image-id imageTag=$IMAGE_TAG \
          --query 'imageScanFindings.findingSeverityCounts.CRITICAL' \
          --output text)
        if [ "$CRITICAL" != "0" ] && [ "$CRITICAL" != "None" ]; then
          echo "❌ CRITICAL vulnerabilities found: $CRITICAL — blocking deployment"
          exit 1
        fi
        echo "✅ No CRITICAL vulnerabilities — proceeding to deploy"

      # Kubernetes manifest validation
      - kubeval k8s/*.yaml
      - kubectl apply -f k8s/ --dry-run=client
```

> ⛔ **Pipeline stops completely if any test or security scan fails. The broken image is never deployed.**

### ━━ Stage 4: DEPLOY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```yaml
# pipeline/appspec.yml
version: 0.0
Resources:
  - TargetService:
      Type: AWS::ECS::Service
      Properties:
        TaskDefinition: "<TASK_DEFINITION>"
        LoadBalancerInfo:
          ContainerName: "medgrid-app"        # from variables.tf
          ContainerPort: 8080                 # from variables.tf → app_port

Hooks:
  - BeforeInstall:         "scripts/validate-cluster-health.sh"
  - AfterInstall:          "scripts/run-smoke-tests.sh"
  - AfterAllowTestTraffic: "scripts/run-integration-tests.sh"
  - BeforeAllowTraffic:    "scripts/check-readiness.sh"
  - AfterAllowTraffic:     "scripts/verify-production.sh"
```

---

## ☸️ Kubernetes Manifests Explained

### Deployment — Rolling Updates & Health Probes

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: medgrid-app
  namespace: medgrid
spec:
  replicas: 2                           # ← set via variables.tf → app_replicas
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1                       # Allow 1 extra pod during update
      maxUnavailable: 0                 # Zero downtime — old pod stays until new is ready
  template:
    spec:
      serviceAccountName: medgrid-sa   # IRSA — AWS access via service account (no keys)
      containers:
        - name: medgrid-app
          image: AWS_ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/medgrid-app:IMAGE_TAG
          # ↑ Image injected by CodeDeploy from imagedefinitions.json — never hardcoded
          ports:
            - containerPort: 8080      # ← from variables.tf → app_port
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10
            failureThreshold: 3        # 3 consecutive failures → pod restarted
          readinessProbe:
            httpGet:
              path: /ready
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 5
            failureThreshold: 3        # 3 failures → pod pulled from load balancer
          envFrom:
            - configMapRef:
                name: medgrid-config   # Non-sensitive config — from ConfigMap
          env:
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: medgrid-secrets
                  key: db-password     # Sensitive values — from K8s Secret, never in YAML
```

### Horizontal Pod Autoscaler

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: medgrid-hpa
  namespace: medgrid
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: medgrid-app
  minReplicas: 2                        # ← from variables.tf → app_replicas
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70        # Scale up when CPU > 70%
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80        # Scale up when memory > 80%
```

### Ingress — ALB with HTTPS

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: medgrid-ingress
  namespace: medgrid
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":443},{"HTTP":80}]'
    alb.ingress.kubernetes.io/ssl-redirect: "443"
spec:
  rules:
    - host: medgrid.yourdomain.com     # ← from variables.tf → app_domain
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: medgrid-svc
                port:
                  number: 8080         # ← from variables.tf → app_port
```

---

## 🔐 Security Architecture

### IAM — Least Privilege by Design

Every AWS service has its own IAM role with **only the permissions it needs and nothing more**:

<div align="center">

| Role | Attached To | Permissions Granted |
|:---|:---:|:---|
| `medgrid-codepipeline-role` | CodePipeline | S3 read/write, CodeBuild trigger, CodeDeploy trigger only |
| `medgrid-codebuild-role` | CodeBuild | ECR push, S3 artifact read, SSM read, CloudWatch logs |
| `medgrid-codedeploy-role` | CodeDeploy | EKS `kubectl apply` scoped to `medgrid` namespace only |
| `medgrid-eks-node-role` | EKS Worker Nodes | ECR pull, CloudWatch Container Insights |
| `medgrid-sa-role` | K8s Service Account | App-specific resources only (via IRSA) |

</div>

> ✅ **No IAM user access keys are used anywhere in the pipeline.**
> All services authenticate via IAM roles attached at the resource level.

### IRSA — Pods Authenticate to AWS Without Any Keys

```hcl
# Terraform creates this automatically — no manual setup required
# The K8s service account is annotated to assume this IAM role
# → the pod gets AWS credentials automatically via OIDC
# → no access keys, no secret env vars, no key rotation needed

resource "aws_iam_role" "medgrid_sa_role" {
  name = "${var.project_name}-sa-role-${var.environment}"
  # ↑ named from variables.tf — never hardcoded
}
```

### Network Security

```
Internet (Port 443 only)
         │
         ▼
    ┌─────────┐
    │   ALB   │  ← Public Subnet — only entry point
    └─────────┘
         │
         ▼
    ┌─────────┐
    │EKS Pods │  ← Private Subnet — no direct internet access
    └─────────┘
         │
         ▼
    ┌─────────┐
    │   NAT   │  ← Outbound only (ECR pulls, SSM, CloudWatch)
    └─────────┘
```

### ECR Image Scanning

```bash
# Scanning is enabled on every push — configured automatically in infra/ecr.tf
aws ecr describe-image-scan-findings \
  --repository-name medgrid-app \
  --image-id imageTag=latest \
  --query 'imageScanFindings.findingSeverityCounts'
```

---

## 📊 Monitoring & Observability

### CloudWatch Alarms (Auto-configured by Terraform)

<div align="center">

| Alarm | Threshold | Action |
|:---|:---:|:---:|
| Pipeline failure | Any failed stage | SNS → Email + Slack |
| Pod crash loop | `RestartCount > 3` | SNS → PagerDuty |
| Node CPU | `> 85%` for 5 min | SNS + Cluster Autoscaler |
| ECR CRITICAL CVE | Any finding | SNS → Email |
| Build duration | `> 20 minutes` | SNS → Slack |

</div>

### Key Monitoring Commands

```bash
# Real-time CodeBuild logs
aws logs tail /aws/codebuild/medgrid-build --follow

# Pipeline execution history
aws codepipeline list-pipeline-executions \
  --pipeline-name medgrid-pipeline \
  --max-results 5

# Watch pods in real time
kubectl get pods -n medgrid -w

# Pod resource usage
kubectl top pods -n medgrid

# Node resource usage
kubectl top nodes

# HPA scaling decisions
kubectl describe hpa medgrid-hpa -n medgrid

# Recent events in namespace (debugging)
kubectl get events -n medgrid --sort-by='.lastTimestamp'

# Application logs
kubectl logs -f deployment/medgrid-app -n medgrid --all-containers=true
```

---

## 🧪 Testing Strategy

### Test Layers

```
┌─────────────────────────────────────────────┐
│              CodeBuild (Stage 2)             │
│                                              │
│   Unit Tests  →  in-container build test    │
│   Lint        →  Dockerfile + YAML checks   │
└─────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────┐
│              Security Gate (Stage 3)         │
│                                              │
│   ECR Scan    →  fail on CRITICAL CVE        │
│   K8s Lint    →  kubeval + dry-run apply     │
│   Integration →  docker run test suite       │
└─────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────┐
│           Post-Deploy Hooks (Stage 4)        │
│                                              │
│   Smoke Test  →  /health returns 200?        │
│   Ready Check →  all pods Ready?            │
│   Verify Prod →  end-to-end request check   │
└─────────────────────────────────────────────┘
```

### Smoke Test Script

```bash
#!/bin/bash
# scripts/run-smoke-tests.sh — runs as CodeDeploy AfterInstall hook
set -e

APP_URL=$(kubectl get ingress medgrid-ingress -n medgrid \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$APP_URL/health)

if [ "$HTTP_STATUS" != "200" ]; then
  echo "❌ Smoke test FAILED — /health returned $HTTP_STATUS"
  exit 1   # ← triggers automatic CodeDeploy rollback
fi

echo "✅ Smoke test PASSED — deployment is healthy"
```

---

## 🗺️ Roadmap

```
COMPLETED ────────────────────────────────────────────────────────────────────
  ✅ Repository scaffolding and documentation
  ✅ Architecture design (Architecture.svg)
  ✅ Pipeline flow design (Pipeline-Flow.svg)
  ✅ Variables-driven config design (zero hardcoding)

IN PROGRESS ──────────────────────────────────────────────────────────────────
  🔧 Terraform: VPC + subnets + NAT Gateway + IGW
  🔧 Terraform: EKS cluster + managed node group
  🔧 Terraform: ECR repo + lifecycle policy + image scanning
  🔧 Terraform: CodePipeline + GitHub App connection
  🔧 buildspec.yml: multi-stage Docker build + ECR push

UPCOMING ─────────────────────────────────────────────────────────────────────
  📋 Kubernetes manifests (deployment, service, ingress, HPA, configmap)
  📋 CodeDeploy rolling update integration with EKS
  📋 CloudWatch alarms + SNS notifications + dashboard
  📋 ECR vulnerability scan gate in pipeline (block on CRITICAL)
  📋 Blue/Green deployment strategy (production environments)
  📋 Manual approval gate before production deploy
  📋 Terraform remote state (S3 backend + DynamoDB locking)
  📋 Multi-environment pipeline (dev → staging → prod)
  📋 HTTPS / TLS via ACM + Route53 with custom domain
  📋 Helm chart for MedGrid application
  📋 Cost optimization (Spot instances for dev/staging nodes)
  📋 GitHub Actions parallel workflow (optional)
```

---

## ❓ FAQ & Troubleshooting

<details>
<summary><b>❓ Do I need to hardcode my AWS Account ID anywhere?</b></summary>

**No.** Set `aws_account_id` once in `infra/variables.tf`. Terraform uses this everywhere — ECR image URIs, IAM ARNs, S3 bucket names, resource tags. You never write it again.

</details>

<details>
<summary><b>❓ How do I deploy to a different region?</b></summary>

Change `aws_region` in `infra/variables.tf` and run `terraform apply`. All resources are created in the new region. No other file needs to be touched.

</details>

<details>
<summary><b>❓ How do I add a new environment variable to the app?</b></summary>

**Non-sensitive (e.g., LOG_LEVEL, FEATURE_FLAG):** Add to `k8s/configmap.yaml` and push to main. Pipeline redeploys automatically.

**Sensitive (passwords, API keys):**
```bash
# Store in SSM — never write it in any file
aws ssm put-parameter \
  --name "/medgrid/app/new-secret" \
  --value "secret-value" \
  --type "SecureString"

# Reference in k8s/deployment.yaml under env.valueFrom.secretKeyRef
# The actual value is never in the repo
```

</details>

<details>
<summary><b>❓ My CodeBuild fails with "ECR login denied"</b></summary>

The CodeBuild IAM role is missing ECR permissions. Check:
```bash
aws iam get-role-policy \
  --role-name medgrid-codebuild-role \
  --policy-name ECRAccess
```
If missing, run `terraform apply` again — Terraform will reconcile the IAM state.

</details>

<details>
<summary><b>❓ Pods are in CrashLoopBackOff after deploy</b></summary>

```bash
# 1. Check pod logs (previous container)
kubectl logs <pod-name> -n medgrid --previous

# 2. Check pod events
kubectl describe pod <pod-name> -n medgrid

# 3. Manually check liveness probe endpoint
kubectl exec -it <pod-name> -n medgrid -- curl localhost:8080/health
```

</details>

<details>
<summary><b>❓ How do I roll back to a previous version?</b></summary>

```bash
# Option 1: kubectl rollback (immediately reverts to previous deployment)
kubectl rollout undo deployment/medgrid-app -n medgrid

# Option 2: Redeploy a specific image version (by Git SHA)
kubectl set image deployment/medgrid-app \
  medgrid-app=<ECR_URI>:<PREVIOUS_GIT_SHA> -n medgrid

# Option 3: Git revert → push → pipeline auto-deploys the reverted commit
git revert HEAD
git push origin main
```

</details>

<details>
<summary><b>❓ How do I destroy everything?</b></summary>

```bash
# Delete K8s resources first (removes ALB/NLB so VPC can be destroyed cleanly)
kubectl delete -f k8s/ --all

# Destroy all Terraform-managed AWS infrastructure
cd infra/
terraform destroy
```

</details>

---

<div align="center">

---

### 👨‍💻 Author

**Pranav Daklepatil**

[![GitHub](https://img.shields.io/badge/GitHub-pranavdaklepatil-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/pranavdaklepatil)

---

<sub>
Built with ❤️ using AWS CodePipeline · CodeBuild · CodeDeploy · Amazon EKS · Amazon ECR · Terraform · Docker · Kubernetes
</sub>

<br/>

⭐ **If this project helped you, please give it a star!** ⭐

</div>