export const b2cConfig = {
  clientId: '<CLIENT_ID>',
  authorityBase: 'https://<TENANT_NAME>.b2clogin.com/tfp/<TENANT_NAME>.onmicrosoft.com',
  policies: {
    signInSignUp: 'b2c_sisu',
    passwordReset: 'b2c_reset',
  },
  scopes: ['https://<TENANT_NAME>.onmicrosoft.com/api/user_impersonation'],
};
