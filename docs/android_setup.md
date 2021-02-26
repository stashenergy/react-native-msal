# Android Setup

1. Register a redirect URI for your application for Android in the Azure Portal. It will have the following pattern: `msauth://<PACKAGE_NAME>/<BASE64_URL_ENCODED_PACKAGE_SIGNATURE>`.
   1. Navigate to your tenant in the Azure Portal.
   1. Under "Platform configurations", click "Add a platform".
   1. Click "Android".
   1. Enter your app's Package Name and Signature Hash. There are instructions on how to get both. See the [MSAL FAQ](https://github.com/AzureAD/microsoft-authentication-library-for-android/wiki/MSAL-FAQ#redirect-uri-issues) for more details on how to get the Signature Hash. If you have Automatic App Signing turned on, you will find a SHA1 hash in your Google Play Console, under Release Management > App Signing > App Signing Certificate. To convert that to a base64 encoded string use the following command:  
      `$ echo -n "<YOUR_SHA1_SIGNATURE>" | openssl dgst -binary -sha1 | openssl base64`
   1. Click "Configure".
   1. Copy the generated MSAL Configuration to a new asset file called `msal_config.json` located in your assets folder (`android/app/src/main/assets`). More details about the configuration file found [here](https://github.com/AzureAD/microsoft-authentication-library-for-android#step-2-create-your-msal-configuration-file).  
      **Note**: as of this writing the copiable config in the portal is messed up. Only use the JSON object portion of the config.
   1. Also in your `msal_config.json`, add the property: `"account_mode": "MULTIPLE"`. This is required to use this library.
1. Configure your `AndroidManifest.xml` file as described [here](https://github.com/AzureAD/microsoft-authentication-library-for-android#step-3-configure-the-androidmanifestxml). This involves requesting a couple of permissions and configuring an intent filter using your Redirect URI.  
   **Note**: The `android:path` attribute value sould start with a forward slash (`/`) and the Signature Hash should **NOT** be URL encoded.

This is the Android setup for the example app in this repository:
![Android setup in code and portal](/_assets/rnmsal_android_setup.png)
