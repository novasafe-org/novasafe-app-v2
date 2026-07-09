# AWS App Deployment

Deploy **app.novasafe.io** to **AWS S3 + CloudFront** in parallel with the existing Docker/Nginx production deployment.

## Workflow

`.github/workflows/deploy-aws.yml` → `novasafe-deployment/deploy-frontend-aws.yml`

## Configuration

### Repository Variables

| Variable | Example |
|----------|---------|
| `AWS_ROLE_ARN` | `arn:aws:iam::793239449172:role/NovaSafeGitHubDeployRole` |
| `AWS_REGION` | `ap-south-1` |

### Environment Variables

Settings → Environments → **production** → **Environment variables**

| Variable | Example |
|----------|---------|
| `VITE_APP_URL` | `https://app.novasafe.io` |
| `VITE_AUTH_URL` | `https://start.novasafe.io` |
| `VITE_LANDING_URL` | `https://novasafe.io` |
| `VITE_API_URL` | `https://mobile-api.novasafe.io` |
| `VITE_APP_VERSION` | `1.1.0` |

### Stack outputs (update `deploy-aws.yml` after CDK deploy)

| Field | Source |
|-------|--------|
| `s3-bucket` | `AppBucketName` from `novasafe-prod-app` |
| `cloudfront-distribution-id` | `AppDistributionId` |

## Deploy sequence

1. **novasafe-deployment** → Deploy Infrastructure → **App**
2. Add ACM DNS validation CNAMEs in Cloudflare for `app.novasafe.io`
3. Point `app.novasafe.io` CNAME → CloudFront domain (DNS only)
4. Update `cloudfront-distribution-id` in `deploy-aws.yml`
5. Run **Deploy AWS** in this repo

## Note

App uses TanStack Start (SSR in Docker). The AWS path uploads the **client bundle** and `runtime-config.js`. Full SSR parity with Docker may require future Lambda hosting.
