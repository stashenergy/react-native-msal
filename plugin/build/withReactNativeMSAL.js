"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const { getMainApplicationOrThrow } = config_plugins_1.AndroidConfig.Manifest;
// iOS
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
// Android
const withAndroidActivity = (config, signatureHash) => {
    return config_plugins_1.withAndroidManifest(config, (mod) => {
        mod.modResults = addBrowserTabActivity(config, mod.modResults, signatureHash);
        return mod;
    });
};
function addBrowserTabActivity(config, androidManifest, signatureHash) {
    var _a, _b, _c, _d;
    const BROWSER_TAB_ACTIVITY_NAME = 'com.microsoft.identity.client.BrowserTabActivity';
    const mainApplication = getMainApplicationOrThrow(androidManifest);
    let activity = (_a = mainApplication.activity) === null || _a === void 0 ? void 0 : _a.find((a) => a.$['android:name'] === BROWSER_TAB_ACTIVITY_NAME);
    if (!activity) {
        activity = { $: { 'android:name': BROWSER_TAB_ACTIVITY_NAME } };
        mainApplication.activity = [...((_b = mainApplication.activity) !== null && _b !== void 0 ? _b : []), activity];
    }
    activity['intent-filter'] = [
        {
            action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
            category: [
                { $: { 'android:name': 'android.intent.category.DEFAULT' } },
                { $: { 'android:name': 'android.intent.category.BROWSABLE' } },
            ],
            data: [
                {
                    $: {
                        'android:scheme': 'msauth',
                        'android:host': (_d = (_c = config.android) === null || _c === void 0 ? void 0 : _c.package) !== null && _d !== void 0 ? _d : androidManifest.manifest.$.package,
                        'android:path': `/${signatureHash}`,
                    },
                },
            ],
        },
    ];
    return androidManifest;
}
// ========================================
const withReactNativeMSAL = (config, { signatureHash }) => {
    return config_plugins_1.withPlugins(config, [withIosUrlScheme, withIosKeychainGroup, [withAndroidActivity, signatureHash]]);
};
exports.default = withReactNativeMSAL;
