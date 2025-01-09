const Oyster = require('oyster-db');
const config = require('../config/index.config.js');

beforeAll(async () => {
  global.oyster = new Oyster({
    url: config.dotEnv.OYSTER_REDIS,
    prefix: 'test_' + config.dotEnv.OYSTER_PREFIX,
  });
});

afterAll(async () => {
  if (global.oyster) {
    await global.oyster.close();
  }
});
