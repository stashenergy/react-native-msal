import { ConfigPlugin, withInfoPlist, withEntitlementsPlist, withPlugins, withAppDelegate } from '@expo/config-plugins';

const withIosUrlScheme: ConfigPlugin = (config) => {
  const QUERY_SCHEMES = ['msauthv2', 'msauthv3'];
  const URL_SCHEME = { CFBundleURLSchemes: [`msauth.${config.ios?.bundleIdentifier}`] };

  return withInfoPlist(config, (mod) => {
    mod.modResults.CFBundleURLTypes = [...(mod.modResults.CFBundleURLTypes || []), URL_SCHEME];
    mod.modResults.LSApplicationQueriesSchemes = [
      ...new Set((mod.modResults.LSApplicationQueriesSchemes ?? []).concat(QUERY_SCHEMES)),
    ];
    return mod;
  });
};

const withIosKeychainGroup: ConfigPlugin = (config) => {
  const KEYCHAIN_GROUP = '$(AppIdentifierPrefix)com.microsoft.adalcache';

  return withEntitlementsPlist(config, (mod) => {
    const existingAccessGroups = (mod.modResults['keychain-access-groups'] || []) as string[];
    mod.modResults['keychain-access-groups'] = [...new Set(existingAccessGroups.concat(KEYCHAIN_GROUP))];
    return mod;
  });
};

const withAppDelegateConfig: ConfigPlugin = (config) => {
  return withAppDelegate(config, (mod) => {
    if (mod.modResults.language === 'objc') {
      mod.modResults.contents = setAppDelegate(mod.modResults.contents);
    } else {
      throw new Error('Cannot modify AppDelegate because it is not in objective-c');
    }
    return mod;
  });
};

function setAppDelegate(appDelegate: string) {
  if (appDelegate.includes('#import <MSAL/MSAL.h>')) {
    return appDelegate;
  }
  const [firstLine, ...restOfLines] = appDelegate.split('\n');
  appDelegate = firstLine + '\n\n#import <MSAL/MSAL.h>\n' + restOfLines.join('\n');
  appDelegate = appDelegate.replace(
    '@implementation AppDelegate\n',
    `@implementation AppDelegate

- (BOOL)application:(UIApplication *)app
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
    return [MSALPublicClientApplication handleMSALResponse:url
                                         sourceApplication:options[UIApplicationOpenURLOptionsSourceApplicationKey]];
}
`
  );
  return appDelegate;
}

export const withIosReactNativeMSAL: ConfigPlugin = (config) => {
  return withPlugins(config, [withIosUrlScheme, withIosKeychainGroup, withAppDelegateConfig]);
};
