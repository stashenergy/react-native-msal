import { PublicClientApplication as MSALPublicClientApplication } from '@azure/msal-browser';
import type {
  MSALConfiguration,
  MSALInteractiveParams,
  MSALSilentParams,
  MSALAccount,
  MSALSignoutParams,
  MSALResult,
  IPublicClientApplication,
} from './types';
import { MSALPromptType } from './types';

type PromptTypeString = 'consent' | 'login' | 'select_account' | 'none';

function promptTypeToString(promptType: MSALPromptType): PromptTypeString {
  switch (promptType) {
    case MSALPromptType.SELECT_ACCOUNT:
      return 'select_account';
    case MSALPromptType.LOGIN:
      return 'login';
    case MSALPromptType.CONSENT:
      return 'consent';
    case MSALPromptType.WHEN_REQUIRED:
      return 'none';
  }
}

export default class PublicClientApplication implements IPublicClientApplication {
  private static readonly notInitializedError = Error('PublicClientApplication instance not initialized.');
  private _pca?: MSALPublicClientApplication;

  constructor(private readonly config: MSALConfiguration, init = true) {
    if (init) this.init();
  }

  public async init() {
    this._pca = new MSALPublicClientApplication(this.config);
  }

  /**
   * Acquire a token interactively
   * @param {MSALInteractiveParams} params
   * @return Result containing an access token and account identifier
   * used for acquiring subsequent tokens silently
   */
  public async acquireToken(params: MSALInteractiveParams): Promise<MSALResult> {
    if (!this._pca) throw PublicClientApplication.notInitializedError;
    const { promptType, ...paramsWithoutPromptType } = params;
    const {
      accessToken,
      account,
      expiresOn,
      idToken,
      idTokenClaims,
      scopes,
      tenantId,
    } = await this._pca.acquireTokenPopup(
      promptType ? { ...paramsWithoutPromptType, prompt: promptTypeToString(promptType) } : paramsWithoutPromptType
    );
    return {
      accessToken,
      account: {
        identifier: account!.homeAccountId,
        environment: account!.environment,
        tenantId: account!.tenantId,
        username: account!.username,
        claims: idTokenClaims,
      },
      expiresOn: expiresOn?.getTime()!,
      idToken,
      scopes,
      tenantId,
    };
  }

  /**
   * Acquire a token silently
   * @param {MSALSilentParams} params - Includes the account identifer retrieved from a
   * previous interactive login
   * @return Result containing an access token and account identifier
   * used for acquiring subsequent tokens silently
   */
  public async acquireTokenSilent(params: MSALSilentParams): Promise<MSALResult> {
    if (!this._pca) throw PublicClientApplication.notInitializedError;
    const {
      accessToken,
      account,
      expiresOn,
      idToken,
      idTokenClaims,
      scopes,
      tenantId,
    } = await this._pca.acquireTokenSilent({
      ...params,
      account: {
        ...params.account,
        homeAccountId: params.account.identifier,
        environment: params.account.environment ?? '',
        localAccountId: '',
      },
    });
    return {
      accessToken,
      account: {
        identifier: account?.homeAccountId!,
        environment: account?.environment,
        tenantId: account?.tenantId!,
        username: account?.username!,
        claims: idTokenClaims,
      },
      expiresOn: expiresOn?.getTime()!,
      idToken,
      scopes,
      tenantId,
    };
  }

  /**
   * Get all accounts for which this application has refresh tokens
   * @return Promise containing array of MSALAccount objects for which this application has refresh tokens.
   */
  public getAccounts(): Promise<MSALAccount[]> {
    if (!this._pca) throw PublicClientApplication.notInitializedError;
    const accounts = this._pca.getAllAccounts();
    return Promise.resolve(
      accounts.map((a) => {
        const { homeAccountId: identifier, environment, tenantId, username } = a;
        return { identifier, environment, tenantId, username };
      })
    );
  }

  /** Retrieve the account matching the identifier
   * @return Promise containing MSALAccount object
   */
  public getAccount(accountIdentifier: string): Promise<MSALAccount> {
    if (!this._pca) throw PublicClientApplication.notInitializedError;
    const account = this._pca.getAccountByHomeId(accountIdentifier);
    if (account == null) {
      return Promise.reject('Account not found');
    } else {
      const { homeAccountId: identifier, environment, tenantId, username } = account;
      return Promise.resolve({ identifier, environment, tenantId, username });
    }
  }

  /**
   * Removes all tokens from the cache for this application for the provided
   * account.
   * @param {MSALAccount} account
   * @return A promise containing a boolean = true if account removal was successful
   * otherwise rejects
   */
  public async removeAccount(account: MSALAccount): Promise<boolean> {
    if (!this._pca) throw PublicClientApplication.notInitializedError;
    await this._pca.logout({
      account: {
        ...account,
        homeAccountId: account.identifier,
        environment: account.environment ?? '',
        localAccountId: '',
      },
    });
    return true;
  }

  /**
   * Removes all tokens from the cache for this application for the provided
   * account.
   * @param {MSALSignoutParams} params
   * @return A promise which resolves if sign out is successful,
   * otherwise rejects
   */
  public signOut(params: MSALSignoutParams): Promise<boolean> {
    return this.removeAccount(params.account);
  }
}
