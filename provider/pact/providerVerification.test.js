/**
 * Provider Pact Verification — User Service
 *
 * 1. Starts the Express app on an ephemeral port (avoids CI collisions).
 * 2. Resolves the pact source (broker OR local file).
 * 3. Replays each recorded interaction.
 * 4. Publishes verification results back to the broker (CI only).
 *
 * Broker mode requires a real GITHUB_SHA — otherwise we refuse to run,
 * so local runs cannot pollute the broker with `providerVersion: "local"`.
 */
const path = require('path');
const { Verifier } = require('@pact-foundation/pact');
const app = require('../src/app');
const { handlers: stateHandlers } = require('./stateHandlers');

let server;
let baseUrl;

beforeAll(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

const resolvePactSource = () => {
  const brokerUrl = process.env.PACT_BROKER_BASE_URL;
  const useLocal = !brokerUrl || process.env.PACT_SOURCE === 'local';

  if (useLocal) {
    const pactDir = path.resolve(__dirname, '../../pacts');
    console.log(`[pact] Using local pact file from: ${pactDir}`);
    return {
      pactUrls: [path.join(pactDir, 'OrderService-UserService.json')],
    };
  }

  if (!process.env.GITHUB_SHA) {
    throw new Error(
      'Broker mode requires GITHUB_SHA. Set PACT_SOURCE=local to run locally.'
    );
  }

  return {
    pactBrokerUrl: brokerUrl,
    pactBrokerToken: process.env.PACT_BROKER_TOKEN,
    consumerVersionSelectors: [
      { mainBranch: true },
      { deployedOrReleased: true },
      { matchingBranch: true },
    ],
    publishVerificationResult: process.env.CI === 'true',
    providerVersion: process.env.GITHUB_SHA,
    providerVersionBranch: process.env.GITHUB_REF_NAME,
    enablePending: true,
    includeWipPactsSince: new Date(Date.now() - 30 * 86_400_000).toISOString(),
  };
};

describe('Provider contract verification: UserService', () => {
  it('satisfies all expectations from OrderService', async () => {
    const verifier = new Verifier({
      provider: 'UserService',
      providerBaseUrl: baseUrl,
      logLevel: 'warn',
      stateHandlers,
      ...resolvePactSource(),
    });

    const output = await verifier.verifyProvider();
    console.log('[pact] Verification complete');
    expect(output).toBeDefined();
  });
});
