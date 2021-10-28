import { NativeModules } from 'react-native';

import type {
  MSALResult,
  MSALInteractiveParams,
  MSALSilentParams,
  MSALSignoutParams,
  MSALAccount,
  MSALConfiguration,
} from './types';

type RNMSALNativeModule = {
  createPublicClientApplication(config: MSALConfiguration): Promise<void>;
  acquireToken(params: MSALInteractiveParams): Promise<MSALResult | undefined>;
  acquireTokenSilent(params: MSALSilentParams): Promise<MSALResult | undefined>;
  getAccounts(): Promise<MSALAccount[]>;
  getAccount(accountIdentifier: string): Promise<MSALAccount | undefined>;
  removeAccount(account: MSALAccount): Promise<boolean>;
  signout(params: MSALSignoutParams): Promise<boolean>;
};

const RNMSAL: RNMSALNativeModule = NativeModules.RNMSAL;

export default RNMSAL;
