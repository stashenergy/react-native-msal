# react-native-msal

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
     - ex: `msauth.energy.stash.msal.example://auth`
   - Android: `msauth://<PACKAGE>/<BASE64_URL_ENCODED_PACKAGE_SIGNATURE>`
     - ex: `msauth://energy.stash.msal.example/ab%4E1lPIzBP2j9uELdUz%2BcarjgxQ%3D`
     - Get your package signature from your `*.keystore`, or from the Google Play console if you have automatic app signing turned on. For local debugging you can enter this command to read your `debug.keystore`:  
       `keytool -list -v -keystore path/to/debug.keystore -alias androiddebugkey -storepass android -keypass android`
     - Convert the SHA1 signature to base64:  
       `echo -n "<YOUR_SHA1_SIGNATURE>" | openssl dgst -binary -sha1 | openssl base64`
     - URL-encode the base64 string

## Android Setup

1. Follow steps **1 through 3** of the [Using MSAL](https://github.com/AzureAD/microsoft-authentication-library-for-android#using-msal) section of the Android MSAL docs.

2. In your `MainApplication.java`, put the following line at the end of the `onCreate` method to let the RNMSAL package know where your MSAL configuration file is:

   `RNMSALModule.setMsalConfigResourceId(R.raw.msal_config);`

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

// The first time signing in you must use this call to perform
// an interactive login
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

// Removes all tokens from the cache for the specified account
// A call to acquireToken will be required for acquiring subsequent access tokens
const result = await msalClient.removeAccount({
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

### Android

1. Edit the `msal_config.json` asset file to include your client id and authorities
2. `yarn example android`

### iOS

1. `yarn example ios`
