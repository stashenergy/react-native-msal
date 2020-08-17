import { Platform } from 'react-native';
import RNMSAL from './nativeModule';
import {
  MSALConfiguration,
  MSALInteractiveParams,
  MSALSilentParams,
  MSALAccount,
  MSALSignoutParams,
  MSALResult,
} from './types';

export default class PublicClientApplication {
  constructor(private readonly config: MSALConfiguration) {
    RNMSAL.createPublicClientApplication(this.config);
  }

  /**
   * Acquire a token interactively
   * @param {MSALInteractiveParams} params
   * @return Result containing an access token and account identifier
   * used for acquiring subsequent tokens silently
   */
  public acquireToken(params: MSALInteractiveParams): Promise<MSALResult> {
    return RNMSAL.acquireToken(params);
  }

  /**
   * Acquire a token silently
   * @param {MSALSilentParams} params - Includes the account identifer retrieved from a
   * previous interactive login
   * @return Result containing an access token and account identifier
   * used for acquiring subsequent tokens silently
   */
  public acquireTokenSilent(params: MSALSilentParams): Promise<MSALResult> {
    return RNMSAL.acquireTokenSilent(params);
  }

  /**
   * Get all accounts for which this application has refresh tokens
   * @return Promise containing array of MSALAccount objects for which this application has refresh tokens.
   */
  public getAccounts(): Promise<MSALAccount[]> {
    return RNMSAL.getAccounts();
  }

  /** Retrieve the account matching the identifier
   * @return Promise containing MSALAccount object
   */
  public getAccount(accountIdentifier: string): Promise<MSALAccount> {
    return RNMSAL.getAccount(accountIdentifier);
  }

  /**
   * Removes all tokens from the cache for this application for the provided
   * account.
   * @param {MSALAccount} account
   * @return A promise containing a boolean = true if account removal was successful
   * otherwise rejects
   */
  public removeAccount(account: MSALAccount): Promise<boolean> {
    return RNMSAL.removeAccount(account);
  }

  /**
   * NOTE: iOS only. On Android this is the same as `removeAccount`
   * Removes all tokens from the cache for this application for the provided
   * account. Additionally, this will remove the account from the system browser.
   * @param {MSALSignoutParams} params
   * @return A promise which resolves if sign out is successful,
   * otherwise rejects
   * @platform ios
   */
  public signOut(params: MSALSignoutParams): Promise<boolean> {
    return Platform.OS === 'ios' ? RNMSAL.signout(params) : this.removeAccount(params.account);
  }
}
