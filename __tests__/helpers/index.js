const ValidatorsLoader = require('../../loaders/ValidatorsLoader');
const utils = require('../../libs/utils');
const { actions } = require('../../static_arch/main.system');

const setupValidators = () => {
  const validatorsLoader = new ValidatorsLoader({
    models: require('../../managers/_common/schema.models'),
    customValidators: require('../../managers/_common/schema.validators'),
  });
  return validatorsLoader.load();
};
const generateRandomString = (length = 3) => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};
const generateUniqueEmail = (base, length = 3) => {
  const randomSuffix = generateRandomString(length);
  const [localPart, domain] = base.split('@');
  return `${localPart}+${randomSuffix}@${domain}`;
};
const mockManagers = {
  shark: {
    isGranted: ({ role, action, layer }) => {
      if (role === 'superAdmin') {
        return true;
      }

      if (role === 'admin') {
        if (layer === 'board.school' && ['read', 'update'].includes(action)) {
          return true;
        }
        if (
          actions[action] <= actions['update'] &&
          ['board.school.classRoom', 'board.school.classRoom.student'].includes(
            layer
          )
        ) {
          return true;
        }
      }

      return false;
    },
    addDirectAccess: () => Promise.resolve(true),
  },
  responseDispatcher: {
    dispatch: () => {},
  },
  token: {
    genLongToken: () => 'mock_long_token',
  },
};

const initializeTestEnvironment = async () => {
  const validators = setupValidators();

  return {
    oyster: global.oyster,
    validators,
    utils,
    managers: mockManagers,
  };
};

module.exports = {
  initializeTestEnvironment,
  mockManagers,
  generateUniqueEmail,
};
