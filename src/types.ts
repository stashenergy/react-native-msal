export interface MSALConfiguration {
  auth: {
    clientId: string;
    authority?: string;
    knownAuthorities?: string[];
    redirectUri?: string;
  };
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

export enum MSALPromptType {
  SELECT_ACCOUNT,
  LOGIN,
  CONSENT,
  WHEN_REQUIRED,
  DEFAULT = WHEN_REQUIRED,
}

export interface MSALWebviewParams {
  /** iOS 13+. See https://azuread.github.io/microsoft-authentication-library-for-objc/Classes/MSALWebviewParameters.html */
  ios_prefersEphemeralWebBrowserSession?: boolean;
}
