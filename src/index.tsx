import { NativeModules, Platform } from 'react-native';
const { RNMSAL } = NativeModules;

export interface MSALResult {
  accessToken: string;
  expiresOn: number;
  idToken?: string;
  scopes: string[];
  authority: string;
  tenantId?: string;
  account: MSALAccount;
}

export interface MSALAccount {
  identifier: string;
  username?: string;
}

export enum MSALPromptType {
  SELECT_ACCOUNT,
  LOGIN,
  CONSENT,
  WHEN_REQUIRED,
  DEFAULT = WHEN_REQUIRED,
}

export interface MSALParams {
  authority: string;
}

// See https://azuread.github.io/microsoft-authentication-library-for-objc/Classes/MSALWebviewParameters.html
export interface MSALWebViewParams {
  privateAuthSession?: boolean; // iOS 13+
}

export interface MSALInterativeParams extends MSALParams, MSALWebViewParams {
  scopes: string[];
  promptType?: MSALPromptType;
  loginHint?: string;
  extraQueryParameters?: Record<string, string>;
  extraScopesToConsent?: string[];
}

export interface MSALSilentParams extends MSALParams {
  scopes: string[];
  accountIdentifier: string;
  forceRefresh?: boolean;
}

export interface MSALRemoveAccountParams extends MSALParams {
  accountIdentifier: string;
}

export interface MSALSignoutParams extends MSALParams, MSALWebViewParams {
  accountIdentifier: string;
}

export default class MSALClient {
  constructor(private clientId: string) {}

  /**
   * Acquire a token interactively
   * @param {MSALInterativeParams} params
   * @return {Promise<MSALResult>} Result containing an access token and account identifier
   * used for acquiring subsequent tokens silently
   */
  public acquireToken = (params: MSALInterativeParams): Promise<MSALResult> => {
    const {
      promptType = MSALPromptType.DEFAULT,
      loginHint = '',
      extraQueryParameters = {},
      extraScopesToConsent = [],
      ...rest
    } = params;
    return RNMSAL.acquireToken({
      clientId: this.clientId,
      promptType,
      loginHint,
      extraQueryParameters,
      extraScopesToConsent,
      ...rest,
    });
  };

  /**
   * Acquire a token silently
   * @param {MSALSilentParams} params - Includes the account identifer retrieved from a
   * previous interactive login
   * @return {Promise<MSALResult>} Result containing an access token and account identifier
   * used for acquiring subsequent tokens silently
   */
  public acquireTokenSilent = (params: MSALSilentParams): Promise<MSALResult> => {
    const { forceRefresh = false, ...rest } = params;
    return RNMSAL.acquireTokenSilent({
      clientId: this.clientId,
      forceRefresh,
      ...rest,
    });
  };

  /**
   * Removes all tokens from the cache for this application for the provided
   * account.
   * @param {MSALRemoveAccountParams} params
   * @return {Promise<void>} A promise which resolves if remove is successful,
   * otherwise rejects
   */
  public removeAccount = (params: MSALRemoveAccountParams): Promise<void> => {
    return RNMSAL.removeAccount({ clientId: this.clientId, ...params });
  };

  /**
   * NOTE: iOS only. On Android this is the same as `removeAccount`
   * Removes all tokens from the cache for this application for the provided
   * account. Additionally, this will remove the account from the system browser.
   * @param {MSALSignoutParams} params
   * @return {Promise<void>} A promise which resolves if sign out is successful,
   * otherwise rejects
   * @platform ios
   */
  public signout = (params: MSALSignoutParams): Promise<void> => {
    return Platform.OS === 'ios' ? RNMSAL.signout({ clientId: this.clientId, ...params }) : this.removeAccount(params);
  };
}
