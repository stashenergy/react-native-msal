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

1. Register a redirect URI for your application for Android in the Azure Portal. It will have the following pattern: `msauth://<PACKAGE_NAME>/<BASE64_URL_ENCODED_PACKAGE_SIGNATURE>`.
   1. Navigate to your tenant in the Azure Portal.
   1. Under "Platform configurations", click "Add a platform".
   1. Click "Android".
   1. Enter your app's Package Name and Signature Hash. There are instructions on how to get both. See the [MSAL FAQ](https://github.com/AzureAD/microsoft-authentication-library-for-android/wiki/MSAL-FAQ#redirect-uri-issues) for more details on how to get the Signature Hash. If you have Automatic App Signing turned on, you will find a SHA1 hash in your Google Play Console, under Release Management > App Signing > App Signing Certificate. To convert that to a base64 encoded string use the following command:  
      `echo -n "<YOUR_SHA1_SIGNATURE>" | openssl dgst -binary -sha1 | openssl base64`
   1. Click "Configure".
   1. Copy the generated MSAL Configuration to a new asset file called `msal_config.json` located in your assets folder (`android/app/src/main/assets`). More details about the configuration file found [here](https://github.com/AzureAD/microsoft-authentication-library-for-android#step-2-create-your-msal-configuration-file).  
      **Note**: as of this writing the copiable config in the portal is messed up. Only use the JSON object portion of the config.
   1. Also in your `msal_config.json`, add the property: `"account_mode": "MULTIPLE"`. This is required to use this library.
1. Configure your `AndroidManifest.xml` file as described [here](https://github.com/AzureAD/microsoft-authentication-library-for-android#step-3-configure-the-androidmanifestxml). This involves requesting a couple of permissions and configuring an intent filter using your Redirect URI.  
   **NOTE**: The `android:path` attribute value sould start with a forward slash (`/`) and the Signature Hash should **NOT** be URL encoded.

### iOS Setup

Follow the steps as described [here](https://github.com/AzureAD/microsoft-authentication-library-for-objc#configuring-msal). Steps include:

1. Register a redirect URI for your application for iOS in the Azure Portal. It should be in the following format: `msauth.[BUNDLE_ID]://auth`
   1. Navigate to your tenant in the Azure Portal.
   1. Under "Platform configurations", click "Add a platform".
   1. Click "iOS / macOS".
   1. Enter your app's Bundle ID.
   1. Click "Configure".
   1. Click "Done"
1. Add a keychain group to your project Capabilities called `com.microsoft.adalcache`
1. Add your application's redirect URI scheme to your `Info.plist` file, which will be in the format of msauth.[BUNDLE_ID]
1. Add LSApplicationQueriesSchemes to allow making call to Microsoft Authenticator if installed.
1. Add the provided code in your AppDelegate.m to handle MSAL callbacks. Make sure you `#import <MSAL/MSAL.h>`

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

## Migrating from v2 to v3

See breaking changes in [CHANGELOG.md](CHANGELOG.md#300).
