/**
 * Provider state handlers.
 *
 * State descriptions are exported as constants so that the consumer can
 * `require` the same symbols and a typo cannot silently bypass a handler.
 */
const repo = require('../src/repository');

const STATES = Object.freeze({
  USER_1_EXISTS:            'user with ID 1 exists',
  USER_999_DOES_NOT_EXIST:  'user with ID 999 does not exist',
  AT_LEAST_ONE_USER:        'at least one user exists',
  EMAIL_AVAILABLE_CAROL:    'no user exists with email carol@example.com',
});

const handlers = {
  [STATES.USER_1_EXISTS]:           async () => { repo.reset(); },
  [STATES.USER_999_DOES_NOT_EXIST]: async () => { repo.reset(); /* 999 not in seed */ },
  [STATES.AT_LEAST_ONE_USER]:       async () => { repo.reset(); },
  [STATES.EMAIL_AVAILABLE_CAROL]:   async () => {
    repo.reset();
    repo.deleteByEmail('carol@example.com');
  },
};

module.exports = { STATES, handlers };
