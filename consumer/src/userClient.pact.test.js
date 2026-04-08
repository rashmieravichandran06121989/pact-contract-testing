/**
 * Consumer Pact Tests — Order Service → User Service
 *
 * Each `provider.addInteraction()` block defines one interaction:
 *   1. The request this consumer sends
 *   2. The minimum response shape it needs (using matchers, not exact values)
 *
 * Running these tests generates:
 *   ../pacts/OrderService-UserService.json
 *
 * That file is the "contract" that the provider must satisfy.
 */
const { PactV3, MatchersV3 } = require('@pact-foundation/pact');
const path = require('path');
const { getUser, createUser, listUsers } = require('./userClient');

const { like, eachLike, integer, string, regex } = MatchersV3;

// ---------------------------------------------------------------------------
// Pact provider mock — spins up a local HTTP server during tests
// ---------------------------------------------------------------------------
const provider = new PactV3({
  consumer: 'OrderService',
  provider: 'UserService',
  dir: path.resolve(__dirname, '../../pacts'),
  logLevel: 'warn',
});

// ---------------------------------------------------------------------------
// GET /users/:id — fetch a single user
// ---------------------------------------------------------------------------
describe('GET /users/:id', () => {
  it('returns an existing user', async () => {
    await provider
      .given('user with ID 1 exists')
      .uponReceiving('a GET request for user 1')
      .withRequest({
        method: 'GET',
        path: '/users/1',
        headers: { Accept: 'application/json' },
      })
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: like({
          id: integer(1),
          name: string('Alice'),
          email: regex('\\S+@\\S+\\.\\S+', 'alice@example.com'),
          role: string('admin'),
        }),
      })
      .executeTest(async (mockServer) => {
        process.env.USER_SERVICE_URL = mockServer.url;
        const user = await getUser(1);

        expect(typeof user.id).toBe('number');
        expect(typeof user.name).toBe('string');
        expect(user.email).toMatch(/\S+@\S+\.\S+/);
        expect(typeof user.role).toBe('string');
      });
  });

  it('returns 404 for a user that does not exist', async () => {
    await provider
      .given('user with ID 999 does not exist')
      .uponReceiving('a GET request for non-existent user 999')
      .withRequest({
        method: 'GET',
        path: '/users/999',
        headers: { Accept: 'application/json' },
      })
      .willRespondWith({
        status: 404,
        headers: { 'Content-Type': 'application/json' },
        body: like({ error: string('User not found') }),
      })
      .executeTest(async (mockServer) => {
        process.env.USER_SERVICE_URL = mockServer.url;
        await expect(getUser(999)).rejects.toMatchObject({
          response: { status: 404 },
        });
      });
  });
});

// ---------------------------------------------------------------------------
// GET /users — list all users
// ---------------------------------------------------------------------------
describe('GET /users', () => {
  it('returns a list of users', async () => {
    await provider
      .given('at least one user exists')
      .uponReceiving('a GET request for all users')
      .withRequest({
        method: 'GET',
        path: '/users',
        headers: { Accept: 'application/json' },
      })
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: eachLike({
          id: integer(1),
          name: string('Alice'),
          email: string('alice@example.com'),
          role: string('admin'),
        }),
      })
      .executeTest(async (mockServer) => {
        process.env.USER_SERVICE_URL = mockServer.url;
        const users = await listUsers();

        expect(Array.isArray(users)).toBe(true);
        expect(users.length).toBeGreaterThan(0);
        expect(typeof users[0].id).toBe('number');
      });
  });
});

// ---------------------------------------------------------------------------
// POST /users — create a user
// ---------------------------------------------------------------------------
describe('POST /users', () => {
  it('creates a new user and returns 201 with the created resource', async () => {
    await provider
      .given('no user exists with email carol@example.com')
      .uponReceiving('a POST request to create user carol@example.com')
      .withRequest({
        method: 'POST',
        path: '/users',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: {
          name: 'Carol',
          email: 'carol@example.com',
          role: 'editor',
        },
      })
      .willRespondWith({
        status: 201,
        headers: { 'Content-Type': 'application/json' },
        body: like({
          id: integer(3),
          name: string('Carol'),
          email: string('carol@example.com'),
          role: string('editor'),
        }),
      })
      .executeTest(async (mockServer) => {
        process.env.USER_SERVICE_URL = mockServer.url;
        const user = await createUser({
          name: 'Carol',
          email: 'carol@example.com',
          role: 'editor',
        });

        expect(typeof user.id).toBe('number');
        expect(user.name).toBe('Carol');
        expect(user.email).toBe('carol@example.com');
      });
  });
});
