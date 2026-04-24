/**
 * UserClient — HTTP client for the Order Service to call the User Service.
 *
 * Base URL is read from USER_SERVICE_URL on every call so the pact mock
 * server can be swapped in at test time without rebuilding the client.
 */
const axios = require('axios');

const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_BASE_URL   = 'http://localhost:3001';

const baseUrl = () => process.env.USER_SERVICE_URL || DEFAULT_BASE_URL;

const jsonHeaders = (extra = {}) => ({
  Accept: 'application/json',
  ...extra,
});

const requestConfig = (extraHeaders) => ({
  timeout: DEFAULT_TIMEOUT_MS,
  headers: jsonHeaders(extraHeaders),
});

const getUser = async (userId) => {
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new TypeError(
      `getUser: userId must be a positive integer, got ${String(userId)}`
    );
  }
  const { data } = await axios.get(`${baseUrl()}/users/${userId}`, requestConfig());
  return data;
};

const createUser = async (payload) => {
  const missing = ['name', 'email', 'role'].filter((k) => !payload?.[k]);
  if (missing.length) {
    throw new TypeError(`createUser: missing required fields: ${missing.join(', ')}`);
  }
  const { data } = await axios.post(
    `${baseUrl()}/users`,
    payload,
    requestConfig({ 'Content-Type': 'application/json' })
  );
  return data;
};

const listUsers = async () => {
  const { data } = await axios.get(`${baseUrl()}/users`, requestConfig());
  return data;
};

module.exports = { getUser, createUser, listUsers };
