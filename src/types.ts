import type { Configuration } from '@azure/msal-browser';

export interface IPublicClientApplication {
  /**
   * Acquire a token interactively
   * @param {MSALInteractiveParams} params
   * @return Result containing an access token and account identifier
   * used for acquiring subsequent tokens silently
   */
  acquireToken(params: MSALInteractiveParams): Promise<MSALResult | undefined>;

  /**
   * Acquire a token silently
   * @param {MSALSilentParams} params - Includes the account identifer retrieved from a
   * previous interactive login
   * @return Result containing an access token and account identifier
   * used for acquiring subsequent tokens silently
   */
  acquireTokenSilent(params: MSALSilentParams): Promise<MSALResult | undefined>;

  /**
   * Get all accounts for which this application has refresh tokens
   * @return Promise containing array of MSALAccount objects for which this application has refresh tokens.
   */
  getAccounts(): Promise<MSALAccount[]>;

  /**
   * Retrieve the account matching the identifier
   * @return Promise containing MSALAccount object
   */
  getAccount(accountIdentifier: string): Promise<MSALAccount | undefined>;

  /**
   * Removes all tokens from the cache for this application for the provided
   * account.
   * @param {MSALAccount} account
   * @return A promise containing a boolean = true if account removal was successful
   * otherwise rejects
   */
  removeAccount(account: MSALAccount): Promise<boolean>;

  /**
   * Removes all tokens from the cache for this application for the provided
   * account. Additionally, this will remove the account from the system browser.
   * NOTE: iOS only. On Android and web this is the same as `removeAccount`.
   * @param {MSALSignoutParams} params
   * @return A promise which resolves if sign out is successful,
   * otherwise rejects
   * @platform ios
   */
  signOut(params: MSALSignoutParams): Promise<boolean>;
}

export interface MSALConfiguration {
  auth: {
    clientId: string;
    authority?: string;
    knownAuthorities?: string[];
    /**
     * If you are providing this property, you should probably use `Platform.select`,
     * because the redirect uris will be different for each platform.
     */
    redirectUri?: string;
  };
  /**
   * @platform web
   */
  cache?: Configuration['cache'] & { cacheLocation?: 'localStorage' | 'sessionStorage' };
  /**
   * Options as described here: {@link https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-configuration}
   * @platform android
   */
  androidConfigOptions?: MSALAndroidConfigOptions;
}

export interface MSALAndroidConfigOptions {
  authorization_user_agent?: 'DEFAULT' | 'BROWSER' | 'WEBVIEW';
  broker_redirect_uri_registered?: boolean;
  browser_safelist?: {
    browser_package_name: string;
    browser_signature_hashes: string[];
    browser_use_customTab: boolean;
  }[];
  http?: {
    connect_timeout?: number;
    read_timeout?: number;
  };
  logging?: {
    pii_enabled?: boolean;
    log_level?: 'ERROR' | 'WARNING' | 'INFO' | 'VERBOSE';
    logcat_enabled?: boolean;
  };
  multiple_clouds_supported?: boolean;
}

export interface MSALInteractiveParams {
  scopes: string[];
  authority?: string;
  promptType?: MSALPromptType;
  loginHint?: string;
  extraQueryParameters?: Record<string, string>;
  extraScopesToConsent?: string[];
  webviewParameters?: MSALWebviewParams;
}

export enum MSALPromptType {
  SELECT_ACCOUNT,
  LOGIN,
  CONSENT,
  WHEN_REQUIRED,
  DEFAULT = WHEN_REQUIRED,
}

export interface MSALSilentParams {
  scopes: string[];
  account: MSALAccount;
  authority?: string;
  forceRefresh?: boolean;
}

export interface MSALSignoutParams {
  account: MSALAccount;
  signoutFromBrowser?: boolean;
  webviewParameters?: MSALWebviewParams;
}

export interface MSALResult {
  accessToken: string;
  account: MSALAccount;
  expiresOn: number;
  idToken?: string;
  scopes: string[];
  tenantId?: string;
}

export interface MSALAccount {
  identifier: string;
  environment?: string;
  tenantId: string;
  username: string;
  claims?: object;
}

/**
 * Mostly, if not all, iOS webview parameters
 * See https://azuread.github.io/microsoft-authentication-library-for-objc/Classes/MSALWebviewParameters.html
 */
export interface MSALWebviewParams {
  /**
   * A Boolean value that indicates whether the ASWebAuthenticationSession should ask the browser for a private authentication session.
   * For more info see here: https://developer.apple.com/documentation/authenticationservices/aswebauthenticationsession/3237231-prefersephemeralwebbrowsersessio?language=objc
   * @platform iOS 13+
   */
  ios_prefersEphemeralWebBrowserSession?: boolean;
  /**
   * MSAL requires a web browser for interactive authentication.
   * There are multiple web browsers available to complete authentication.
   * MSAL will default to the web browser that provides best security and user experience for a given platform.
   * Ios_MSALWebviewType allows changing the experience by customizing the configuration to other options for displaying web content
   * @platform iOS
   */
  ios_webviewType?: Ios_MSALWebviewType;
  /**
   * Note: Has no effect when ios_webviewType === `Ios_MSALWebviewType.DEFAULT` or
   * ios_webviewType === `Ios_MSALWebviewType.AUTHENTICATION_SESSION`
   * @platform iOS
   */
  ios_presentationStyle?: Ios_ModalPresentationStyle;
}

/**
 * See https://developer.apple.com/documentation/uikit/uimodalpresentationstyle
 */
export enum Ios_ModalPresentationStyle {
  fullScreen = 0,
  pageSheet,
  formSheet,
  currentContext,
  custom,
  overFullScreen,
  overCurrentContext,
  popover,
  blurOverFullScreen,
  none = -1,
  automatic = -2,
}

/**
 * See https://azuread.github.io/microsoft-authentication-library-for-objc/Enums/MSALWebviewType.html
 */
export enum Ios_MSALWebviewType {
  DEFAULT = 0,
  AUTHENTICATION_SESSION,
  SAFARI_VIEW_CONTROLLER,
  WK_WEB_VIEW,
}
