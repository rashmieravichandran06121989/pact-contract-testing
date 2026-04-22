# Pact Contract Testing — Reference Implementation

![Consumer Contract](https://github.com/rashmieravichandran06121989/pact-contract-testing/actions/workflows/consumer-contract.yml/badge.svg)
![Provider Verification](https://github.com/rashmieravichandran06121989/pact-contract-testing/actions/workflows/provider-verification.yml/badge.svg)

As a SDET — I own the full quality strategy for a 6-person development team. Integration failures between microservices were slipping through too late in our pipeline, so I introduced consumer-driven contract testing as the fix.

This repo is the production-ready reference implementation I built to prove the pattern: consumer tests, provider verification, Pact Broker, and can-i-deploy gates in CI.

---

## Architecture

### Overall contract flow

```mermaid
