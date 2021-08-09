import { ConfigPlugin, withPlugins } from '@expo/config-plugins';

import { withAndroidReactNativeMSAL } from './withAndroidReactNativeMSAL';
import { withIosReactNativeMSAL } from './withIosReactNativeMSAL';

const withReactNativeMSAL: ConfigPlugin<{ android: { signatureHash: string } }> = (config, { android }) => {
  return withPlugins(config, [[withAndroidReactNativeMSAL, android], withIosReactNativeMSAL]);
};

export default withReactNativeMSAL;
