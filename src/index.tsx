import { NativeModules } from 'react-native';

type MsalType = {
  getDeviceName(): Promise<string>;
};

const { Msal } = NativeModules;

export default Msal as MsalType;
