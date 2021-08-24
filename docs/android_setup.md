# Android Setup

1. Register a redirect URI for your application for Android in the Azure Portal. It will have the following pattern: `msauth://<PACKAGE_NAME>/<BASE64_URL_ENCODED_PACKAGE_SIGNATURE>`.

   1. Navigate to your tenant in the Azure Portal.
   1. Under "Platform configurations", click "Add a platform".
   1. Click "Android".
   1. Enter your app's Package Name and Signature Hash. There are instructions on how to get both. See the [MSAL FAQ](https://github.com/AzureAD/microsoft-authentication-library-for-android/wiki/MSAL-FAQ#redirect-uri-issues) for more details on how to get the Signature Hash. If you have Automatic App Signing turned on, you will find a SHA1 hash in your Google Play Console, under Release Management > App Signing > App Signing Certificate. To convert that to a base64 encoded string use the following command:  
      `$ echo -n "<YOUR_SHA1_SIGNATURE>" | openssl dgst -binary -sha1 | openssl base64`
   1. Click "Configure".
   1. Based on the JSON configuration presented to you in the portal, in your app code you can make an MSALConfiguration object which is passed into the `PublicClientApplication` constructor. To determine authority urls from the JSON `authorities` property, and for more information about the JSON, please see [here](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-configuration#map-aad-authority--audience-to-microsoft-identity-platform-endpoints).

   **NOTE:** Make sure when creating a new instance of the `PublicClientApplication` that you pass a redirect uri that contains the (url encoded) signature hash

   ```js
   const pca = new PublicClientApplication({
      auth: { ...
         redirectUri: Platform.select({
               android: 'msauth://<package name>/<base64 url encoded package signature hash>', // ex: "msauth://com.package/Xo8WBi6jzSxKDVR4drqm84yr9iU%3D"
               default: undefined
         }),
      }
   });
   ```

1. Add the BrowserTabActivity activity with an intent-filter using your redirect URI to your `AndroidManifest.xml` file, as described in Step 2 [here](https://github.com/AzureAD/microsoft-authentication-library-for-android#step-3-configure-the-androidmanifestxml).
   **Note**: The `android:path` attribute value should start with a forward slash (`/`) and the Signature Hash should **NOT** be URL encoded.

This is the Android setup for the example app in this repository:
![Android setup in code and portal](/_assets/rnmsal_android_setup.png)
