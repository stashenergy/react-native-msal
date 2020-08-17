/**
 * Example for a Azure B2C application using a B2CClient helper class
 */

import React from 'react';
import { Platform, SafeAreaView, ScrollView, StyleSheet, Switch, Text, View, Pressable } from 'react-native';
import B2CClient from './b2cClient';
import { b2cConfig } from './msalConfig';
import { MSALResult } from 'react-native-msal';

const { clientId, authorityBase, policies, scopes } = b2cConfig;

const b2cClient = new B2CClient(clientId, authorityBase, policies);

export default function App() {
  const [authResult, setAuthResult] = React.useState<MSALResult | null>(null);
  const [iosEphemeralSession, setIosEphemeralSession] = React.useState(false);
  const webviewParameters = { ios_prefersEphemeralWebBrowserSession: iosEphemeralSession };

  React.useEffect(() => {
    async function init() {
      const isSignedIn = await b2cClient.isSignedIn();
      if (isSignedIn) {
        setAuthResult(await b2cClient.acquireTokenSilent({ scopes }));
      }
    }
    init();
  }, []);

  const handleSignInPress = async () => {
    try {
      const res = await b2cClient.signIn({ scopes, webviewParameters });
      setAuthResult(res);
    } catch (error) {
      console.warn(error);
    }
  };

  const handleAcquireTokenPress = async () => {
    try {
      const res = await b2cClient.acquireTokenSilent({ scopes });
      setAuthResult(res);
    } catch (error) {
      console.warn(error);
    }
  };

  const handleSignoutPress = async () => {
    try {
      await b2cClient.signOut();
      setAuthResult(null);
    } catch (error) {
      console.warn(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.buttonContainer}>
        {authResult ? (
          <>
            <Pressable style={styles.button} onPress={handleAcquireTokenPress}>
              <Text>Acquire Token (Silent)</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={handleSignoutPress}>
              <Text>Sign Out</Text>
            </Pressable>
          </>
        ) : (
          <Pressable style={styles.button} onPress={handleSignInPress}>
            <Text>Sign In</Text>
          </Pressable>
        )}

        {Platform.OS === 'ios' ? (
          <Pressable
            style={[styles.button, styles.switchButton]}
            onPress={() => setIosEphemeralSession(!iosEphemeralSession)}
          >
            <Text>Prefer ephemeral browser session (iOS only)</Text>
            <Switch value={iosEphemeralSession} onValueChange={setIosEphemeralSession} />
          </Pressable>
        ) : null}
      </View>
      <ScrollView style={styles.scrollView}>
        <Text>{JSON.stringify(authResult, null, 2)}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: '0.5%',
  },
  button: {
    backgroundColor: 'aliceblue',
    borderWidth: 1,
    margin: '0.5%',
    padding: 8,
    width: '49%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ddd',
  },
  switchButton: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 4,
    width: '99%',
  },
  scrollView: {
    marginHorizontal: '1%',
    marginBottom: '1%',
    borderWidth: 1,
  },
});
