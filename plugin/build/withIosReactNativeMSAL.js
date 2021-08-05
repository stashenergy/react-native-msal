"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withIosReactNativeMSAL = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const withIosUrlScheme = (config) => {
    var _a;
    const QUERY_SCHEMES = ['msauthv2', 'msauthv3'];
    const URL_SCHEME = { CFBundleURLSchemes: [`msauth.${(_a = config.ios) === null || _a === void 0 ? void 0 : _a.bundleIdentifier}`] };
    return config_plugins_1.withInfoPlist(config, (mod) => {
        var _a;
        mod.modResults.CFBundleURLTypes = [...(mod.modResults.CFBundleURLTypes || []), URL_SCHEME];
        mod.modResults.LSApplicationQueriesSchemes = [
            ...new Set(((_a = mod.modResults.LSApplicationQueriesSchemes) !== null && _a !== void 0 ? _a : []).concat(QUERY_SCHEMES)),
        ];
        return mod;
    });
};
const withIosKeychainGroup = (config) => {
    const KEYCHAIN_GROUP = '$(AppIdentifierPrefix)com.microsoft.adalcache';
    return config_plugins_1.withEntitlementsPlist(config, (mod) => {
        const existingAccessGroups = (mod.modResults['keychain-access-groups'] || []);
        mod.modResults['keychain-access-groups'] = [...new Set(existingAccessGroups.concat(KEYCHAIN_GROUP))];
        return mod;
    });
};
const withAppDelegateConfig = (config) => {
    return config_plugins_1.withAppDelegate(config, (mod) => {
        if (mod.modResults.language === 'objc') {
            mod.modResults.contents = setAppDelegate(mod.modResults.contents);
        }
        else {
            throw new Error('Cannot modify AppDelegate because it is not in objective-c');
        }
        return mod;
    });
};
function setAppDelegate(appDelegate) {
    if (appDelegate.includes('#import <MSAL/MSAL.h>')) {
        return appDelegate;
    }
    const [firstLine, ...restOfLines] = appDelegate.split('\n');
    appDelegate = firstLine + '\n\n#import <MSAL/MSAL.h>\n' + restOfLines.join('\n');
    appDelegate = appDelegate.replace('@end', `- (BOOL)application:(UIApplication *)app
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
    return [MSALPublicClientApplication handleMSALResponse:url
                                         sourceApplication:options[UIApplicationOpenURLOptionsSourceApplicationKey]];
}

@end`);
    return appDelegate;
}
const withIosReactNativeMSAL = (config) => {
    return config_plugins_1.withPlugins(config, [withIosUrlScheme, withIosKeychainGroup, withAppDelegateConfig]);
};
exports.withIosReactNativeMSAL = withIosReactNativeMSAL;
