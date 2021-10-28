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

export class PublicClientApplication implements IPublicClientApplication {
  private _pca: MSALPublicClientApplication;

  constructor(private readonly config: MSALConfiguration) {
    this._pca = new MSALPublicClientApplication(this.config);
  }

  public async init() {
    return this;
  }

  public async acquireToken(params: MSALInteractiveParams) {
    const { promptType, ...paramsWithoutPromptType } = params;
    const { accessToken, account, expiresOn, idToken, idTokenClaims, scopes, tenantId } =
      await this._pca.acquireTokenPopup(
        promptType ? { ...paramsWithoutPromptType, prompt: promptTypeToString(promptType) } : paramsWithoutPromptType
      );
    const result: MSALResult = {
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
    return result;
  }

  public async acquireTokenSilent(params: MSALSilentParams) {
    const { accessToken, account, expiresOn, idToken, idTokenClaims, scopes, tenantId } =
      await this._pca.acquireTokenSilent({
        ...params,
        account: {
          ...params.account,
          homeAccountId: params.account.identifier,
          environment: params.account.environment ?? '',
          localAccountId: '',
        },
      });
    const result: MSALResult = {
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
    return result;
  }

  public getAccounts() {
    const accounts = this._pca.getAllAccounts();
    return Promise.resolve(
      accounts.map((a) => {
        const { homeAccountId: identifier, environment, tenantId, username } = a;
        const account: MSALAccount = { identifier, environment, tenantId, username };
        return account;
      })
    );
  }

  public getAccount(accountIdentifier: string) {
    const account = this._pca.getAccountByHomeId(accountIdentifier);
    if (account == null) {
      return Promise.reject(Error('Account not found'));
    } else {
      const { homeAccountId: identifier, environment, tenantId, username } = account;
      const msalAccount: MSALAccount = { identifier, environment, tenantId, username };
      return Promise.resolve(msalAccount);
    }
  }

  public async removeAccount(account: MSALAccount) {
    await this._pca.logoutRedirect({
      account: {
        ...account,
        homeAccountId: account.identifier,
        environment: account.environment ?? '',
        localAccountId: '',
      },
    });
    return true;
  }

  public async signOut(params: MSALSignoutParams) {
    return await this.removeAccount(params.account);
  }
}

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
