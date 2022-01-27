import { Platform } from 'react-native';
import PublicClientApplication from 'react-native-msal';
import type {
  MSALAccount,
  MSALConfiguration,
  MSALInteractiveParams,
  MSALResult,
  MSALSignoutParams,
  MSALSilentParams,
  MSALWebviewParams,
} from 'react-native-msal';

export interface B2CPolicies {
  signInSignUp: string;
  passwordReset?: string;
}

export type B2CConfiguration = Omit<MSALConfiguration, 'auth'> & {
  auth: {
    clientId: string;
    authorityBase: string;
    policies: B2CPolicies;
    redirectUri?: string;
  };
};
export type B2CSignInParams = Omit<MSALInteractiveParams, 'authority'>;
export type B2CSilentParams = Pick<MSALSilentParams, 'scopes' | 'forceRefresh'>;
export type B2CSignOutParams = Pick<MSALSignoutParams, 'signoutFromBrowser' | 'webviewParameters'>;

export class B2CClient {
  private static readonly B2C_PASSWORD_CHANGE = 'AADB2C90118';
  private static readonly B2C_EXPIRED_GRANT = 'AADB2C90080';
  private readonly policyUrls: B2CPolicies;
  private pca: PublicClientApplication;

  /** Construct a B2CClient object
   * @param b2cConfig The configuration object for the B2CClient
   */
  constructor(b2cConfig: B2CConfiguration) {
    const { authorityBase, policies, ...restOfAuthConfig } = b2cConfig.auth;
    this.policyUrls = makePolicyUrls(authorityBase, policies);

    // Set the sign in sign up policy as the default authority for the PublicClientApplication (PCA).
    const authority = this.policyUrls.signInSignUp;

    // We need to provide all authorities we'll be using up front.
    // The default authority should be included in this list.
    const knownAuthorities = Object.values(this.policyUrls);

    this.pca = new PublicClientApplication({
      ...b2cConfig,
      auth: { authority, knownAuthorities, ...restOfAuthConfig },
    });
  }

  public async init() {
    await this.pca.init();
    return this;
  }

  /** Initiates an interactive sign-in. If the user clicks "Forgot Password", and a reset password policy
   *  was provided to the client, it will initiate the password reset flow
   */
  public async signIn(params: B2CSignInParams): Promise<MSALResult> {
    const isSignedIn = await this.isSignedIn();
    if (isSignedIn) {
      throw Error('A user is already signed in');
    }

    try {
      // If we don't provide an authority, the PCA will use the one we passed to it when we created it
      // (the sign in sign up policy)
      const result = await this.pca.acquireToken(params);
      if (!result) {
        throw new Error('Could not sign in: Result was undefined.');
      }
      return result;
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message.includes(B2CClient.B2C_PASSWORD_CHANGE) &&
        this.policyUrls.passwordReset
      ) {
        return await this.resetPassword(params);
      } else {
        throw error;
      }
    }
  }

  /** Gets a token silently. Will only work if the user is already signed in */
  public async acquireTokenSilent(params: B2CSilentParams) {
    const account = await this.getAccountForPolicy(this.policyUrls.signInSignUp);
    if (account) {
      // We provide the account that we got when we signed in, with the matching sign in sign up authority
      // Which again, we set as the default authority so we don't need to provide it explicitly.
      try {
        const result = await this.pca.acquireTokenSilent({ ...params, account });
        if (!result) {
          throw new Error('Could not acquire token silently: Result was undefined.');
        }
        return result;
      } catch (error: unknown) {
        if (error instanceof Error && error.message.includes(B2CClient.B2C_EXPIRED_GRANT)) {
          await this.pca.signOut({ ...params, account });
          return await this.signIn(params);
        } else {
          throw error;
        }
      }
    } else {
      throw Error('Could not find existing account for sign in sign up policy');
    }
  }

  /** Returns true if a user is signed in, false if not */
  public async isSignedIn() {
    const signInAccount = await this.getAccountForPolicy(this.policyUrls.signInSignUp);
    return signInAccount !== undefined;
  }

  /** Removes all accounts from the device for this app. User will have to sign in again to get a token */
  public async signOut(params?: B2CSignOutParams) {
    const accounts = await this.pca.getAccounts();
    const signOutPromises = accounts.map((account) => this.pca.signOut({ ...params, account }));
    await Promise.all(signOutPromises);
    return true;
  }

  private async resetPassword(params: B2CSignInParams) {
    const { webviewParameters: wvp, ...rest } = params;
    const webviewParameters: MSALWebviewParams = {
      ...wvp,
      // We use an ephemeral session because if we're resetting a password it means the user
      // is not using an identity provider, so we don't need a logged-in browser session
      ios_prefersEphemeralWebBrowserSession: true,
    };
    if (this.policyUrls.passwordReset) {
      // Because there is no prompt before starting an iOS ephemeral session, it will be quick to
      // open and begin before the other one has ended, causing an error saying that only one
      // interactive session is allowed at a time. So we have to slow it down a little
      if (Platform.OS === 'ios') {
        await delay(1000);
      }
      // Use the password reset policy in the interactive `acquireToken` call
      const authority = this.policyUrls.passwordReset;
      await this.pca.acquireToken({ ...rest, webviewParameters, authority });
      // Sign in again after resetting the password
      return await this.signIn(params);
    } else {
      throw Error('B2CClient missing password reset policy');
    }
  }

  private async getAccountForPolicy(policyUrl: string): Promise<MSALAccount | undefined> {
    const policy = policyUrl.split('/').pop();
    const accounts = await this.pca.getAccounts();
    return accounts.find((account) => account.identifier.includes(policy!.toLowerCase()));
  }
}

function makeAuthority(authorityBase: string, policyName: string) {
  return `${authorityBase}/${policyName}`;
}

function makePolicyUrls(authorityBase: string, policyNames: B2CPolicies): B2CPolicies {
  return Object.entries(policyNames).reduce(
    (prev, [key, policyName]) => ({ ...prev, [key]: makeAuthority(authorityBase, policyName) }),
    {} as B2CPolicies
  );
}

async function delay(ms: number) {
  return await new Promise<void>((resolve) => setTimeout(resolve, ms));
}
