import type { B2CConfiguration } from './b2cClient';

export const b2cConfig: B2CConfiguration = {
  auth: {
    clientId: '<CLIENT_ID>',
    authorityBase: 'https://<TENANT_NAME>.b2clogin.com/tfp/<TENANT_NAME>.onmicrosoft.com',
    policies: {
      signInSignUp: 'b2c_sisu',
      passwordReset: 'b2c_reset',
    },
  },
  // web only:
  cache: { cacheLocation: 'localStorage' },
};

export const b2cScopes = ['https://<TENANT_NAME>.onmicrosoft.com/api/user_impersonation'];
