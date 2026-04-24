/**
 * User routes. All data access goes through the repository module —
 * the router itself has no state.
 */
const express = require('express');
const repo = require('../repository');

const ROLES = new Set(['admin', 'viewer', 'editor']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const parsePositiveInt = (raw) => {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
};

const validateCreatePayload = (body) => {
  if (!body || typeof body !== 'object') return 'request body must be a JSON object';
  const { name, email, role } = body;
  if (typeof name  !== 'string' || !name.trim()) return 'name is required';
  if (typeof email !== 'string' || !EMAIL_RE.test(email)) return 'email is invalid';
  if (!ROLES.has(role)) return `role must be one of ${[...ROLES].join(', ')}`;
  return null;
};

const router = express.Router();

router.get('/', (_req, res) => res.json(repo.all()));

router.get('/:id', (req, res) => {
  const id = parsePositiveInt(req.params.id);
  if (id === null) return res.status(400).json({ error: 'id must be a positive integer' });

  const user = repo.findById(id);
  return user
    ? res.json(user)
    : res.status(404).json({ error: 'User not found' });
});

router.post('/', (req, res) => {
  const validationError = validateCreatePayload(req.body);
  if (validationError) return res.status(400).json({ error: validationError });

  if (repo.findByEmail(req.body.email)) {
    return res.status(409).json({ error: 'Email already in use' });
  }

  return res.status(201).json(repo.create(req.body));
});

router.delete('/:id', (req, res) => {
  const id = parsePositiveInt(req.params.id);
  if (id === null) return res.status(400).json({ error: 'id must be a positive integer' });

  return repo.deleteById(id)
    ? res.status(204).send()
    : res.status(404).json({ error: 'User not found' });
});

module.exports = router;
