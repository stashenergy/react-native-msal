"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAndroidReactNativeMSAL = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const { getMainApplicationOrThrow } = config_plugins_1.AndroidConfig.Manifest;
const withAndroidActivity = (config, signatureHash) => {
    return (0, config_plugins_1.withAndroidManifest)(config, (mod) => {
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
// It's ok to have multiple allprojects.repositories, so we create a new one since it's cheaper than tokenizing
// the existing block to find the correct place to insert our dependency.
const gradleMaven = 'allprojects { repositories { maven { url "https://pkgs.dev.azure.com/MicrosoftDeviceSDK/DuoSDK-Public/_packaging/Duo-SDK-Feed/maven/v1" } } }';
const withAndroidMSALGradle = (config) => {
    return (0, config_plugins_1.withProjectBuildGradle)(config, (mod) => {
        if (mod.modResults.language === 'groovy') {
            mod.modResults.contents = setGradleMaven(mod.modResults.contents);
        }
        else {
            throw new Error('Cannot add maven gradle because the build.gradle is not groovy');
        }
        return mod;
    });
};
function setGradleMaven(buildGradle) {
    // If this specific line is present, skip.
    // This also enables users in bare workflow to comment out the line to prevent react-native-msal from adding it back.
    if (buildGradle.includes('https://pkgs.dev.azure.com/MicrosoftDeviceSDK/DuoSDK-Public/_packaging/Duo-SDK-Feed/maven/v1')) {
        return buildGradle;
    }
    return buildGradle + `\n${gradleMaven}\n`;
}
const withAndroidReactNativeMSAL = (config, androidPackageSignatureHash) => {
    return (0, config_plugins_1.withPlugins)(config, [[withAndroidActivity, androidPackageSignatureHash], withAndroidMSALGradle]);
};
exports.withAndroidReactNativeMSAL = withAndroidReactNativeMSAL;
