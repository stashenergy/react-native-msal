"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAndroidReactNativeMSAL = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const { getMainApplicationOrThrow } = config_plugins_1.AndroidConfig.Manifest;
const withAndroidActivity = (config, signatureHash) => {
    return config_plugins_1.withAndroidManifest(config, (mod) => {
        mod.modResults = setBrowserTabActivity(config, mod.modResults, signatureHash);
        return mod;
    });
};
function setBrowserTabActivity(config, androidManifest, signatureHash) {
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
const withAndroidReactNativeMSAL = (config, { signatureHash }) => {
    return withAndroidActivity(config, signatureHash);
};
exports.withAndroidReactNativeMSAL = withAndroidReactNativeMSAL;
