# pact-contract-testing

![Consumer Contract](https://github.com/rashmieravichandran06121989/pact-contract-testing/actions/workflows/consumer-contract.yml/badge.svg)
![Provider Verification](https://github.com/rashmieravichandran06121989/pact-contract-testing/actions/workflows/provider-verification.yml/badge.svg)

As a SDET — I own the full quality strategy for a 6-person development team. Integration failures between microservices were slipping through too late in our pipeline, so I introduced consumer-driven contract testing as the fix.

This repo is the production-ready reference implementation I built to prove the pattern: consumer tests, provider verification, Pact Broker, and can-i-deploy gates in CI.

---

## Architecture

### Overall contract flow

```mermaid
flowchart TD
    subgraph consumer_ci["Consumer CI — Order Service"]
        CT[Consumer Pact Tests]:::step
        GP[Generate Pact File]:::step
        PP[Publish to Broker]:::step
        CID_C{can-i-deploy?}:::gate
        CT --> GP --> PP --> CID_C
    end

    subgraph broker["Pact Broker"]
        PS[(Pact Store)]:::store
        VR[(Verification Results)]:::store
        DM[(Deployment Matrix)]:::store
    end

    subgraph provider_ci["Provider CI — User Service"]
        FP[Fetch Contracts from Broker]:::step
        SH[Run State Handlers]:::step
        PV[Verify Provider]:::step
        PUB[Publish Results]:::step
        CID_P{can-i-deploy?}:::gate
        RD[Record Deployment]:::step
        FP --> SH --> PV --> PUB --> CID_P --> RD
    end

    PP -->|"publish contract"| PS
    PS -->|"fetch contracts"| FP
    PUB -->|"verification result"| VR
    VR -->|"check matrix"| DM
    DM -->|"yes/no"| CID_C
    DM -->|"yes/no"| CID_P

    classDef step fill:#4A90D9,color:#fff,stroke:none
    classDef gate fill:#F5A623,color:#fff,stroke:none
    classDef store fill:#7ED321,color:#fff,stroke:none
```

---

### Sequence: consumer generates a contract

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant CT as Consumer Test (Jest)
    participant MS as Pact Mock Server
    participant PF as pacts/ (JSON file)
    participant PB as Pact Broker

    Dev->>CT: npm test (consumer)
    CT->>MS: Register expected interactions
    MS-->>CT: Acknowledge
    CT->>MS: HTTP requests (via userClient.js)
    MS-->>CT: Stubbed responses
    CT->>PF: Write OrderService-UserService.json
    note over CT,PF: Contract generated

    Dev->>PB: npm run publish:pacts
    PF->>PB: Upload contract + branch/SHA tag
    PB-->>Dev: Contract stored ✓
```

---

### Sequence: provider verifies the contract

```mermaid
sequenceDiagram
    participant PB as Pact Broker
    participant PV as Provider Verifier (Jest)
    participant SH as State Handlers
    participant PS as Provider Server

    PV->>PB: Fetch latest contracts for UserService
    PB-->>PV: OrderService-UserService.json

    loop Each interaction
        PV->>SH: Set up provider state (e.g. "user 1 exists")
        SH->>PS: Seed / reset in-memory store
        PV->>PS: Replay recorded HTTP request
        PS-->>PV: Live response
        PV->>PV: Compare against recorded expectation
    end

    PV->>PB: Publish verification result (pass/fail + SHA)
    PB-->>PV: Acknowledged
```

---

### CI pipeline overview

```mermaid
flowchart LR
    subgraph consumer_pipeline["Consumer Pipeline"]
        direction TB
        c1[npm ci]:::ci --> c2[Consumer Pact Tests]:::ci
        c2 --> c3[Upload pact artifact]:::ci
        c3 --> c4[Publish pacts to broker]:::ci
        c4 --> c5[can-i-deploy check]:::ci
    end

    subgraph provider_pipeline["Provider Pipeline"]
        direction TB
        p1[npm ci]:::ci --> p2[Provider Pact Verification]:::ci
        p2 --> p3[can-i-deploy check]:::ci
        p3 --> p4[Record deployment]:::ci
    end

    subgraph broker["Pact Broker"]
        b1[(Contracts + Results)]:::store
    end

    c4 -->|push contract| b1
    b1 -->|webhook triggers| p2
    p2 -->|publish result| b1
    b1 -->|check matrix| c5
    b1 -->|check matrix| p3

    classDef ci fill:#4A90D9,color:#fff,stroke:none
    classDef store fill:#7ED321,color:#fff,stroke:none
```

---

## Quick start

### 1. Install dependencies

```bash
cd consumer && npm install && cd ..
cd provider && npm install && cd ..
```

### 2. Run consumer tests — generates the contract

```bash
cd consumer
npm test
```

4 tests, all interactions verified against the Pact mock server. Contract written to `pacts/OrderService-UserService.json`.

![consumer test output](docs/Consumer-test-output.png)

### 3. Verify provider against the contract

```bash
cd provider
PACT_SOURCE=local npm test
```

Provider replays each recorded interaction against the live Express app. State handlers seed the in-memory store before each interaction runs.

![provider test output](docs/provider-test-output.png)

### 4. Start a local Pact Broker

```bash
docker compose up -d
# Broker UI → http://localhost:9292  (admin / admin)
```

Then publish and verify via the broker:

```bash
# Publish
cd consumer
PACT_BROKER_BASE_URL=http://localhost:9292 \
PACT_BROKER_TOKEN="" \
GITHUB_SHA=$(git rev-parse HEAD) \
GITHUB_REF_NAME=main \
npm run publish:pacts

# Verify
cd ../provider
PACT_BROKER_BASE_URL=http://localhost:9292 \
PACT_BROKER_TOKEN="" \
npm test
```

---

## CI setup

Add `PACT_BROKER_BASE_URL` and `PACT_BROKER_TOKEN` as repo secrets. The consumer workflow triggers on changes to `consumer/**`, the provider on `provider/**` or a broker webhook.

The broker webhook is worth setting up — configure a "contract requiring verification published" event to trigger the provider pipeline automatically. No polling, no manual coordination between teams.

---

## Contract (sample)

`pacts/OrderService-UserService.json`:

```json
{
  "consumer": { "name": "OrderService" },
  "provider": { "name": "UserService" },
  "interactions": [
    {
      "description": "a GET request for user 1",
      "providerState": "user with ID 1 exists",
      "request": {
        "method": "GET",
        "path": "/users/1",
        "headers": { "Accept": "application/json" }
      },
      "response": {
        "status": 200,
        "body": {
          "id": 1,
          "name": "Alice",
          "email": "alice@example.com",
          "role": "admin"
        }
      }
    }
  ],
  "metadata": {
    "pactSpecification": { "version": "4.0" }
  }
}
```

---

## Repository structure

```
pact-contract-testing/
├── consumer/                         # Order Service (generates contracts)
│   ├── src/
│   │   ├── userClient.js             # HTTP client for User Service
│   │   ├── userClient.pact.test.js   # consumer pact tests → writes pacts/
│   │   └── publishPacts.js           # CLI script to push contracts to broker
│   ├── jest.config.js
│   └── package.json
│
├── provider/                         # User Service (verifies contracts)
│   ├── src/
│   │   ├── app.js                    # Express app (exported without binding)
│   │   ├── server.js                 # binds app to a port
│   │   └── routes/users.js           # user routes + in-memory store
│   ├── pact/
│   │   └── providerVerification.test.js  # verifier + state handlers
│   ├── jest.config.js
│   └── package.json
│
├── .github/
│   └── workflows/
│       ├── consumer-contract.yml     # test → publish → can-i-deploy
│       └── provider-verification.yml # verify → can-i-deploy → record
│
├── docs/
│   ├── consumer-test-output.png
│   └── provider-test-output.png
├── docker-compose.yml                # local Pact Broker (Postgres + UI)
├── .gitignore
└── README.md
```

---

## Extending

Add a new consumer by creating a new folder, writing pact tests pointing at the same broker, and publishing with a different consumer name. The broker handles the matrix automatically — no changes needed on the provider side.

To use PactFlow, replace `PACT_BROKER_BASE_URL` with your PactFlow URL. Everything else is identical.
