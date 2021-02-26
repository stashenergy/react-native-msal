# iOS Setup

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
