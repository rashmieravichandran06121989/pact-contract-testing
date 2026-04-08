/**
 * Provider Pact Verification — User Service
 *
 * This test:
 *   1. Starts the Express app on an ephemeral port
 *   2. Fetches the pact contract (from broker OR local file)
 *   3. Replays each recorded interaction against the live server
 *   4. Publishes verification results back to the broker (CI only)
 *
 * Pact source resolution:
 *   - If PACT_BROKER_BASE_URL is set  → fetch latest pacts from the broker
 *   - Otherwise (PACT_SOURCE=local)   → read from ../../pacts/*.json
 *
 * State handlers reset in-memory data between interactions so that every
 * interaction starts from a known, deterministic state.
 */
const { Verifier } = require('@pact-foundation/pact');
const path = require('path');
const app = require('../src/app');
const { resetUsers, removeUserByEmail } = require('../src/routes/users');

const PORT = 3001;
let server;

beforeAll((done) => {
  server = app.listen(PORT, done);
});

afterAll((done) => {
  server.close(done);
});

describe('Provider contract verification: UserService', () => {
  it('satisfies all expectations from OrderService', async () => {
    const pactBrokerUrl = process.env.PACT_BROKER_BASE_URL;
    const useLocalPacts =
      !pactBrokerUrl || process.env.PACT_SOURCE === 'local';

    // ------------------------------------------------------------------
    // Base verifier options
    // ------------------------------------------------------------------
    const verifierOptions = {
      provider: 'UserService',
      providerBaseUrl: `http://localhost:${PORT}`,
      logLevel: 'warn',

      // ------------------------------------------------------------------
      // State handlers — called before each interaction to set up
      // the exact data condition described by the consumer's "given()" clause.
      // ------------------------------------------------------------------
      stateHandlers: {
        'user with ID 1 exists': async () => {
          resetUsers(); // seed includes user 1 by default
        },

        'user with ID 999 does not exist': async () => {
          resetUsers(); // 999 is never in the seed set
        },

        'at least one user exists': async () => {
          resetUsers();
        },

        'no user exists with email carol@example.com': async () => {
          resetUsers();
          removeUserByEmail('carol@example.com');
        },
      },
    };

    // ------------------------------------------------------------------
    // Pact source: broker vs. local file
    // ------------------------------------------------------------------
    if (!useLocalPacts) {
      Object.assign(verifierOptions, {
        pactBrokerUrl,
        pactBrokerToken: process.env.PACT_BROKER_TOKEN,
        consumerVersionSelectors: [
          { mainBranch: true },
          { deployedOrReleased: true },
        ],
        publishVerificationResult: process.env.CI === 'true',
        providerVersion: process.env.GITHUB_SHA || 'local',
        providerVersionBranch: process.env.GITHUB_REF_NAME || 'local',
        enablePending: true,
        includeWipPactsSince: new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
      });
    } else {
      const pactDir = path.resolve(__dirname, '../../pacts');
      verifierOptions.pactUrls = [
        path.join(pactDir, 'OrderService-UserService.json'),
      ];
      console.log(`[pact] Using local pact files from: ${pactDir}`);
    }

    // ------------------------------------------------------------------
    // Run verification
    // ------------------------------------------------------------------
    const output = await new Verifier(verifierOptions).verifyProvider();
    console.log('[pact] Verification complete:\n', output);
  });
});
