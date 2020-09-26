import type {
  MSALResult,
  MSALInteractiveParams,
  MSALSilentParams,
  MSALSignoutParams,
  MSALAccount,
  MSALConfiguration,
} from './types';

export interface RNMSALNativeModule {
  createPublicClientApplication(config: MSALConfiguration): Promise<void>;
  acquireToken(params: MSALInteractiveParams): Promise<MSALResult>;
  acquireTokenSilent(params: MSALSilentParams): Promise<MSALResult>;
  getAccounts(): Promise<MSALAccount[]>;
  getAccount(accountIdentifier: string): Promise<MSALAccount>;
  removeAccount(account: MSALAccount): Promise<boolean>;
  signout(params: MSALSignoutParams): Promise<boolean>;
}
