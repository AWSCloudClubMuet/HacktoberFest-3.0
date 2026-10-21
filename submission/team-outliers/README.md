# Campus Gig & SkillSwap Portal

## Team Member # 2

A modern, student-centric marketplace web application where university students offer specialized skills, request short-term assistance for payment or reciprocal skill exchange, and earn verified peer reputation through completed campus gigs.

---

## 👥 Team Information

- **Team Name:** Outliers
- **Branch:** `team-outliers`

---

## 🎯 Problem Statement Fulfillment

The project fully satisfies all specifications in `problemStatement.md`:

### 🧩 Milestone 1 — Profiles & Gig Creation

- ✅ **Role-Flexible Personas:** Any student can act as a **Poster** or **Applicant** dynamically depending on the gig.
- ✅ **Rich Student Profiles:** Displays name, major, semester, bio, peer-endorsed skills, gigs posted count, gigs completed count, and dynamic average rating.
- ✅ **Validated Gig Creation:** Full support for **Offering** and **Requesting** gigs across **Programming**, **Design**, **Writing**, and **Tutoring** categories.
- ✅ **Flexible Compensation:** Supports **Paid** (with configurable USD budget), **SkillSwap** (skill barter), and **Free** (volunteer/campus contribution).

### 🧩 Milestone 2 — Discovery & Applications

- ✅ **Bento Grid Marketplace:** Asymmetric, modular grid cards designed for fast scanning and visual appeal.
- ✅ **Multi-Facet Filtering:** Filter in real-time by category, Offering/Requesting type, payment type, budget range, and status.
- ✅ **Keyword Search:** Real-time search across gig titles and descriptions.
- ✅ **Validated Application Submission:** Submit customized pitches to gig owners.
- ✅ **Business Rule Enforcement:** Prevents duplicate applications and blocks self-applications to a user's own gig.
- ✅ **Automated Expiry:** Gigs past their deadline date while still Open automatically appear as **Expired**.

### 🧩 Milestone 3 — Applicant Selection & Status

- ✅ **Owner-Only Governance:** Only the student who posted the gig can review and accept applicants or advance statuses.
- ✅ **Automated Acceptance Cascade:** Accepting one applicant automatically changes the gig status to **In Progress**, auto-rejects all remaining pending applications, and locks the gig from receiving new submissions.
- ✅ **Strict State Machine:** Strictly enforces `Open → In Progress → Completed`. A gig can only transition to `Completed` from `In Progress`.

### 🧩 Milestone 4 — Mutual Reviews & Reputation

- ✅ **Bidirectional Feedback:** Once a gig is marked Completed, both the owner and the accepted applicant can rate each other (1 to 5 stars) and leave comments.
- ✅ **One-Review Guarantee:** Enforces exactly one review per reviewer per completed gig.
- ✅ **Dynamic Reputation Engine:** Profile average star ratings are calculated mathematically from stored peer reviews rather than manual entry.

### 🧩 Milestone 5 — Mock API & Seed Data

The UI never touches storage directly: every read and write goes through `fetch()` to the mock REST API (Next.js route handlers backed by `src/lib/server/store.ts`). The server is the single source of truth; data is seeded on first start, kept in memory, and mirrored to `.data/db.json` for local runs (`POST /api/reset` restores the seed).

- ✅ **Endpoints** (errors use proper status codes: 400 validation, 403 not allowed, 404 missing, 409 state conflict)
  - `GET /api/gigs?category=&type=&payment_type=&status=&q=&min_budget=&max_budget=&user_id=`
  - `POST /api/gigs` · `GET /api/gigs/:id` · `PATCH /api/gigs/:id` (`{ owner_id, status: "Completed" }`)
  - `GET /api/applications?gig_id=&applicant_id=` · `POST /api/applications`
  - `PATCH /api/applications/:id` (`{ owner_id, action: "accept" | "reject" }`)
  - `GET /api/reviews?gig_id=&user_id=` · `POST /api/reviews`
  - `GET /api/users` · `GET /api/users/:id` (profile + stats computed from stored reviews) · `POST /api/reset`
- ✅ **Seed data:** 12 users, 26 gigs (all 5 statuses, all 4 categories, both types), 21 applications, 8 reviews
- ✅ **Self-check:** with the server running, `node scripts/smoke-test.mjs` exercises every milestone rule over HTTP (32 checks)

---

## 🎨 Visual Identity & Bento Grid Direction

- **Base Surface:** Warm off-white / cream (`#fbf9f5`) to foster a welcoming campus atmosphere.
- **Typography:**
  - **Headings:** Montserrat ExtraBold (weight 800) for a confident, structured hierarchy.
  - **Body Content:** Merriweather serif for comfortable reading of detailed pitches and reviews.
- **Palette System:**
  - **Primary Brand:** Warm Amber/Gold (`#d97706`)
  - **Programming:** Trust Blue
  - **Design:** Creative Rose
  - **Writing:** Growth Emerald
  - **Tutoring:** Academic Purple
- **Bento Grid Composition:** Asymmetric card layouts with varied spans (e.g. 3-col hero, 1-col metric pulse, category tiles) responsive across desktop, laptop, tablet, and mobile.

---

## 🛠️ Technology Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS v4 with warm design tokens
- **Component Primitives:** shadcn/ui inspired accessible components (Button, Badge, Card, Dialog, Tabs, Input, Textarea, Select, Avatar, BentoGrid)
- **Runtime Environment:** Node.js v22 LTS

---

## 🚀 Setup & Running Instructions

### 1. Prerequisites

- Node.js (v20+ or v22 LTS recommended)
- npm (v10+)

### 2. Navigate to Project Directory

```bash
cd "submission/team-outliers/Campus Gig & SkillSwap Portal"
```

### 3. Run the Production Server

```bash
# Build the application
npm run build   # Or: node ./node_modules/next/dist/bin/next build

# Start the server (runs on port 3001)
node ./node_modules/next/dist/bin/next start -p 3001
```

### 4. Or Run Development Server

```bash
node ./node_modules/next/dist/bin/next dev -p 3001
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

---

## 🔄 Persona Switcher (Mock Authentication)

To test both sides of the marketplace (posting vs applying and mutual reviewing):

1. Click the **"Switch Role"** button in the top navigation bar.
2. Select any of the 12 student personas (e.g. Aiden Vance, Maya Lin, Carlos Mendez, Sarah Jenkins).
3. The interface immediately reflects the active user's permissions, posted gigs, and applications!



---


# Debugging, Attention Gradients & Evaluation

## Team Member 3

This submission is a collection of four Jupyter notebooks exploring practical
machine-learning engineering topics. Together, they cover how to debug a
misbehaving tabular classifier, derive and verify the gradients in scaled
dot-product attention, evaluate a highly imbalanced fraud detector when labels
arrive late, and diagnose common train/validation learning-curve patterns.

The notebooks are organized under
[`Debugging, Attention Gradients & Evaluation/`](./Debugging%2C%20Attention%20Gradients%20%26%20Evaluation/).
They are milestone-based exercises and worked analyses, not a packaged,
end-to-end application or a deployed model.

## Contents

| Milestone | Notebook | Focus |
| --- | --- | --- |
| 1 | [Debug a Silently Failing Training Run](./Debugging%2C%20Attention%20Gradients%20%26%20Evaluation/%20Milestone%201%20%E2%80%94%20Debug%20a%20Silently%20Failing%20Training%20Run.ipynb) | Repairing and investigating a binary-classification training pipeline |
| 2 | [Derive and Implement a Gradient](./Debugging%2C%20Attention%20Gradients%20%26%20Evaluation/Milestone%202%20%E2%80%94%20Derive%20and%20Implement%20a%20Gradient.ipynb) | Scaled dot-product attention forward and backward passes, with numerical gradient checks |
| 3 | [Design an Evaluation Strategy](./Debugging%2C%20Attention%20Gradients%20%26%20Evaluation/%20Milestone%203%20%E2%80%94%20Design%20an%20Evaluation%20Strategy.ipynb) | Metrics, time-based evaluation, delayed labels, costs, calibration, and drift for fraud detection |
| 4 | [Diagnosing Learning Curves](./Debugging%2C%20Attention%20Gradients%20%26%20Evaluation/Milestone%204%3A%20Diagnosing%20Learning%20Curves.ipynb) | Interpreting four train/validation patterns and selecting follow-up experiments |

## Milestone 1 — Debug a Silently Failing Training Run

### Problem

The notebook starts from a binary classifier for a 10,000-row tabular dataset.
The presented symptom is steadily decreasing training loss while validation
accuracy remains around 55% and fluctuates between epochs. The exercise
identifies problems in the data pipeline, model setup, training loop, validation
procedure, and learning-rate schedule.

### Methods and corrections represented

- Load tabular data with pandas and separate the target label.
- Use a reproducible, stratified 80/20 training/validation split with
  `train_test_split`.
- Fit `StandardScaler` on the training features only, then use that fitted
  scaler to transform both splits, avoiding validation-data leakage into
  preprocessing statistics.
- Convert feature and label arrays to PyTorch tensors, combine them with
  `TensorDataset`, and create batched `DataLoader`s. Shuffle training batches
  through the loader so that features remain paired with their labels; keep
  validation batches in a stable order.
- Use a two-class feed-forward network with a linear layer, batch
  normalization, ReLU, dropout, and a two-logit output layer. The proposed
  ordering places batch normalization before the activation and dropout.
- Use `CrossEntropyLoss` for the two-class logits and Adam for optimization.
- Replace per-batch `StepLR` updates, which would decay the rate too rapidly,
  with a 50-epoch cosine-annealing schedule advanced once per epoch.
- Set evaluation mode for validation and perform validation under
  `torch.no_grad()`, while tracking loss and accuracy for both splits.
- Outline further diagnostic experiments: establish a majority-class
  baseline, compare training and validation metrics, test whether the model can
  overfit a small sample, and compare a fixed learning rate with the scheduler.

### Outcome and interpretation

The notebook records a corrected-pipeline example and a debugging plan. It
does **not** include a dataset, completed training logs, or measured final
validation results, so it does not establish a particular accuracy improvement
or prove that the initial 55% symptom was resolved on real data. The data path
is intentionally a placeholder (`"data path"`).

The example code should be treated as a starting point rather than a
drop-in-verified training script: the label column should be excluded from
features before splitting/scaling; the training accuracy counters need
initializing/resetting in the epoch loop; and validation loss/accuracy should
be accumulated against each validation batch's labels instead of comparing a
batch of logits with the full validation-label tensor. These are documented
here for clarity; the notebook itself has not been changed.

## Milestone 2 — Derive and Implement a Gradient

### Attention formulation

The notebook considers scaled dot-product attention:

```text
S = Q Kᵀ / √dₖ
P = softmax(S)             (row-wise)
O = P V
```

Here, `Q`, `K`, and `V` are query, key, and value matrices, `dₖ` is the key
dimension, `P` is the row-wise attention-probability matrix, and `O` is the
attention output.

### Derivation and implementation

The written derivation and NumPy implementation cover the gradients from an
upstream output gradient `dO` back to the values, probabilities, scores,
queries, and keys:

- `dV = Pᵀ dO`
- `dP = dO Vᵀ`
- For each row, the softmax-vector-Jacobian product is
  `dS = P ⊙ (dP - sum(P ⊙ dP))`.
- The score scaling is propagated into the query/key gradients:
  `dQ = dS K / √dₖ` and `dK = dSᵀ Q / √dₖ`.

The implementation includes:

- A numerically stable row-wise softmax that subtracts each row's maximum
  before exponentiation.
- A forward pass that computes scaled scores, probabilities, and output, with
  an optional causal upper-triangular mask.
- A backward pass that returns gradients for `Q`, `K`, and `V`.
- A central finite-difference checker and a relative-error comparison.
- A seeded, small random test (`n = 3`, `dₖ = 4`, `dᵥ = 2`) using step size
  `h = 10⁻⁵`.

### Recorded verification

For the notebook's unmasked test case, the recorded relative errors between
analytical and finite-difference gradients are:

| Gradient | Relative error |
| --- | ---: |
| `dQ` | `1.61 × 10⁻¹¹` |
| `dK` | `5.54 × 10⁻¹¹` |
| `dV` | `5.53 × 10⁻¹²` |

These values are below the notebook's stated acceptance threshold of `10⁻⁵`.
The notebook also explains why scaling by `1/√dₖ` helps keep dot-product
magnitudes, and therefore softmax gradients, in a better-conditioned range.
For causal attention, future positions receive score `-∞` before softmax;
their probabilities and corresponding score gradients are zero. The
implementation discusses this consequence but the recorded gradient check is
for the unmasked case.

### Memory consideration

The notebook contrasts standard attention's score/probability matrices, whose
storage grows as `O(n²)` with sequence length `n`, with the tiled approach used
by FlashAttention. Processing score blocks and consuming them without
materializing the full `n × n` matrices reduces the extra attention-matrix
memory requirement to linear in sequence length (`O(n)`).

## Milestone 3 — Design an Evaluation Strategy

### Scenario and metric choice

The case study is card-transaction fraud detection with fraud representing
0.1% of transactions, chargeback labels delayed by 30–60 days, and changing
fraud patterns.

The notebook explains why accuracy is unsuitable as a standalone comparison:
a model that predicts every transaction as legitimate could achieve about
99.9% accuracy while detecting no fraud. Instead, it recommends:

- **Precision** to quantify how many flagged transactions are actually fraud,
  relevant to unnecessary blocks and investigations.
- **Recall** to quantify the share of fraud caught, particularly important
  given the scenario's stated $200 average cost for a missed fraudulent
  transaction.
- **PR-AUC** to compare precision/recall trade-offs in a highly imbalanced
  setting.
- **F1 or F-beta** to summarize the precision/recall trade-off; F2 emphasizes
  recall when missed fraud is more costly.

It cautions against relying on accuracy or ROC-AUC alone, since either can
conceal weak fraud detection or poor precision at the operating point that
matters.

### Time-based split and label maturity

The strategy preserves chronological order rather than randomly mixing past
and future transactions:

| Partition | Example period | Purpose |
| --- | --- | --- |
| Training | January 1–June 30 | Fit on older transactions |
| Buffer | July 1–August 31 | Exclude transactions whose labels may still be pending |
| Validation | September 1–September 30 | Compare models and select a decision threshold after labels mature |
| Test | October 1–October 31 | Evaluate the selected model on newer data without tuning on it |

These month ranges illustrate the workflow; the notebook does not implement a
data-splitting pipeline. It separately describes the proportions as 70% /
15% / 15%, so the calendar example should be adapted to the actual observation
window and label maturity rather than interpreted as a calculated split.
For delayed outcomes, evaluate transactions with sufficiently mature,
confirmed labels, track recent predictions while labels are pending, and do
not silently count unlabeled transactions as legitimate.

### Cost-based threshold and calibration

Using the stated costs—$200 for a false negative and $5 for a false
positive—the notebook compares expected costs. If `p` is the calibrated
probability of fraud, flagging costs `(1 - p) × $5`, while allowing the
transaction costs `p × $200`. Flagging is preferred when:

```text
(1 - p) × 5 < p × 200
p > 5 / 205 ≈ 0.0244
```

This yields an initial cost-based threshold of approximately **2.44%** under
the stated assumptions. It is a starting point, not a threshold validated
against real operational constraints. The notebook proposes reliability
diagrams and the Brier score to assess whether predicted probabilities are
calibrated, using confirmed labels once available.

### Production monitoring and retraining

The proposed monitoring covers:

- **Data drift:** changes in transaction attributes such as amounts, locations,
  or spending habits.
- **Prediction drift:** changes in the volume or share of transactions flagged.
- **Concept drift:** degradation in confirmed-label precision, recall, or
  financial outcomes.

It recommends daily or weekly monitoring, investigating persistent drift or
performance decline, testing a retrained model on recent data before
replacement, and monitoring after deployment with a rollback plan. These are
operational recommendations in the notebook; no production integration or
monitoring system is implemented here.

## Milestone 4 — Diagnosing Learning Curves

This notebook analyzes four given train/validation accuracy patterns and
proposes diagnoses and follow-up actions. The cases are conceptual examples;
they are not outputs from a training run included in this submission.

| Case | Given pattern | Main interpretation | Proposed response |
| --- | --- | --- | --- |
| A | Train 62%, validation 60%; both flat | High bias / underfitting: the model is fitting poorly and additional data alone is unlikely to fix a capacity or representation bottleneck. | Consider a more capable model, stronger features, less regularization, or longer training; verify optimizer convergence and learning rate. |
| B | Train 99%, validation 78%; validation improves slowly and the gap shrinks slowly | High variance / overfitting with evidence that more data may help, since the gap is narrowing. | Collect data or augment it; consider regularization, early stopping, lower capacity, feature selection, or pretraining. |
| C | Train 85%, validation 91%; both rise slightly | Not a straightforward fit diagnosis. Validation exceeding training warrants checking measurement conditions and split comparability; training-time dropout or augmentation can explain some gap. | Evaluate training in inference mode, audit leakage and duplicates, compare split difficulty/distributions, and use cross-validation or a fresh test set before changing capacity or training duration. |
| D | Train 88%, validation 70%; gap remains even with 4× the data | More data has not closed the gap; possible causes include distribution shift, excessive model capacity, or noisy/inconsistent labels. | Mix and resplit training and validation examples, then compare performance on the new validation split and the original one to help distinguish split shift from other causes. |

The emphasis is on choosing a diagnosis from the *shape and relationship* of
the curves, checking data and measurement quality before intervening, and
matching the experiment to the suspected cause rather than automatically
collecting more data.

## Scope and reproducibility notes

- Milestones 1, 3, and 4 are written analyses and code examples. They do not
  include a supplied dataset, recorded end-to-end model benchmark, or measured
  production outcome.
- Milestone 2 includes executable NumPy attention code and recorded numerical
  gradient-check results for a small deterministic example.
- The notebook contents are preserved as submitted. The notes above identify
  limitations in the examples so readers can distinguish proposed methods,
  demonstrated results, and work that remains to be validated.

--- 

# ReliefHub — Flood Relief Coordination Dashboard

## Team Member 1
 
ReliefHub is a local web dashboard for coordinating flood-relief operations in
Sindh. It helps relief coordinators and field volunteers manage camps, track
warehouse inventory and camp needs, coordinate dispatches, record donations,
and organize volunteer assignments from one application.

### Key capabilities

- View operational summaries, including camp capacity, inventory levels,
  fulfillment progress, and critical resource gaps.
- Manage relief camps and their resource requests.
- Track warehouse stock, low-stock alerts, donations, and dispatch status.
- Register volunteers, record their skills, and manage camp assignments.
- Apply operational safeguards, including stock reservation and restoration
  when dispatches are cancelled, camp-capacity handling, and restrictions on
  assigning volunteers to closed camps.

### Architecture and technology

The application is built with Python and Streamlit. Its presentation layer is
organized into views, while service modules implement the operational rules.
Services communicate with a local mock REST API backed by JSON data. The API
can run with the embedded Python server, with optional `json-server` support.
Seed data and service tests are included for local development.

### Run locally on Windows

Open the ReliefHub folder and double-click `run_app.bat` to launch the API and
dashboard. Alternatively, follow the setup and manual launch instructions in
the [ReliefHub README](ReliefHub/README.md). The dashboard opens in a browser
after startup.
