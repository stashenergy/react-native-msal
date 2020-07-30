# react-native-msal

[![npm latest version](https://img.shields.io/npm/v/react-native-msal/latest.svg)](https://www.npmjs.com/package/react-native-msal)
![ci status](https://github.com/stashenergy/react-native-msal/workflows/CI/badge.svg)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

<p align="center">
  <img src="_assets/ReactNativeMSALLogo.png" width="300">
</p>

## Getting started

Requires React Native >=0.61

`$ yarn add react-native-msal`

## Common setup

1. Register your application in the Azure Portal
2. Set up redirect URLs for your application in the portal. You will need one for both iOS and Android. They will have the following patterns:
   - iOS: `msauth.<BUNDLE_ID>://auth`.
     - ex: `msauth.com.example://auth`
   - Android: `msauth://<PACKAGE>/<BASE64_URL_ENCODED_PACKAGE_SIGNATURE>`
     - ex: `msauth://com.example/Xo8WBi6jzSxKDVR4drqm84yr9iU%3D`
     - Get your package signature from your `.keystore` file, or from the Google Play Console if you have automatic app signing turned on.
       - See the [MSAL FAQ](https://github.com/AzureAD/microsoft-authentication-library-for-android/wiki/MSAL-FAQ#redirect-uri-issues) for instructions on how to get the package signature from your `.keystore` file.
       - If you have automatic app signing turned on, you will find a SHA1 hash in your Google Play Console, under Release Management > App Signing > App Signing Certificate. To convert that to a base64 encoded string use the following command: `echo -n "<YOUR_SHA1_SIGNATURE>" | openssl dgst -binary -sha1 | openssl base64`.
   - Paste the base64 signature hash into the "Signature hash" field in the portal, and a redirect uri will be generated for you.

## Android Setup

1. Follow steps **2 and 3** of the [Using MSAL](https://github.com/AzureAD/microsoft-authentication-library-for-android#using-msal) section of the Android MSAL docs.
   **IMPORTANT**: For Step 2, you **MUST** create a file in your assets folder (`android/app/src/main/assets`) named `msal_config.json` containing your MSAL configuration. If you don't have an `assets` folder already, you will have to create one

## iOS Setup

1. Follow the steps detailed in the [Configuring MSAL](https://github.com/AzureAD/microsoft-authentication-library-for-objc#configuring-msal) section of the iOS MSAL docs

## Usage

See example usage in [`App.tsx` in the example app](./example/src/App.tsx)

```typescript
import MSALClient from 'react-native-msal';

const clientId = '<clientId>';
const authority = '<authority>';
const scopes = ['scope'];
const msalClient = new MSALClient(clientId);

// The first time signing in you must use this call to perform an interactive login
// Use the token from result.accessToken to call your API
// See when the token expires with result.expiresOn
// Store result.account.identifier for acquiring tokens silently or clearing the token cache
const result = await msalClient.acquireToken({
  authority,
  scopes,
});

// Acquire a token silently
// You may specify `forceRefresh: true` to force acquiring a brand new token
const result = await msalClient.acquireTokenSilent({
  authority,
  scopes,
  accountIdentifier: result.account.identifier,
});

// Removes all tokens from the cache for this application for the provided account
// A call to acquireToken will be required for acquiring subsequent access tokens
await msalClient.removeAccount({
  authority,
  accountIdentifier: result.account.identifier,
});

// Removes all tokens from the cache for this application for the provided account
// Additionally, this will remove the account from the system browser
// A call to acquireToken will be required for acquiring subsequent access tokens
// Only available on iOS platform, falls back to `removeAccount` on Android
await msalClient.signout({
  authority,
  accountIdentifier: result.account.identifier,
});
```

## Example

To run the example, first:

1. `yarn bootstrap`
2. Add the redirect URLs in your tenant:
   - Android: `msauth://com.example/P6akJ4YYsuUDahjqGra9mAflzdA%3D`
   - iOS: `msauth.com.example://auth`
3. Update the `msalConfig` object in `App.tsx` with your details

### Android

1. Edit the `msal_config.json` asset file to include your client id and authorities
2. `yarn example android`

### iOS

1. `yarn example ios`
