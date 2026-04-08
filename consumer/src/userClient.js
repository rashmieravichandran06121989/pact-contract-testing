/**
 * UserClient — HTTP client for the Order Service to call the User Service.
 * The base URL is read from USER_SERVICE_URL so that pact tests can point
 * it at the mock server without any code changes.
 */
const axios = require('axios');

const baseURL = () => process.env.USER_SERVICE_URL || 'http://localhost:3001';

const getUser = async (userId) => {
  const { data } = await axios.get(`${baseURL()}/users/${userId}`, {
    headers: { Accept: 'application/json' },
  });
  return data;
};

const createUser = async (userData) => {
  const { data } = await axios.post(`${baseURL()}/users`, userData, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });
  return data;
};

const listUsers = async () => {
  const { data } = await axios.get(`${baseURL()}/users`, {
    headers: { Accept: 'application/json' },
  });
  return data;
};

module.exports = { getUser, createUser, listUsers };
