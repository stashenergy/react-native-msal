import type { Configuration } from '@azure/msal-browser';

export interface IPublicClientApplication {
  init(): Promise<void>;
  acquireToken(params: MSALInteractiveParams): Promise<MSALResult>;
  acquireTokenSilent(params: MSALSilentParams): Promise<MSALResult>;
  getAccounts(): Promise<MSALAccount[]>;
  getAccount(accountIdentifier: string): Promise<MSALAccount>;
  removeAccount(account: MSALAccount): Promise<boolean>;
  signOut(params: MSALSignoutParams): Promise<boolean>;
}

export interface MSALConfiguration {
  auth: {
    clientId: string;
    authority?: string;
    knownAuthorities?: string[];
    redirectUri?: string;
  };
  /**
   * @platform web
   */
  cache?: Configuration['cache'] & { cacheLocation?: 'localStorage' | 'sessionStorage' };
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
