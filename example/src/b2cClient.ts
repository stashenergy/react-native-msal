import PublicClientApplication, {
  MSALInteractiveParams,
  MSALResult,
  MSALSilentParams,
  MSALAccount,
  MSALSignoutParams,
  MSALWebviewParams,
  MSALConfiguration,
} from 'react-native-msal';
import { Platform } from 'react-native';

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
export type B2CAcquireTokenSilentParams = Pick<MSALSilentParams, 'forceRefresh' | 'scopes'>;
export type B2CSignOutParams = Pick<MSALSignoutParams, 'signoutFromBrowser' | 'webviewParameters'>;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default class B2CClient {
  private static readonly B2C_PASSWORD_CHANGE = 'AADB2C90118';
  private static readonly B2C_EXPIRED_GRANT = 'AADB2C90080';
  private pca: PublicClientApplication;

  /** Construct a B2CClient object
   * @param clientId The id of the b2c application
   * @param authorityBase The authority URL, without a policy name.
   * Has the form: https://TENANT_NAME.b2clogin.com/tfp/TENANT_NAME.onmicrosoft.com/
   * @param policies An object containing the policies you will be using.
   * The sign in sign up policy is required, the rest are optional
   */
  constructor(private readonly config: B2CConfiguration) {
    // Set the default authority for the PublicClientApplication (PCA). If we don't provide one,
    // it will use the default, common authority
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { authorityBase: _, policies, ...restOfAuthConfig } = this.config.auth;
    const authority = this.getAuthority(policies.signInSignUp);
    // We need to provide all authorities we'll be using up front
    const knownAuthorities = Object.values(policies).map((policy) => this.getAuthority(policy));
    // Instantiate the PCA
    this.pca = new PublicClientApplication({
      ...this.config,
      auth: { authority, knownAuthorities, ...restOfAuthConfig },
    });
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
      return await this.pca.acquireToken(params);
    } catch (error) {
      if (error.message.includes(B2CClient.B2C_PASSWORD_CHANGE) && this.config.auth.policies.passwordReset) {
        return await this.resetPassword(params);
      } else {
        throw error;
      }
    }
  }

  /** Gets a token silently. Will only work if the user is already signed in */
  public async acquireTokenSilent(params: B2CAcquireTokenSilentParams) {
    const account = await this.getAccountForPolicy(this.config.auth.policies.signInSignUp);
    if (account) {
      // We provide the account that we got when we signed in, with the matching sign in sign up authority
      // Which again, we set as the default authority so we don't need to provide it explicitly.
      try {
        return await this.pca.acquireTokenSilent({ ...params, account });
      } catch (error) {
        if (error.message.includes(B2CClient.B2C_EXPIRED_GRANT)) {
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
    const signInAccount = await this.getAccountForPolicy(this.config.auth.policies.signInSignUp);
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
    if (this.config.auth.policies.passwordReset) {
      // Because there is no prompt before starting an iOS ephemeral session, it will be quick to
      // open and begin before the other one has ended, causing an error saying that only one
      // interactive session is allowed at a time. So we have to slow it down a little
      if (Platform.OS === 'ios') {
        await delay(1000);
      }
      // Use the password reset policy in the interactive `acquireToken` call
      const authority = this.getAuthority(this.config.auth.policies.passwordReset);
      await this.pca.acquireToken({ ...rest, webviewParameters, authority });
      // Sign in again after resetting the password
      return await this.signIn(params);
    } else {
      throw Error('B2CClient missing password reset policy');
    }
  }

  private async getAccountForPolicy(policy: string): Promise<MSALAccount | undefined> {
    const accounts = await this.pca.getAccounts();
    return accounts.find((account) => account.identifier.includes(policy.toLowerCase()));
  }

  private getAuthority(policy: string) {
    return `${this.config.auth.authorityBase}/${policy}`;
  }
}
