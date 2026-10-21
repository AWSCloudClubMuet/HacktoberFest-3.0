# Evergreen Submission — ScaleOps, saa-wak and HelpDeskNet-50K

This submission contains three complementary projects: an AWS auto-scaling and observability
platform, an agricultural marketplace for Sindh, and a research workflow for noisy-label
customer-support classification.

| Part | Folder | What it is |
|---|---|---|
| **Workload + infrastructure** | [`scaleops-demo/`](scaleops-demo) | Next.js app deployed with Terraform behind an Application Load Balancer and an Auto Scaling group of EC2 instances, with k6 load tests and a CI/CD pipeline. |
| **Monitoring dashboard** | [`scaleops/`](scaleops) | **ScaleOps**: multi-user Next.js dashboard that reads EC2, Auto Scaling, ELB and CloudWatch data and never changes anything in AWS. |
| **Agricultural marketplace** | [`saa-wak system/`](saa-wak%20system) | **saa-wak (ساوڪ)**: React/Vite experience for crop prices, market comparison, alerts, listings and profit estimates. |
| **ML research dashboard** | [`HelpDeskNet-50K/`](HelpDeskNet-50K) | **HelpDeskNet-50K**: Python workflow for noisy-label analysis, robust text classification and review prioritization on customer-support tickets. |

- Live workload (ALB): <http://scaleops-demo-hackathon-alb-559383597.us-east-1.elb.amazonaws.com> (`/api/health`, `/api/info`)
- Live dashboard (Vercel): _add the Vercel URL here after deploying_

## Quick start by project

### saa-wak

saa-wak helps farmers and buyers explore fictional crop prices for Hyderabad, Sukkur and
Mirpur Khas, compare 14-day trends, manage demo listings and estimate potential sale outcomes.
The frontend is a React + TypeScript + Vite demo; its default data is local and stored in the
browser. An optional Express + Prisma + PostgreSQL backend provides authentication, crop and
market APIs, listings, alerts, conversations, Socket.IO messaging and Gemini routes.

```powershell
cd "saa-wak system\frontend"
npm install
npm run dev
# Open http://localhost:5173
```

For the optional API, copy `saa-wak system\Backend\.env.example` to `.env`, configure
`DATABASE_URL`, `JWT_SECRET` and `FRONTEND_ORIGIN`, then run:

```powershell
cd "saa-wak system\Backend"
npm install
npm run prisma:generate
npm run prisma:migrate:dev
npm run dev
# API health: http://localhost:5000/api/v1/health
```

The frontend demo uses fictional sample prices; it is not a live or official market data
service. See [`saa-wak system/README.md`](saa-wak%20system/README.md) for the complete feature
reference and limitations.

### HelpDeskNet-50K

HelpDeskNet-50K studies label quality in customer-support ticket classification. It loads and
audits up to 50,000 records, maps source categories to six target classes, simulates controlled
label noise when verified human labels are unavailable, compares baseline and noise-aware models,
prioritizes a 2,000-ticket review budget, and presents results in Streamlit.

```powershell
cd HelpDeskNet-50K
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e ".[dev]"
python -m pytest -q
python -m src.pipeline --data-config configs/data.yaml --exp-config configs/experiment.yaml
streamlit run app/Home.py
```

The verified workflow combines 61,765 raw rows, deduplicates the source data, samples 50,000
unique texts, and uses 40,000/5,000/5,000 train/validation/test partitions. The audited local
test result is **153 passed**. Results use source-derived proxy labels and synthetic corruption,
not independently verified ground truth; do not interpret simulated review yield as a real-world
source-label error rate. See [`HelpDeskNet-50K/README.md`](HelpDeskNet-50K/README.md) and the
[final verification report](HelpDeskNet-50K/docs/FINAL_VERIFICATION_REPORT.md).

### ScaleOps

ScaleOps observes the separate AWS workload below. It never creates, scales, restarts or deletes
AWS resources. The dashboard reads EC2, Auto Scaling, ALB and CloudWatch telemetry using a
dedicated read-only IAM policy, stores connected credentials encrypted in PostgreSQL, and
exports timestamped evidence JSON.

```powershell
cd scaleops
npm install
copy .env.example .env.local
# Set DATABASE_URL and generate ENCRYPTION_KEY with:
npm run gen:key
npm run db:migrate
npm run dev
# Open http://localhost:3000/signup
```

See [`scaleops/README.md`](scaleops/README.md) for the IAM policy, security model, routes,
tests and Vercel deployment instructions.

## Architecture

```
            k6 load test
                 │
                 ▼
   Internet ──► Application Load Balancer (HTTP :80, 2 AZs)
                 │  health check: GET /api/health  (every 15 s)
                 ▼
        Target group (port 3000)
                 │
                 ▼
   Auto Scaling group (min 1 · desired 1 · max 3, t3.micro, Amazon Linux 2023)
     └─ launch template → user-data installs Node 20, pulls the release from S3, starts a systemd service
                 │
   CloudWatch ◄──┘  CPUUtilization (target tracking policy), RequestCount, TargetResponseTime,
                    group metrics (GroupInServiceInstances, ...)
                 │
                 ▼  read-only IAM keys
        ScaleOps dashboard (Vercel + PostgreSQL)
```

How the pieces interact: the ALB spreads requests over healthy instances only. The target-tracking policy
keeps the group's average CPU near the target by adding instances when load rises and removing them when it
falls. The ASG uses the ALB health check (`health_check_type = "ELB"`), so an instance that fails the health
check is replaced. CloudWatch stores the metrics; ScaleOps reads them.

## Milestone coverage

| # | Milestone | Where it is done |
|---|---|---|
| 1 | Application setup, baseline | `scaleops-demo/app` (`/api/health`, `/api/info`, `/api/metrics`, bounded `/api/workload`); baseline test `tests/k6-baseline.js` (5 VUs, 2 min) |
| 2 | Load balancer | `terraform/main.tf`: ALB, target group, health check, listener; EC2 security group accepts port 3000 **only from the ALB** |
| 3 | Auto Scaling | `terraform/main.tf`: launch template, ASG (min 1 / desired 1 / max 3), CPU target-tracking policy |
| 4 | Load simulation | `tests/k6-rampup.js`: 1 min warm-up → 3 min ramp to 10 VUs → 5 min sustain → 2 min ramp-down → 1 min cool-down |
| 5 | Scaling analysis | [Scaling analysis](#scaling-analysis) below |
| 6 | Health monitoring | ScaleOps (target health, instance state, CloudWatch metrics, scaling activities) and `scaleops/scripts/capture-evidence.ps1` |
| 7 | Cost & reliability | [Cost and reliability](#cost-and-reliability) and [Cleanup](#safe-cleanup) below |
| 8 | Visualization | ScaleOps: request volume, CPU, response time, instance count, scaling events, healthy/unhealthy targets |
| 9 | AWS integration | EC2 + ALB + EC2 Auto Scaling + CloudWatch, all provisioned by Terraform; scale-out demonstrated with the k6 ramp-up test |

## Workload application

A small Next.js app (standalone build). Endpoints:

- `GET /api/health`: liveness used by the ALB.
- `GET /api/info`: which instance answered (`instanceId`, AZ, version); after a scale-out, repeated calls return different instance IDs.
- `GET /api/metrics`: simple request counters.
- `GET /api/workload?durationMs=N`: bounded CPU work used to create load. It is **disabled unless `WORKLOAD_ENABLED=true`** (set on the EC2 instances only), limited to 20 s by default (hard ceiling 30 s) and 3 concurrent requests per instance, and yields to the event loop so health checks keep answering.

## Infrastructure (Terraform)

- VPC `10.0.0.0/16`, two public subnets in different AZs, internet gateway.
- Security groups: ALB accepts HTTP from the internet; instances accept the app port only from the ALB security group.
- IAM role for instances: read access to the artifact bucket and the CloudWatch agent policy. No broad permissions.
- Launch template: Amazon Linux 2023, `t3.micro`, IMDSv2 required, encrypted gp3 root volume, detailed (1-minute) monitoring.
- Target group health check: `/api/health`, every 15 s, healthy after 2 successes, unhealthy after 3 failures, deregistration delay 30 s.
- ASG: min 1, desired 1, max 3, ELB health checks, 420 s health-check grace period, group metrics enabled.
- Scaling policy: target tracking on average CPU, target **40 %**, instance warm-up 120 s.

## CI/CD

`.github/workflows/deploy.yml` builds the Next.js standalone bundle, uploads a versioned artifact to S3,
runs `terraform apply`, starts an ASG instance refresh and finally checks `/api/health` through the ALB.
It creates the S3 state bucket, lock table and artifact bucket on first run. A deployment can be rolled back
by running the workflow manually with an earlier commit SHA. `infrastructure.yml` is a manual workflow for
`plan`, `apply` and `destroy`.

## Running the load test

```bash
# baseline
k6 run tests/k6-baseline.js -e ALB_URL=http://<alb-dns-name>
# ramp-up (triggers scale-out), about 12 minutes
k6 run tests/k6-rampup.js   -e ALB_URL=http://<alb-dns-name>
```

Watch the ASG's desired capacity, the scaling activities and the ScaleOps dashboard while it runs.
Scale-in with target tracking starts only after CPU has stayed below the target for roughly 15 minutes, so
keep watching after the test ends.

## ScaleOps dashboard

Next.js 16 · React 19 · TypeScript · PostgreSQL · AWS SDK v3.

- Email and password accounts (scrypt hashes, random session tokens stored only as SHA-256, HttpOnly cookies).
- After sign-in a user connects **read-only IAM access keys**; keys are verified with AWS and stored
  **AES-256-GCM encrypted** (bound to the owning user). One connection per user, keys never reach the browser.
- Pages: Dashboard, Infrastructure, Scaling events. **Export evidence JSON** saves the current metrics,
  capacity, target health and scaling events with timestamps.
- Honest data only: missing CloudWatch datapoints are shown as gaps, never as zero; `RequestCount` is a count per
  period, and `TargetResponseTime` is target latency, not end-to-end latency.

See [`scaleops/README.md`](scaleops/README.md) for setup, the IAM policy and Vercel deployment.

## Results observed

During the k6 ramp-up test the Auto Scaling group **scaled out**: a second EC2 instance was launched and
registered with the ALB. Screenshots of the ASG activity and the ScaleOps dashboard, and the exported
evidence JSON, are attached to the submission.

## Scaling analysis

How to read the behaviour of the current configuration, and what to tune:

- **Why scale-out is not instant.** CloudWatch needs several one-minute datapoints above the target before
  target tracking acts, then a new instance still has to boot, install Node, download the release and pass two
  health checks (about 5 to 8 minutes in total). New instances are excluded from the metric during the 120 s warm-up,
  which prevents over-scaling ("too often").
- **Why the CPU target is 40 %.** The workload runs in a single Node.js thread on a 2-vCPU `t3.micro`, so one process cannot push the
  instance's average CPU much above 50 %. A 50 % target would risk never triggering.
- **Scale-in is deliberately slow.** Target tracking scales in conservatively to avoid flapping.
- **Recommendations.** (1) Bake Node and the app into an AMI to cut start-up time from minutes to seconds.
  (2) Add a request-count-per-target policy next to CPU so scaling reacts to traffic as well as CPU.
  (3) Use at least 2 instances across 2 AZs in production. (4) Keep warm-up at least as long as the real start-up time.

## Cost and reliability

- **Cost grows with instance count.** Baseline cost is the minimum capacity (1 instance) plus the ALB, which is billed
  per hour; the maximum capacity (3) caps the worst-case instance bill at 3 times the baseline. Check current prices on the AWS pricing pages.
- **Minimum capacity** trades cost for availability: min 1 is cheapest but a single point of failure, and deployments cause a short
  outage while the only instance is replaced; min 2 across two AZs removes that at roughly double the baseline instance cost.
- **Maximum capacity** protects the budget and the application's dependencies from runaway scaling.
- **Avoiding unnecessary scaling:** warm-up time, a realistic CPU target, and slow scale-in.
- **Protecting the app from excessive load:** the workload endpoint is disabled by default and bounded in duration and concurrency;
  the ALB only forwards to healthy targets; instances are reachable only through the ALB.

## Safe cleanup

Resources keep costing money until removed. After testing:

1. Run the **Infrastructure** workflow with action `destroy` (or `terraform destroy` with the same backend settings).
   This removes the ALB, ASG, launch template, security groups, IAM role and VPC in the right order.
2. Optionally delete the buckets and lock table that the pipeline created outside Terraform
   (`scaleops-tf-state-<account>`, `scaleops-artifacts-<account>`, `scaleops-tf-locks`); the state and artifact buckets are versioned, so delete all versions first.
3. Verify in the AWS console that no instances, load balancers or Elastic IPs remain.

## Security notes

No secrets are committed (`.env*`, `terraform.tfvars` and state files are git-ignored). The dashboard only needs
read-only permissions (Auto Scaling, EC2, ELBv2 and CloudWatch describe/get calls). The workload endpoint exists only for load testing.
