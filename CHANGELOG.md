# CHANGELOG

## 4.0.0-beta.6

### Breaking changes

- `acquireToken`, `acquireTokenSilent`, and `getAccount` may return `Promise<undefined>`. This matches what the underlying native libraries return.
- The Android `msal_config.json` file that was previously required is no longer needed and is ignored. You can safely delete this file. All options are now configurable in the config object which is passed to the `PublicClientApplication` constructor
- The `PublicClientApplication` constructor no longer takes a second `init` boolean argument, and initialization must be done manually by calling the `init` method:
  ```diff
  -const pca = new PublicClientApplication(config, false)
  +const pca = new PublicClientApplication(config) // No longer initializes client. You must do this manually 👇
  try {
    await pca.init();
  } catch (error) {
    console.log("problem in configuration/setup:", error)
  }
  ```
- A new maven repository is required to be added to your project `build.gradle` (if you are using Expo this is done automatically for you):
  ```gradle
  allProjects {
    repositories {
      // ...
      maven {
        url "https://pkgs.dev.azure.com/MicrosoftDeviceSDK/DuoSDK-Public/_packaging/Duo-SDK-Feed/maven/v1"
      }
    }
  }
  ```

### Features

- Now supports Expo apps through a config plugin! To configure, please follow the [Expo setup guide](/docs/expo_setup.md)

## [3.0.0](https://github.com/stashenergy/react-native-msal/compare/v2.0.3...v3.0.0)

### Breaking changes

#### Default export

Default exported class renamed from `MSALClient` to `PublicClientApplication` and constructor now accepts an `MSALConfiguration` object instead of a `clientId` string.

```diff
-import MSALClient from 'react-native-msal';
+import MSALClient, { MSALConfiguration } from 'react-native-msal';
-const msalClient = new MSALClient(clientId);
+const config: MSALConfiguration = {
+    auth: {
+        clientId,
+    },
+};
+const msalClient = new MSALClient(config);
```

#### `MSALAccount` and `accountIdentifier` properties

The `MSALAccount` definition has been modified to include a new `Claims` dictionary. All methods that previously consumed the `identifier` from this type should now provide the entire `MSALAccount` object instead.

```diff
const result = msalClient.acquireTokenSilent({
  authority,
  scopes,
- accountIdentifier: account.identifier,
+ account,
});
```

#### `signOut` method

The `signout` method has been renamed `signOut` and `authority` removed from the `MSALSignoutParams`.

```diff
-await msalClient.signout({
-  authority,
+await msalClient.signOut({
```

#### `removeAccount` method

`MSALRemoveAccountParams` has been removed and so the `removeAccount` method only requires the `account`.

```diff
-await msalClient.removeAccount({
+await msalClient.removeAccount(
-  authority,
   account,
-})
+)
```

#### Webview parameters

`ios_prefersEphemeralWebBrowserSession` has moved from `acquireToken()` and `signOut()` parameters into the new `webviewParameters` in `MSALInteractiveParams` and `MSALSignoutParams` respectively.

```diff
-ios_prefersEphemeralWebBrowserSession: true,
+webviewParameters: {
+  ios_prefersEphemeralWebBrowserSession: true,
+},
```

#### `expiresOn`

`MSALResult.expiresOn` now returns a value in seconds instead of milliseconds.

#### `MSALResult` interface

The result returned from an `acquireToken` or `acquireTokenSilent` call no longer has an `authority` property.

#### Azure AD B2C usage

See [example/src/b2cClient.ts](https://github.com/stashenergy/react-native-msal/blob/beta/example/src/b2cClient.ts), but at the very least, `knownAuthorities` should be added to the initial client constructor.

#### Testing

You'll need to mock the PublicClientApplication class for testing purposes. One way to do this:

```typescript
// yourtestfile.test.ts
import PublicClientApplication from 'react-native-msal';
jest.mock('react-native-msal');

const MockPublicClientApplication = PublicClientApplication as jest.MockedClass<PublicClientApplication>;

it('Creates a mock instance without calling native functions', () => {
  const mockPca = new MockPublicClientApplication({ auth: { clientId: '1234' } });
  expect(MockPublicClientApplication).toHaveBeenCalledTimes(1);
  expect(mockPca).not.toBeNull();
});
```
