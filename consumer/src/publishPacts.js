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

if (!PACT_BROKER_BASE_URL || !PACT_BROKER_TOKEN) {
  console.error(
    'ERROR: PACT_BROKER_BASE_URL and PACT_BROKER_TOKEN must be set.'
  );
  process.exit(1);
}

const publisher = new Publisher({
  pactBroker: PACT_BROKER_BASE_URL,
  pactBrokerToken: PACT_BROKER_TOKEN,
  pactFilesOrDirs: [path.resolve(__dirname, '../../pacts')],
  consumerVersion: GITHUB_SHA || require('../package.json').version,
  branch: GITHUB_REF_NAME || 'local',
  tags: [GITHUB_REF_NAME || 'local'],
});

publisher
  .publishPacts()
  .then(() => {
    console.log('Pacts published successfully to', PACT_BROKER_BASE_URL);
  })
  .catch((err) => {
    console.error('Failed to publish pacts:', err.message);
    process.exit(1);
  });
