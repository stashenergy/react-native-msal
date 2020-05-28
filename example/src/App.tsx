import * as React from 'react';
import { StyleSheet, Text, Button, SafeAreaView, ScrollView, Platform, Switch, View } from 'react-native';
import MSALCLient, { MSALResult } from 'react-native-msal';

// Example config, modify to your needs
const msalConfig = {
  clientId: '<CLIENT_ID>',
  sisuAuthority: 'https://<TENANT_NAME>.b2clogin.com/tfp/<TENANT_NAME>.onmicrosoft.com/B2C_1A_SignInUp_Native',
  pswdResetAuthority:
    'https://<TENANT_NAME>.b2clogin.com/tfp/<TENANT_NAME>.onmicrosoft.com/B2C_1A_PasswordReset_Native',
  scopes: ['https://<TENANT_NAME>.onmicrosoft.com/api/user_impersonation'],
};

const msalClient = new MSALCLient(msalConfig.clientId);

export default function App() {
  const [authResult, setAuthResult] = React.useState<MSALResult | null>(null);
  const [prefersEphemeralWebBrowserSession, setPrefersEphemeralWebBrowserSession] = React.useState<boolean>(false);

  const handleResult = (result: MSALResult) => {
    setAuthResult(result);
  };

  const acquireToken = async () => {
    try {
      const res = await msalClient.acquireToken({
        authority: msalConfig.sisuAuthority,
        scopes: msalConfig.scopes,
        ios_prefersEphemeralWebBrowserSession: prefersEphemeralWebBrowserSession,
      });
      handleResult(res);
    } catch (error) {
      console.warn(error);
    }
  };

  const acquireTokenSilent = async () => {
    if (authResult) {
      try {
        const res = await msalClient.acquireTokenSilent({
          authority: msalConfig.sisuAuthority,
          scopes: msalConfig.scopes,
          accountIdentifier: authResult.account.identifier,
        });
        handleResult(res);
      } catch (error) {
        console.warn(error);
      }
    }
  };

  const removeAccount = async () => {
    if (authResult) {
      try {
        await msalClient.removeAccount({
          authority: msalConfig.sisuAuthority,
          accountIdentifier: authResult.account.identifier,
        });
        setAuthResult(null);
      } catch (error) {
        console.warn(error);
      }
    }
  };
  const signout = async () => {
    if (authResult) {
      try {
        await msalClient.signout({
          authority: msalConfig.sisuAuthority,
          accountIdentifier: authResult.account.identifier,
          ios_prefersEphemeralWebBrowserSession: prefersEphemeralWebBrowserSession,
        });
        setAuthResult(null);
      } catch (error) {
        console.warn(error);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Button title="Acquire Token" onPress={acquireToken} />
      <Button title="Acquire Token Silently" onPress={acquireTokenSilent} disabled={!authResult} />
      <Button title="Remove account" onPress={removeAccount} disabled={!authResult} />
      {Platform.OS === 'ios' && <Button title="Sign out (iOS only)" onPress={signout} disabled={!authResult} />}
      {Platform.OS === 'ios' && (
        <View style={styles.switch}>
          <View style={styles.switchSpacer} />
          <View style={styles.switchLabel}>
            <Text
              onPress={() => setPrefersEphemeralWebBrowserSession(!prefersEphemeralWebBrowserSession)}
              style={styles.text}
            >
              Prefer ephemeral web browser session?
              {'\n'}
              (iOS only)
            </Text>
          </View>
          <View style={styles.switchSpacer}>
            <Switch value={prefersEphemeralWebBrowserSession} onValueChange={setPrefersEphemeralWebBrowserSession} />
          </View>
        </View>
      )}
      <ScrollView>
        <Text>{JSON.stringify(authResult, null, 4)}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 4,
  },
  switch: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    textAlign: 'center',
  },
  switchSpacer: {
    flex: 1,
  },
  switchLabel: {
    flexGrow: 0,
    padding: 10,
  },
});
