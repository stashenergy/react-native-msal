import { ConfigPlugin, withAndroidManifest, AndroidConfig } from '@expo/config-plugins';
import type { ExpoConfig } from '@expo/config-types';

const { getMainApplicationOrThrow } = AndroidConfig.Manifest;

const withAndroidActivity: ConfigPlugin<string> = (config, signatureHash) => {
  return withAndroidManifest(config, (mod) => {
    mod.modResults = setBrowserTabActivity(config, mod.modResults, signatureHash);
    return mod;
  });
};

function setBrowserTabActivity(
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

export const withAndroidReactNativeMSAL: ConfigPlugin<{ signatureHash: string }> = (config, { signatureHash }) => {
  return withAndroidActivity(config, signatureHash);
};
