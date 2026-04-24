/**
 * In-memory user repository.
 *
 * Singleton for simplicity — the provider is a single-process demo and the
 * pact state handlers need a stable reference to reset between interactions.
 * Swap this module for a real data store without touching the routes.
 */
const SEED = Object.freeze([
  Object.freeze({ id: 1, name: 'Alice', email: 'alice@example.com', role: 'admin'  }),
  Object.freeze({ id: 2, name: 'Bob',   email: 'bob@example.com',   role: 'viewer' }),
]);

let users = [];
let nextId = 1;

const reset = () => {
  users = SEED.map((u) => ({ ...u }));
  nextId = users.reduce((max, u) => Math.max(max, u.id), 0) + 1;
};

const all         = () => [...users];
const findById    = (id)    => users.find((u) => u.id === id)       ?? null;
const findByEmail = (email) => users.find((u) => u.email === email) ?? null;

const create = ({ name, email, role }) => {
  const user = { id: nextId++, name, email, role };
  users.push(user);
  return user;
};

const deleteById = (id) => {
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return false;
  users.splice(idx, 1);
  return true;
};

const deleteByEmail = (email) => {
  const idx = users.findIndex((u) => u.email === email);
  if (idx === -1) return false;
  users.splice(idx, 1);
  return true;
};

reset();

module.exports = { all, findById, findByEmail, create, deleteById, deleteByEmail, reset };
