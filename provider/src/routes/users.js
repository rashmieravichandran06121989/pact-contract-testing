/**
 * In-memory user store.
 *
 * In a real service this would be backed by a database.
 * The pact state handlers (see pact/providerVerification.test.js)
 * reset or seed this array before each interaction is verified.
 */
const express = require('express');

const router = express.Router();

// Exported so state handlers can mutate it between interactions
const users = [
  { id: 1, name: 'Alice', email: 'alice@example.com', role: 'admin' },
  { id: 2, name: 'Bob', email: 'bob@example.com', role: 'viewer' },
];

let nextId = 3;

// Expose store manipulation helpers for use by pact state handlers
const resetUsers = () => {
  users.length = 0;
  users.push(
    { id: 1, name: 'Alice', email: 'alice@example.com', role: 'admin' },
    { id: 2, name: 'Bob', email: 'bob@example.com', role: 'viewer' }
  );
  nextId = 3;
};

const removeUserByEmail = (email) => {
  const idx = users.findIndex((u) => u.email === email);
  if (idx !== -1) users.splice(idx, 1);
};

// ---------------------------------------------------------------------------
// GET /users
// ---------------------------------------------------------------------------
router.get('/', (_req, res) => {
  res.json(users);
});

// ---------------------------------------------------------------------------
// GET /users/:id
// ---------------------------------------------------------------------------
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const user = users.find((u) => u.id === id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(user);
});

// ---------------------------------------------------------------------------
// POST /users
// ---------------------------------------------------------------------------
router.post('/', (req, res) => {
  const { name, email, role } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ error: 'name, email, and role are required' });
  }

  const newUser = { id: nextId++, name, email, role };
  users.push(newUser);
  res.status(201).json(newUser);
});

// ---------------------------------------------------------------------------
// DELETE /users/:id  (useful for teardown in integration tests)
// ---------------------------------------------------------------------------
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = users.findIndex((u) => u.id === id);

  if (idx === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  users.splice(idx, 1);
  res.status(204).send();
});

module.exports = router;
module.exports.resetUsers = resetUsers;
module.exports.removeUserByEmail = removeUserByEmail;
