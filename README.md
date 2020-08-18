# react-native-msal

[![npm latest version](https://img.shields.io/npm/v/react-native-msal/latest.svg)](https://www.npmjs.com/package/react-native-msal)
[![npm beta version](https://img.shields.io/npm/v/react-native-msal/beta.svg)](https://www.npmjs.com/package/react-native-msal)
![ci status](https://github.com/stashenergy/react-native-msal/workflows/CI/badge.svg)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

<p align="center">
  <img src="_assets/ReactNativeMSALLogo.png" width="300">
</p>

## Getting started

Requires React Native >=0.61

`$ yarn add react-native-msal`

## Setup

### Common Setup

Before setting up your React Native app, you must register your application in the Azure Portal.

### Android Setup

1. Register a redirect URI for your application for Android in the Azure Portal. It will have the following pattern: `msauth://<PACKAGE>/<BASE64_URL_ENCODED_PACKAGE_SIGNATURE>`.
   - Get your package signature from your `.keystore` file, or from the Google Play Console if you have automatic app signing turned on.
     - See the [MSAL FAQ](https://github.com/AzureAD/microsoft-authentication-library-for-android/wiki/MSAL-FAQ#redirect-uri-issues) for instructions on how to get the package signature from your `.keystore` file.
     - If you have automatic app signing turned on, you will find a SHA1 hash in your Google Play Console, under Release Management > App Signing > App Signing Certificate. To convert that to a base64 encoded string use the following command: `echo -n "<YOUR_SHA1_SIGNATURE>" | openssl dgst -binary -sha1 | openssl base64`.
     - Paste the base64 signature hash into the "Signature hash" field in the portal, and a redirect uri will be generated for you.
1. Create your MSAL configuration file as described [here](https://github.com/AzureAD/microsoft-authentication-library-for-android#step-2-create-your-msal-configuration-file). **IMPORTANT**: You **MUST** create a file in your assets folder (`android/app/src/main/assets`) named `msal_config.json` containing your MSAL configuration. If you don't have an `assets` folder already, you will need to create one.
1. Configure your `AndroidManifest.xml` file as described [here](https://github.com/AzureAD/microsoft-authentication-library-for-android#step-3-configure-the-androidmanifestxml).

### iOS Setup

Follow the steps as described [here](https://github.com/AzureAD/microsoft-authentication-library-for-objc#configuring-msal). Steps include:

1. Register a redirect URI for your application for iOS in the Azure Portal. It should be in the following format: `msauth.[BUNDLE_ID]://auth`
1. Add a keychain group to your project Capabilities called `com.microsoft.adalcache`
1. Add your application's redirect URI scheme to your `Info.plist` file, which will be in the format of msauth.[BUNDLE_ID]
1. Add LSApplicationQueriesSchemes to allow making call to Microsoft Authenticator if installed.
1. Add the provided code in your AppDelegate.m to handle MSAL callbacks

## Usage

### `PublicClientApplication` class

This class is designed to be a thin wrapper around the native functionality of the Android and iOS MSAL libraries.

#### Creating an instance

```typescript
const config: MSALConfiguration = {
  auth: {
    clientId: 'your-client-id',
    // authority: 'default-authority',
  },
};
const pca = new PublicClientApplication(config);
```

If you don't provide an authority, the common one will be used. This authority will be used as the default for calls to `acquireToken` and `acquireTokenSilent`.

#### Signing in interactively

```typescript
const params: MSALInteractiveParams = {
  scopes: ['scope1', 'scope2'],
};
const result: MSALResult = await pca.acquireToken(params);
```

You must use this method before any calls to `acquireTokenSilent`.
Use the `accessToken` from the MSALResult to call your API.
Store the `account` from the result for acquiring tokens silently or for removing the account.

#### Acquiring tokens silently

```typescript
const params: MSALSilentParams = {
  scopes: ['scope1', 'scope2'],
  account: result.account,
  // forceRefresh: true,
};
const result = await pca.acquireTokenSilent(params);
```

You can force the token to refresh with the `forceRefresh` option

#### Listing all accounts for which the application has refresh tokens

```typescript
const accounts: MSALAccount[] = await pca.getAccounts();
```

Instead of storing the `account` from a MSALResult for an `acquireTokenSilent` method call, you can filter the MSALAccount[] result for a particular account and use it.

#### Signing out

```typescript
const res: boolean = await pca.removeAccount(result.account);
```

Alternatively, you can call the `signOut` method:

```typescript
const params: MSALSignoutParams = {
  account: result.account,
  // signoutFromBrowser: true
};
const res: boolean = await pca.signOut(params);
```

On Android, this is the same as `removeAccount`, but on iOS, if you call it with `signoutFromBrowser: true`, it will sign you out of the browser as well.

### B2C Applications

The `PublicClientApplication` class is a bit too bare bones for dealing with a B2C application, and you will need to write a bit of code to get the desired behavior.

To address this issue, the example app that is included in this repository includes a [`B2CClient` class](./example/src/b2cClient.ts) which contains a lot of the functionality you will need for a B2C app. You can copy this class right into your own React Native app and modify it to your liking. You can see it being used in the example's [`App.tsx`](./example/src/App.tsx)

If you would like to see this class included in the library itself, please create an issue requesting so.

## Example

As mentioned above, the example app demonstrates a B2C implementation

To run the example, first:

1. `yarn bootstrap`
2. Register the redirect URLs in your tenant:
   - Android: `msauth://com.example/P6akJ4YYsuUDahjqGra9mAflzdA%3D`
   - iOS: `msauth.com.example://auth`
3. Update the `b2cConfig` object in `msalConfig.ts` with your details

### Android

1. Edit the `msal_config.json` asset file to include your client id and authorities
2. `yarn example android`

### iOS

1. `yarn example ios`
