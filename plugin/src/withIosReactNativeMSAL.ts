import { ConfigPlugin, withInfoPlist, withEntitlementsPlist, withPlugins, withAppDelegate } from '@expo/config-plugins';

const withIosUrlScheme: ConfigPlugin = (config) => {
  if (!config.ios?.bundleIdentifier) {
    throw new Error('ios.bundleIdentifier is required in your expo config');
  }

  const QUERY_SCHEMES = ['msauthv2', 'msauthv3'];
  const URL_SCHEME = { CFBundleURLSchemes: [`msauth.${config.ios.bundleIdentifier}`] };

  return withInfoPlist(config, (mod) => {
    mod.modResults.CFBundleURLTypes = [URL_SCHEME, ...(mod.modResults.CFBundleURLTypes || [])];
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
  if (!appDelegate.includes('#import <MSAL/MSAL.h>')) {
    const [firstLine, ...restOfLines] = appDelegate.split('\n');
    appDelegate = firstLine + '\n\n#import <MSAL/MSAL.h>\n' + restOfLines.join('\n');
  }

  const msalHandleResponseMethod =
    '[MSALPublicClientApplication handleMSALResponse:url sourceApplication:options[UIApplicationOpenURLOptionsSourceApplicationKey]]';

  if (appDelegate.includes(msalHandleResponseMethod)) {
    return appDelegate;
  }

  const linkingMethodReturn = 'return [RCTLinkingManager application:application openURL:url options:options];';
  const newReturn = `if ([MSALPublicClientApplication handleMSALResponse:url sourceApplication:options[UIApplicationOpenURLOptionsSourceApplicationKey]]) {
    return true;
  }
  ${linkingMethodReturn}`;
  appDelegate = appDelegate.replace(linkingMethodReturn, newReturn);
  return appDelegate;
}

export const withIosReactNativeMSAL: ConfigPlugin = (config) => {
  return withPlugins(config, [withIosUrlScheme, withIosKeychainGroup, withAppDelegateConfig]);
};
