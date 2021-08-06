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

export default class PublicClientApplication implements IPublicClientApplication {
  private isInitialized = false;

  constructor(private readonly config: MSALConfiguration, init = true) {
    if (init) this.init();
  }

  public async init() {
    if (!this.isInitialized) {
      await RNMSAL.createPublicClientApplication(this.config);
      this.isInitialized = true;
    }
  }

  public async acquireToken(params: MSALInteractiveParams) {
    this.throwIfNotInitialized();
    return await RNMSAL.acquireToken(params);
  }

  public async acquireTokenSilent(params: MSALSilentParams) {
    this.throwIfNotInitialized();
    return await RNMSAL.acquireTokenSilent(params);
  }

  public async getAccounts() {
    this.throwIfNotInitialized();
    return await RNMSAL.getAccounts();
  }

  public async getAccount(accountIdentifier: string) {
    this.throwIfNotInitialized();
    return await RNMSAL.getAccount(accountIdentifier);
  }

  public async removeAccount(account: MSALAccount) {
    this.throwIfNotInitialized();
    return await RNMSAL.removeAccount(account);
  }

  public async signOut(params: MSALSignoutParams) {
    this.throwIfNotInitialized();
    return await Platform.select({
      ios: RNMSAL.signout(params),
      default: RNMSAL.removeAccount(params.account),
    });
  }

  private throwIfNotInitialized() {
    if (!this.isInitialized) {
      throw Error('PublicClientApplication instance not initialized.');
    }
  }
}
