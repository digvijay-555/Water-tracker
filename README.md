# Water Tracker 💧
### Smart Water-Tanker Discovery, Community Demand Pooling & Live GPS Dispatch Platform

> **Hackathon Submission:** Built for resilient community water access in semi-arid and urban Indian localities.  
> **Demonstration Locality:** **Chhatrapati Sambhajinagar (Aurangabad), Maharashtra, India**.  
> **Architecture:** 100% Cloud-Native Serverless on Amazon Web Services (AWS Free-Tier eligible).

---

## 🚀 Core Platform Capabilities

1. **Nearby Tanker Discovery:** Discover available water tankers on an interactive Leaflet map with transparent capacities, pricing rates (₹/1,000L), water utility categories, and location freshness indicators.
2. **Community Demand Pooling:** Automatically matches neighboring households with overlapping delivery windows and compatible demands to combine multiple small orders into a single coordinated tanker delivery, unlocking volume discounts.
3. **Operator Dispatch Console:** Gives tanker operators clear controls to accept/reject booking assignments, manage vehicle operational states (`AVAILABLE`, `BUSY`, `EN_ROUTE`, `OFFLINE`), and advance the delivery lifecycle.
4. **Live GPS Telemetry Simulation:** Features a realistic GPS telemetry engine (`demoDriver.js`) that simulates realistic vehicle movement across Sambhajinagar road networks, with heading and speed calculations.
5. **Administrative Auditing & Shortage Monitoring:** Enables municipal and community administrators to identify stale telemetry (> 4h), audit rate card anomalies against fair pricing benchmarks (₹150 – ₹2,000 / 1,000L), and verify crowdsourced shortage alerts.
6. **Honesty & Truth in Communication:** Accurately labels simulated telemetry, clearly marks community reports as citizen submissions rather than municipal decrees, and avoids unsupported potability claims.

---

## 🛠️ Technology Stack & AWS Architecture

- **Frontend:** React 18, Vite 6, Leaflet 1.9, Pure CSS Design System (Light/Dark themes).
- **Edge CDN & Hosting:** Amazon CloudFront CDN with Origin Access Control (OAC) and Amazon S3 Bucket.
- **API Ingestion:** Amazon API Gateway (REST API with full CORS support).
- **Serverless Compute:** 12 AWS Lambda Functions running Node.js 20.x runtime.
- **Database:** 4 Amazon DynamoDB Tables (`PAY_PER_REQUEST` on-demand billing mode).
- **Automated Verification:** Pure JavaScript test runner with 141 passing assertions.

```
[ Client Browser ] ──HTTPS──> [ Amazon CloudFront CDN ] ──OAC──> [ Amazon S3 Web Bucket ]
       │
       └──REST API───────────> [ Amazon API Gateway ]
                                      │
                                      ▼
                           [ 12 AWS Lambda Handlers ]
                                      │
                                      ▼
                        [ 4 Amazon DynamoDB Tables ]
                        (Tankers, Requests, Bookings, Reports)
```

---

## ⚡ Quick Start: Local Development

### 1. Prerequisites
- **Node.js** v18+ or v20+ or v22+
- **npm** v9+

### 2. Run All Automated Test Suites (141+ Assertions)
```bash
npm test
```
*Runs backend validation, pricing, lifecycle, pooling matching tests, and resident web experience tests.*

### 3. Start Frontend Web Application
```bash
npm run dev:web
```
Open **[http://localhost:5174](http://localhost:5174)** in your browser.  
The application runs out of the box in self-contained **Demo Mode** with persistent local state.

### 4. Optional: Run Local REST Backend Server
```bash
# Terminal 1: Start local REST API on port 3001
npm run start:backend

# Terminal 2: Run frontend connected to local API
cd apps/web && VITE_USE_MOCK_API=false npm run dev
```

---

## ☁️ Production AWS Deployment

Deploy the full serverless stack to your AWS account in one command:

```bash
chmod +x scripts/deploy-aws.sh
./scripts/deploy-aws.sh
```

The script automatically:
1. Runs all 141+ unit & integration test assertions.
2. Builds and packages the 12 Lambda functions and CloudFormation SAM template.
3. Provisions 4 DynamoDB tables, API Gateway, S3 Bucket, and CloudFront distribution.
4. Seeds live demonstration tankers and shortage reports into DynamoDB.
5. Builds the production React bundle configured with the live API Gateway URL.
6. Syncs assets to Amazon S3 and invalidates CloudFront CDN cache.
7. Outputs your live **CloudFront URL** and **API Gateway Endpoint**.

👉 **For manual or AWS Amplify deployment instructions, see [docs/AWS_DEPLOYMENT_GUIDE.md](docs/AWS_DEPLOYMENT_GUIDE.md).**

---

## 🧪 End-to-End Verification Flow for Judges

1. **Resident Discovery:** Open the home page. Observe active tanker markers across Chhatrapati Sambhajinagar with live rates and verification status.
2. **Order Placement:** Click **"Book Tanker"** on Tanker 001. Choose 2,000 Litres and submit.
3. **Live Tracker:** The resident is taken to the 5-step Live Order Tracker showing status `Requested (OPEN)`.
4. **Operator Queue:** Switch to the **Operator Dispatch** console. The resident's booking is immediately displayed under the **"Pending"** tab.
5. **Accept Booking:** Click **`✓ Accept Booking`**. Status updates to `ACCEPTED`, and tanker changes to `BUSY`.
6. **Dispatch & Telemetry:** Click **`🚚 Start Delivery (Mark En Route)`**. Simulated telemetry starts, updating tanker GPS in real time.
7. **Resident Live Sync:** Return to the Resident tab: the tracker updates to `En Route`, tracking vehicle coordinates live on the map.
8. **Delivery Completion:** On the Operator console, click **`✓ Confirm Delivery Complete`**. Booking marks `DELIVERED`, and tanker returns to `AVAILABLE`.
9. **City Admin Audit:** Switch to the **City Admin** dashboard: the **Active Orders** KPI updates, fleet status reflects available capacity, and the order is audited under **All Platform Bookings**.

---

## 📁 Repository Structure

```
water-tracker/
├── template.yaml                  # Root AWS SAM Infrastructure Template (Full Stack)
├── package.json                   # Root package manager & scripts
├── apps/
│   └── web/
│       ├── index.html             # React SPA entry HTML
│       ├── package.json           # Frontend dependencies (React 18, Vite 6, Leaflet)
│       ├── vite.config.js         # Vite configuration
│       ├── src/
│       │   ├── main.jsx           # App bootstrap
│       │   ├── App.jsx            # Multi-portal router & auth switcher
│       │   ├── pages/
│       │   │   ├── ResidentPage.jsx  # Resident discovery & booking portal
│       │   │   ├── OperatorPage.jsx  # Tanker operator dispatch console
│       │   │   └── AdminPage.jsx     # City administration & audit console
│       │   ├── components/
│       │   │   ├── resident/      # Map, TankerCard, Modals, Timeline
│       │   │   ├── operator/      # Dispatch list, Trip banner, GPS controls
│       │   │   └── admin/         # Fleet table, Audit table, Shortage reports
│       │   └── services/          # API adapters & simulated GPS telemetry driver
│       └── tests/
│           └── resident.test.js   # Automated resident experience tests
├── backend/
│   ├── template.yaml              # Backend SAM template
│   ├── package.json               # Backend dependencies (@aws-sdk)
│   ├── src/                       # 12 Lambda handlers & shared database layer
│   └── tests/                     # 141+ backend test runner & assertions
├── shared/
│   └── types.js                   # Shared contracts, enums & price bounds
├── scripts/
│   ├── deploy-aws.sh              # 1-Click AWS production deployment script
│   ├── seed-demo-data.js          # Demonstration seed data generator
│   └── seed-aws.js                # Live DynamoDB table seeder
└── docs/
    ├── AWS_DEPLOYMENT_GUIDE.md    # Step-by-step AWS deployment manual
    ├── ARCHITECTURE.md            # Deep-dive architecture & data models
    ├── API_CONTRACT.md            # Complete REST API specifications
    └── TEST_PLAN.md               # Quality assurance & verification plan
```

---

## 📄 License
ISC License — Water Tracker Engineering Team
