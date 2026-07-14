# AWS App Deployment

Deploy **app.novasafe.io** as **TanStack Start SSR on AWS Lambda** (zip, no ECR) behind CloudFront.

## Architecture

```
Browser → CloudFront → Lambda Function URL (zip SSR) → mobile-api
```

## Prerequisites

1. **App** CDK stack deployed (`novasafe-prod-app`) with zip Lambda + CloudFront
2. Repository variables: `AWS_ROLE_ARN`, `AWS_REGION` (`ap-south-1`)
3. ACM DNS validation + Cloudflare CNAME for `app.novasafe.io`
4. IAM role: `lambda:UpdateFunctionCode`, `cloudfront:CreateInvalidation`

## Deploy sequence

1. **novasafe-deployment** → Deploy Infrastructure → **App**
2. Copy `AppDistributionId` and `AppDistributionDomainName` from stack outputs
3. Update `CLOUDFRONT_DISTRIBUTION_ID` in `.github/workflows/deploy-aws.yml`
4. Point `app.novasafe.io` CNAME → new CloudFront domain (if distribution was recreated)
5. Run **Deploy AWS** in this repo

## Stack outputs

| Output | Use |
|--------|-----|
| `AppLambdaFunctionName` | `novasafe-prod-fn-app` |
| `AppDistributionId` | CloudFront invalidation in deploy-aws.yml |
| `AppDistributionDomainName` | Cloudflare CNAME target |

## Migrating from static S3

The App stack previously used S3-only hosting (`AccessDenied` on empty bucket). Redeploying **App** CDK switches CloudFront origin to Lambda. Then run **Deploy AWS** to upload the SSR zip.
