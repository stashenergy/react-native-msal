import { ConfigPlugin, withPlugins } from '@expo/config-plugins';

import { withAndroidReactNativeMSAL } from './withAndroidReactNativeMSAL';
import { withIosReactNativeMSAL } from './withIosReactNativeMSAL';

const withReactNativeMSAL: ConfigPlugin<{ androidPackageSignatureHash: string }> = (
  config,
  { androidPackageSignatureHash }
) => {
  return withPlugins(config, [[withAndroidReactNativeMSAL, androidPackageSignatureHash], withIosReactNativeMSAL]);
};

export default withReactNativeMSAL;
