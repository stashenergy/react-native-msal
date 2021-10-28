import {
  ConfigPlugin,
  withAndroidManifest,
  AndroidConfig,
  withProjectBuildGradle,
  withPlugins,
} from '@expo/config-plugins';
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

// It's ok to have multiple allprojects.repositories, so we create a new one since it's cheaper than tokenizing
// the existing block to find the correct place to insert our dependency.
const gradleMaven =
  'allprojects { repositories { maven { url "https://pkgs.dev.azure.com/MicrosoftDeviceSDK/DuoSDK-Public/_packaging/Duo-SDK-Feed/maven/v1" } } }';

const withAndroidMSALGradle: ConfigPlugin = (config) => {
  return withProjectBuildGradle(config, (mod) => {
    if (mod.modResults.language === 'groovy') {
      mod.modResults.contents = setGradleMaven(mod.modResults.contents);
    } else {
      throw new Error('Cannot add maven gradle because the build.gradle is not groovy');
    }
    return mod;
  });
};

function setGradleMaven(buildGradle: string) {
  // If this specific line is present, skip.
  // This also enables users in bare workflow to comment out the line to prevent react-native-msal from adding it back.
  if (
    buildGradle.includes('https://pkgs.dev.azure.com/MicrosoftDeviceSDK/DuoSDK-Public/_packaging/Duo-SDK-Feed/maven/v1')
  ) {
    return buildGradle;
  }
  return buildGradle + `\n${gradleMaven}\n`;
}

export const withAndroidReactNativeMSAL: ConfigPlugin<string> = (config, androidPackageSignatureHash) => {
  return withPlugins(config, [[withAndroidActivity, androidPackageSignatureHash], withAndroidMSALGradle]);
};
