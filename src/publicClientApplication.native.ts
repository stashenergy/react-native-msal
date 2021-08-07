import { Platform } from 'react-native';

import RNMSAL from './nativeModule';
import type {
  MSALConfiguration,
  MSALInteractiveParams,
  MSALSilentParams,
  MSALAccount,
  MSALSignoutParams,
  IPublicClientApplication,
} from './types';

export class PublicClientApplication implements IPublicClientApplication {
  constructor(private readonly config: MSALConfiguration) {}

  public async init() {
    await RNMSAL.createPublicClientApplication(this.config);
    return this;
  }

  public async acquireToken(params: MSALInteractiveParams) {
    return await RNMSAL.acquireToken(params);
  }

  public async acquireTokenSilent(params: MSALSilentParams) {
    return await RNMSAL.acquireTokenSilent(params);
  }

  public async getAccounts() {
    return await RNMSAL.getAccounts();
  }

  public async getAccount(accountIdentifier: string) {
    return await RNMSAL.getAccount(accountIdentifier);
  }

  public async removeAccount(account: MSALAccount) {
    return await RNMSAL.removeAccount(account);
  }

  public async signOut(params: MSALSignoutParams) {
    return await Platform.select({
      ios: async () => await RNMSAL.signout(params),
      default: async () => await RNMSAL.removeAccount(params.account),
    })();
  }
}
