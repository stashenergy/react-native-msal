# Expo Setup

1. Complete **step 1** of the [Android](./android_setup.md) and [iOS](./ios_setup.md) setup guides.
1. In your `app.json|app.config.js|app.config.ts`, add the `react-native-msal` plugin with the `androidPackageSignatureHash` parameter:

   ```json
   {
    ...
     "expo": {
       "plugins": [
        ...
         [
           "react-native-msal",
           {
             "androidPackageSignatureHash": "<base64 package signature hash>" // ex: "Xo8WBi6jzSxKDVR4drqm84yr9iU="
           }
         ]
       ]
     }
   }
   ```
