# WaterSaathi — Complete AWS Deployment & Verification Runbook

This guide details the complete roadmap and step-by-step instructions to take **WaterSaathi** from independent modules to a unified production deployment on AWS.

---

## 📋 Pre-Flight Checklist

Before deploying to the cloud:
1. **Node.js**: Node 18+ or 20+ installed.
2. **AWS CLI**: Installed and configured (`aws configure` with AWS Access Key, Secret Key, and Region `ap-south-1`).
3. **AWS SAM CLI**: Installed (`sam --version`).
4. **Git Repository**: Pushed to GitHub.

---

## 🔄 Phase 1: Local Pre-Flight Integration Verification

Verify all 3 modules talk to each other locally before deploying to AWS.

### 1. Start Local Backend Server
```bash
cd backend
node src/local-server.js
```
*Listens on `http://localhost:3001` with an in-memory database pre-seeded with Chhatrapati Sambhajinagar records.*

### 2. Run Local Frontend Against Backend
In a separate terminal:
```bash
cd apps/web

# Ensure environment targets local backend
echo "VITE_USE_MOCK_API=false" > .env.local
echo "VITE_API_BASE_URL=http://localhost:3001" >> .env.local

npm install
npm run dev
```
Open `http://localhost:5174` in your browser.

### 3. Execute the 12-Step E2E Scenario
1. **Resident Page**: Select Cidco Sector N-5; verify nearby tankers render on the Leaflet map.
2. **Create Request**: Submit a request for 1,000L.
3. **Pooling**: View pooling suggestion with nearby household; review transparent quoted share.
4. **Operator Page**: Switch navbar to Operator; observe pending booking.
5. **Accept Booking**: Click Accept; verify status transitions to `ACCEPTED` and tanker capacity decrements.
6. **En Route**: Click "Mark En Route"; observe status `EN_ROUTE`.
7. **Simulate Movement**: Toggle "Start Driver Simulation"; verify GPS coordinates update on map and telematics panel.
8. **Delivery Complete**: Mark delivery complete (`DELIVERED`).
9. **Admin Page**: Verify completed booking appears in the audit log; review shortage reports.
10. **Persistence Check**: Refresh the page; verify all state remains intact.

---

## ☁️ Phase 2: Deploy Backend to AWS (AWS SAM)

The backend uses serverless architecture defined in `backend/template.yaml` (DynamoDB On-Demand + Lambda Node.js 20.x + API Gateway REST API).

### 1. Build SAM Application
```bash
cd backend
sam build
```

### 2. Guided Deployment
```bash
sam deploy --guided
```
When prompted:
- **Stack Name**: `watersaathi-backend`
- **AWS Region**: `ap-south-1` (Mumbai - lowest latency for Indian users)
- **Confirm changes before deploy**: `Y`
- **Allow SAM CLI to create IAM roles**: `Y`
- **Disable rollback**: `N`
- **Save arguments to configuration file**: `Y` (creates `samconfig.toml`)

### 3. Capture CloudFormation Outputs
When the deployment succeeds, SAM prints the outputs:
- `WaterSaathiApiEndpoint`: e.g. `https://a1b2c3d4e5.execute-api.ap-south-1.amazonaws.com/Prod/`
- `TankersTableName`: `WaterSaathi-Tankers-watersaathi-backend`
- `RequestsTableName`: `WaterSaathi-Requests-watersaathi-backend`
- `BookingsTableName`: `WaterSaathi-Bookings-watersaathi-backend`
- `ShortageReportsTableName`: `WaterSaathi-ShortageReports-watersaathi-backend`

---

## 🗄️ Phase 3: Seed Real AWS DynamoDB Tables

Once the tables exist in AWS, seed the initial demonstration records:

```bash
cd ..
AWS_REGION=ap-south-1 \
USE_IN_MEMORY_DB=false \
NODE_ENV=production \
TANKERS_TABLE=WaterSaathi-Tankers-watersaathi-backend \
REQUESTS_TABLE=WaterSaathi-Requests-watersaathi-backend \
BOOKINGS_TABLE=WaterSaathi-Bookings-watersaathi-backend \
REPORTS_TABLE=WaterSaathi-ShortageReports-watersaathi-backend \
node scripts/seed-demo-data.js
```

---

## 🌐 Phase 4: Deploy Frontend to AWS Amplify Hosting

The frontend repository includes pre-configured [`amplify.yml`](file:///home/deceptor/code/Thirsty/amplify.yml) build instructions.

### Option A: Via AWS Amplify Console (Recommended - CI/CD)
1. Open the [AWS Amplify Console](https://ap-south-1.console.aws.amazon.com/amplify/home?region=ap-south-1).
2. Click **Host web app** &gt; Choose **GitHub** &gt; Authenticate and select your repository.
3. Select branch: `main`.
4. Monorepo settings:
   - Check **"My app is a monorepo"** &gt; Set root folder to `apps/web`.
5. Under **Build settings**, verify Amplify detected [`amplify.yml`](file:///home/deceptor/code/Thirsty/amplify.yml).
6. Under **Environment variables**, add:
   - `VITE_USE_MOCK_API` = `false`
   - `VITE_API_BASE_URL` = `https://a1b2c3d4e5.execute-api.ap-south-1.amazonaws.com/Prod` (Your actual API Gateway URL captured in Phase 2)
7. Click **Save and Deploy**.
8. Amplify will build Vite, bundle assets, and provide a public HTTPS URL (e.g. `https://main.d123456789.amplifyapp.com`).

### Option B: Manual Static Hosting (S3 + CloudFront / Amplify Drag & Drop)
If you prefer manual upload:
```bash
cd apps/web
VITE_USE_MOCK_API=false VITE_API_BASE_URL=https://a1b2c3d4e5.execute-api.ap-south-1.amazonaws.com/Prod npm run build
```
Drag the resulting `apps/web/dist` folder into Amplify Hosting's manual deployment page.

---

## 🔒 Phase 5: Production CORS Configuration

By default, `backend/template.yaml` permits `*` origins for demonstration. To restrict CORS to your deployed Amplify domain:

1. In `backend/template.yaml`, update `CORS_ALLOW_ORIGIN` or set the environment variable:
   ```yaml
   CORS_ALLOW_ORIGIN: "https://main.d123456789.amplifyapp.com"
   ```
2. Re-deploy backend:
   ```bash
   cd backend
   sam deploy
   ```

---

## 💰 Phase 6: Cost Management & Free-Tier Guardrails

All services chosen fall within AWS Free Tier limits for standard usage:
- **AWS Lambda**: 1,000,000 requests/month free.
- **Amazon DynamoDB**: 25 GB storage + 25 WCU/RCU free under On-Demand / Pay-per-request.
- **Amazon API Gateway**: 1,000,000 REST calls/month free in initial tier.
- **AWS Amplify Hosting**: 1,000 build minutes/month + 15 GB served free.

### Setting Up a Budget Alert
1. In the AWS Console, search for **AWS Budgets**.
2. Click **Create a budget** &gt; Select **Zero spend budget** or set a threshold of **$5.00 USD**.
3. Configure your email address for alerts.

---

## 🧹 Phase 7: Teardown & Resource Deletion

When the demonstration or testing phase is complete, delete all cloud resources to ensure zero ongoing costs:

```bash
# 1. Delete Backend CloudFormation stack and all DynamoDB tables
cd backend
sam delete --stack-name watersaathi-backend --region ap-south-1

# 2. Delete Amplify Application
# From AWS Amplify Console: App settings > General > Delete app
```
