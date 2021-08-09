import { ConfigPlugin } from '@expo/config-plugins';
declare const withReactNativeMSAL: ConfigPlugin<{
    android: {
        signatureHash: string;
    };
}>;
export default withReactNativeMSAL;
