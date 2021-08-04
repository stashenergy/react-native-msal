import {
  withInfoPlist,
  withEntitlementsPlist,
  withPlugins,
  AndroidConfig,
  withAndroidManifest,
  ConfigPlugin,
} from '@expo/config-plugins';
import type { ExpoConfig } from '@expo/config-types';

const { getMainApplicationOrThrow } = AndroidConfig.Manifest;

// iOS

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

// Android

const withAndroidActivity: ConfigPlugin<string> = (config, signatureHash) => {
  return withAndroidManifest(config, (mod) => {
    mod.modResults = addBrowserTabActivity(config, mod.modResults, signatureHash);
    return mod;
  });
};

function addBrowserTabActivity(
  config: Pick<ExpoConfig, 'android'>,
  androidManifest: AndroidConfig.Manifest.AndroidManifest,
  signatureHash: string
) {
  const BROWSER_TAB_ACTIVITY_NAME = 'com.microsoft.identity.client.BrowserTabActivity';

  const mainApplication = getMainApplicationOrThrow(androidManifest);
  let activity = mainApplication.activity?.find((a) => a.$['android:name'] === BROWSER_TAB_ACTIVITY_NAME);
  if (!activity) {
    activity = { $: { 'android:name': BROWSER_TAB_ACTIVITY_NAME } };
    mainApplication.activity = [...(mainApplication.activity ?? []), activity];
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
            'android:host': config.android?.package ?? androidManifest.manifest.$.package,
            'android:path': `/${signatureHash}`,
          },
        },
      ],
    },
  ];

  return androidManifest;
}

// ========================================

const withReactNativeMSAL: ConfigPlugin<{ signatureHash: string }> = (config, { signatureHash }) => {
  return withPlugins(config, [withIosUrlScheme, withIosKeychainGroup, [withAndroidActivity, signatureHash]]);
};

export default withReactNativeMSAL;
