/**
 * Publishes generated pact files to a Pact Broker.
 * Called from CI via: npm run publish:pacts
 *
 * Required env vars:
 *   PACT_BROKER_BASE_URL  — e.g. https://your-broker.pactflow.io
 *   PACT_BROKER_TOKEN     — read/write API token
 *   GITHUB_SHA            — commit SHA used as consumer version
 *   GITHUB_REF_NAME       — branch name used for branch tagging
 */
const { Publisher } = require('@pact-foundation/pact');
const path = require('path');

const {
  PACT_BROKER_BASE_URL,
  PACT_BROKER_TOKEN,
  GITHUB_SHA,
  GITHUB_REF_NAME,
} = process.env;

if (!PACT_BROKER_BASE_URL) {
  console.error('ERROR: PACT_BROKER_BASE_URL must be set.');
  process.exit(1);
}

// Hosted brokers (PactFlow) require a token; self-hosted brokers with
// PACT_BROKER_ALLOW_PUBLIC_READ=true may accept unauthenticated writes.
// Warn rather than fail so local flows still work.
if (!PACT_BROKER_TOKEN) {
  console.warn(
    '[publishPacts] PACT_BROKER_TOKEN not set — assuming an unauthenticated broker.'
  );
}

const branch  = GITHUB_REF_NAME || 'local';
const version = GITHUB_SHA      || `local-${Date.now()}`;

const publisher = new Publisher({
  pactBroker: PACT_BROKER_BASE_URL,
  pactBrokerToken: PACT_BROKER_TOKEN,
  pactFilesOrDirs: [path.resolve(__dirname, '../../pacts')],
  consumerVersion: version,
  branch,
  // Only tag 'main' so feature branches don't clutter the tag namespace —
  // branch selectors are the idiomatic discriminator in Pact v12+.
  tags: branch === 'main' ? ['main'] : [],
});

publisher
  .publish()
  .then((urls) => {
    console.log(
      JSON.stringify({ published: urls, broker: PACT_BROKER_BASE_URL, version, branch }, null, 2)
    );
  })
  .catch((err) => {
    console.error('Failed to publish pacts:', err.message);
    process.exit(1);
  });
