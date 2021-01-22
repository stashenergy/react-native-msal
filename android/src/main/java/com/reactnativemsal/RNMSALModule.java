package com.reactnativemsal;

import android.util.Pair;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.microsoft.identity.client.AcquireTokenParameters;
import com.microsoft.identity.client.AcquireTokenSilentParameters;
import com.microsoft.identity.client.AuthenticationCallback;
import com.microsoft.identity.client.IAccount;
import com.microsoft.identity.client.IAuthenticationResult;
import com.microsoft.identity.client.IMultipleAccountPublicClientApplication;
import com.microsoft.identity.client.Prompt;
import com.microsoft.identity.client.PublicClientApplication;
import com.microsoft.identity.client.SilentAuthenticationCallback;
import com.microsoft.identity.client.exception.MsalException;

import java.io.File;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class RNMSALModule extends ReactContextBaseJavaModule {
    private IMultipleAccountPublicClientApplication publicClientApplication;

    public RNMSALModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return "RNMSAL";
    }

    @ReactMethod
    public void createPublicClientApplication(ReadableMap params) {
        ReactApplicationContext context = getReactApplicationContext();
        try {
            InputStream inputStream = context.getAssets().open("msal_config.json");
            File file = File.createTempFile("RNMSAL_msal_config", ".tmp");
            file.deleteOnExit();
            FileUtils.copyInputStreamToFile(inputStream, file);
            publicClientApplication =
                    PublicClientApplication.createMultipleAccountPublicClientApplication(
                            context, file);
        } catch (Exception ignored) {
        }
    }

    @ReactMethod
    public void acquireToken(ReadableMap params, Promise promise) {
        try {
            AcquireTokenParameters.Builder acquireTokenParameters =
                    new AcquireTokenParameters.Builder()
                            .startAuthorizationFromActivity(this.getCurrentActivity());

            // Required parameters
            List<String> scopes = readableArrayToStringList(params.getArray("scopes"));
            acquireTokenParameters.withScopes(scopes);

            // Optional parameters
            if (params.hasKey("authority")) {
                acquireTokenParameters.fromAuthority(params.getString("authority"));
            }

            if (params.hasKey("promptType")) {
                acquireTokenParameters.withPrompt(Prompt.values()[params.getInt("promptType")]);
            }

            if (params.hasKey("loginHint")) {
                acquireTokenParameters.withLoginHint(params.getString("loginHint"));
            }

            if (params.hasKey("extraScopesToConsent")) {
                acquireTokenParameters.withOtherScopesToAuthorize(
                        readableArrayToStringList(params.getArray("extraScopesToConsent")));
            }

            if (params.hasKey("extraQueryParameters")) {
                List<Pair<String, String>> parameters = new ArrayList<>();
                for (Map.Entry<String, Object> entry :
                        params.getMap("extraQueryParameters").toHashMap().entrySet()) {
                    parameters.add(new Pair<>(entry.getKey(), entry.getValue().toString()));
                }
                acquireTokenParameters.withAuthorizationQueryStringParameters(parameters);
            }

            acquireTokenParameters.withCallback(getAuthInteractiveCallback(promise));
            publicClientApplication.acquireToken(acquireTokenParameters.build());
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    private AuthenticationCallback getAuthInteractiveCallback(Promise promise) {
        return new AuthenticationCallback() {
            @Override
            public void onCancel() {
                promise.reject("userCancel", "userCancel");
            }

            @Override
            public void onSuccess(IAuthenticationResult authenticationResult) {
                promise.resolve(msalResultToDictionary(authenticationResult));
            }

            @Override
            public void onError(MsalException exception) {
                promise.reject(exception);
            }
        };
    }

    @ReactMethod
    public void acquireTokenSilent(ReadableMap params, Promise promise) {
        try {
            AcquireTokenSilentParameters.Builder acquireTokenSilentParameters =
                    new AcquireTokenSilentParameters.Builder();

            // Required parameters
            List<String> scopes = readableArrayToStringList(params.getArray("scopes"));
            acquireTokenSilentParameters.withScopes(scopes);

            ReadableMap accountIn = params.getMap("account");
            String accountIdentifier = accountIn.getString("identifier");
            IAccount account = publicClientApplication.getAccount(accountIdentifier);
            acquireTokenSilentParameters.forAccount(account);

            // Optional parameters
            String authority =
                    publicClientApplication
                            .getConfiguration()
                            .getDefaultAuthority()
                            .getAuthorityURL()
                            .toString();
            if (params.hasKey("authority")) {
                authority = params.getString("authority");
            }
            acquireTokenSilentParameters.fromAuthority(authority);

            if (params.hasKey("forceRefresh")) {
                acquireTokenSilentParameters.forceRefresh(params.getBoolean("forceRefresh"));
            }

            acquireTokenSilentParameters.withCallback(getAuthSilentCallback(promise));
            publicClientApplication.acquireTokenSilentAsync(acquireTokenSilentParameters.build());
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    private SilentAuthenticationCallback getAuthSilentCallback(Promise promise) {
        return new SilentAuthenticationCallback() {
            @Override
            public void onSuccess(IAuthenticationResult authenticationResult) {
                promise.resolve(msalResultToDictionary(authenticationResult));
            }

            @Override
            public void onError(MsalException exception) {
                promise.reject(exception);
            }
        };
    }

    @ReactMethod
    public void getAccounts(Promise promise) {
        try {
            List<IAccount> accounts = publicClientApplication.getAccounts();
            WritableArray array = Arguments.createArray();
            for (IAccount account : accounts) {
                array.pushMap(accountToMap(account));
            }
            promise.resolve(array);
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    @ReactMethod
    public void getAccount(String accountIdentifier, Promise promise) {
        try {
            IAccount account = publicClientApplication.getAccount(accountIdentifier);
            promise.resolve(accountToMap(account));
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    @ReactMethod
    public void removeAccount(ReadableMap accountIn, Promise promise) {
        try {
            // Required parameters
            String accountIdentifier = accountIn.getString(("identifier"));
            IAccount account = publicClientApplication.getAccount(accountIdentifier);

            publicClientApplication.removeAccount(
                    account,
                    new IMultipleAccountPublicClientApplication.RemoveAccountCallback() {
                        @Override
                        public void onRemoved() {
                            promise.resolve(true);
                        }

                        @Override
                        public void onError(@NonNull MsalException exception) {
                            promise.reject(exception);
                        }
                    });
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    private WritableMap msalResultToDictionary(IAuthenticationResult result) {
        WritableMap map = Arguments.createMap();
        map.putString("accessToken", result.getAccessToken());
        map.putString("expiresOn", String.format("%s", result.getExpiresOn().getTime() / 1000));
        map.putString("idToken", result.getAccount().getIdToken());
        map.putArray("scopes", Arguments.fromArray(result.getScope()));
        map.putString("tenantId", result.getTenantId());
        map.putMap("account", accountToMap(result.getAccount()));
        return map;
    }

    private WritableMap accountToMap(IAccount account) {
        WritableMap map = Arguments.createMap();
        map.putString("identifier", account.getId());
        map.putString("username", account.getUsername());
        map.putString("tenantId", account.getTenantId());
        Map<String, ?> claims = account.getClaims();
        if (claims != null) {
            map.putMap("claims", toWritableMap(claims));
        }
        return map;
    }

    private List<String> readableArrayToStringList(ReadableArray readableArray) {
        List<String> list = new ArrayList<>();
        for (Object item : readableArray.toArrayList()) {
            list.add(item.toString());
        }
        return list;
    }

    private WritableMap toWritableMap(Map<String, ?> map) {
        WritableMap writableMap = Arguments.createMap();
        for (Map.Entry<String, ?> entry : map.entrySet()) {
            String key = entry.getKey();
            Object value = entry.getValue();
            if (value == null) {
                writableMap.putNull(key);
            } else if (value instanceof Boolean) {
                writableMap.putBoolean(key, (Boolean) value);
            } else if (value instanceof Double) {
                writableMap.putDouble(key, (Double) value);
            } else if (value instanceof Integer) {
                writableMap.putInt(key, (Integer) value);
            } else if (value instanceof String) {
                writableMap.putString(key, (String) value);
            } else if (value instanceof Map<?, ?>) {
                writableMap.putMap(key, toWritableMap((Map<String, ?>) value));
            } else if (value instanceof List<?>) {
                writableMap.putArray(key, toWritableArray((List<?>) value));
            }
        }
        return writableMap;
    }

    private WritableArray toWritableArray(List<?> list) {
        WritableArray writableArray = Arguments.createArray();
        for (Object value : list.toArray()) {
            if (value == null) {
                writableArray.pushNull();
            } else if (value instanceof Boolean) {
                writableArray.pushBoolean((Boolean) value);
            } else if (value instanceof Double) {
                writableArray.pushDouble((Double) value);
            } else if (value instanceof Integer) {
                writableArray.pushInt((Integer) value);
            } else if (value instanceof String) {
                writableArray.pushString((String) value);
            } else if (value instanceof Map<?, ?>) {
                writableArray.pushMap(toWritableMap((Map<String, ?>) value));
            } else if (value instanceof List<?>) {
                writableArray.pushArray(toWritableArray((List<?>) value));
            }
        }
        return writableArray;
    }
}
