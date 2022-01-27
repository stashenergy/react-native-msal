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
   * @return Promise containing array of MSALAccount objects for which this application
   * has refresh tokens.
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
    /**
     * The client ID of the application, this should come from the app developer portal.
     */
    clientId: string;
    /**
     * The authority the application will use to obtain tokens.
     */
    authority?: string;
    /**
     * List of known authorities that the application should trust.
     */
    knownAuthorities?: string[];
    /**
     * The redirect URI of the application.
     *
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
  /**
   * Permissions you want included in the access token received in the result.
   * Not all scopes are guaranteed to be included in the access token returned.
   */
  scopes: string[];
  /**
   * The authority that MSAL will use to obtain tokens. If not included, authority from
   * MSALConfiguration will be used.
   */
  authority?: string;
  /**
   * A specific prompt type for the interactive authentication flow.
   */
  promptType?: MSALPromptType;
  /**
   * A loginHint (usually an email) to pass to the service at the beginning of the
   * interactive authentication flow. The account returned is not guaranteed to match
   * the loginHint.
   */
  loginHint?: string;
  /**
   * Key-value pairs to pass to the /authorize and /token endpoints.
   */
  extraQueryParameters?: Record<string, string>;
  /**
   * Permissions you want the account to consent to in the same authentication flow,
   * but won’t be included in the returned access token.
   */
  extraScopesToConsent?: string[];
  /**
   * User Interface configuration that MSAL uses when getting a token interactively or
   * authorizing an end user.
   */
  webviewParameters?: MSALWebviewParams;
}

/**
 * OIDC prompt parameter that specifies whether the Authorization Server prompts the
 * End-User for reauthentication and consent.
 */
export enum MSALPromptType {
  /**
   * If no user is specified the authentication webview will present a list of users
   * currently signed in for the user to select among.
   */
  SELECT_ACCOUNT,
  /**
   * Require the user to authenticate in the webview.
   */
  LOGIN,
  /**
   * Require the user to consent to the current set of scopes for the request.
   */
  CONSENT,
  /**
   * The SSO experience will be determined by the presence of cookies in the webview and
   * account type. User won’t be prompted unless necessary. If multiple users are signed in,
   * select account experience will be presented.
   */
  WHEN_REQUIRED,
  /**
   * Default is MSALPromptType.WHEN_REQUIRED.
   */
  DEFAULT = WHEN_REQUIRED,
}

export interface MSALSilentParams {
  /**
   * Permissions you want included in the access token received in the result.
   * Not all scopes are guaranteed to be included in the access token returned.
   */
  scopes: string[];
  /**
   * An account object for which tokens should be returned.
   */
  account: MSALAccount;
  /**
   * The authority that MSAL will use to obtain tokens. If not included, authority from
   * MSALConfiguration will be used.
   */
  authority?: string;
  /**
   * Ignore any existing access token in the cache and force MSAL to get a new access token
   * from the service.
   */
  forceRefresh?: boolean;
}

export interface MSALSignoutParams {
  /**
   * The account object for which to sign out of.
   */
  account: MSALAccount;
  /**
   * Specifies whether signout should also open the browser and send a network request to the end_session_endpoint.
   * false by default.
   */
  signoutFromBrowser?: boolean;
  /**
   * User Interface configuration that MSAL uses when getting a token interactively or
   * authorizing an end user.
   */
  webviewParameters?: MSALWebviewParams;
}

export interface MSALResult {
  /**
   * The Access Token requested, or empty string if no access token is returned in response
   */
  accessToken: string;
  /**
   * The account object that holds account information.
   */
  account: MSALAccount;
  /**
   * The time that the access token returned in the accessToken property ceases to be valid.
   * This value is calculated based on current UTC time measured locally and the value expiresIn returned from the service
   */
  expiresOn: number;
  /**
   * The raw id token if it’s returned by the service or undefined if no id token is returned.
   */
  idToken?: string;
  /**
   * The scope values returned from the service.
   */
  scopes: string[];
  /**
   * Identifier for the directory where account is locally represented
   */
  tenantId?: string;
}

export interface MSALAccount {
  /**
   * Unique identifier for the account.
   */
  identifier: string;
  /**
   * Host part of the authority string used for authentication based on the issuer identifier.
   */
  environment?: string;
  /**
   * An identifier for the AAD tenant that the account was acquired from.
   */
  tenantId: string;
  /**
   * Shorthand name by which the End-User wishes to be referred to at the RP, such as janedoe or j.doe.
   */
  username: string;
  /**
   * ID token claims for the account. Can be used to read additional information about the account, e.g. name.
   */
  claims?: object;
}

/**
 * Mostly, if not all, iOS webview parameters
 * See https://azuread.github.io/microsoft-authentication-library-for-objc/Classes/MSALWebviewParameters.html
 */
export interface MSALWebviewParams {
  /**
   * A Boolean value that indicates whether the ASWebAuthenticationSession should ask the
   * browser for a private authentication session.
   * For more info see here: https://developer.apple.com/documentation/authenticationservices/aswebauthenticationsession/3237231-prefersephemeralwebbrowsersessio?language=objc
   * @platform iOS 13+
   */
  ios_prefersEphemeralWebBrowserSession?: boolean;
  /**
   * MSAL requires a web browser for interactive authentication.
   * There are multiple web browsers available to complete authentication.
   * MSAL will default to the web browser that provides best security and user experience for a given platform.
   * Ios_MSALWebviewType allows changing the experience by customizing the configuration to other options for
   * displaying web content
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
