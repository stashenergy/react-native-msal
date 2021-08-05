import { ConfigPlugin, withPlugins } from '@expo/config-plugins';

import { withAndroidReactNativeMSAL } from './withAndroidReactNativeMSAL';
import { withIosReactNativeMSAL } from './withIosReactNativeMSAL';

const withReactNativeMSAL: ConfigPlugin<{ signatureHash: string }> = (config, { signatureHash }) => {
  return withPlugins(config, [[withAndroidReactNativeMSAL, { signatureHash }], withIosReactNativeMSAL]);
};

export default withReactNativeMSAL;
