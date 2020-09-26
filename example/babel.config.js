const path = require('path');
const pak = require('../package.json');

module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    [
      'module-resolver',
      {
        alias: {
          [pak.name]: path.join(__dirname, '..'),
        },
      },
    ],
  ],
};
