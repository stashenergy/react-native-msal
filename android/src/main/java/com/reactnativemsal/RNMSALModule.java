package com.reactnativemsal;

import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.net.Uri;
import android.util.Base64;
import android.util.Log;
import android.util.Pair;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

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
import com.microsoft.identity.client.IMultiTenantAccount;
import com.microsoft.identity.client.IMultipleAccountPublicClientApplication;
import com.microsoft.identity.client.Prompt;
import com.microsoft.identity.client.PublicClientApplication;
import com.microsoft.identity.client.SilentAuthenticationCallback;
import com.microsoft.identity.client.exception.MsalException;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.FileWriter;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.reactnativemsal.ReadableMapUtils.getStringOrDefault;
import static com.reactnativemsal.ReadableMapUtils.getStringOrThrow;

public class RNMSALModule extends ReactContextBaseJavaModule {
    private static final String AUTHORITY_TYPE_B2C = "B2C";
    private static final String AUTHORITY_TYPE_AAD = "AAD";

    private static final Pattern aadMyOrgAuthorityPattern = Pattern.compile("https://login.microsoftonline.com/(?<tenant>.+)");
    private static final Pattern b2cAuthorityPattern = Pattern.compile("https://.+?/tfp/(?<tenant>.+?)/.+");

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
    public void createPublicClientApplication(ReadableMap params, Promise promise) {
        ReactApplicationContext context = getReactApplicationContext();
        try {
            // We have to make a json file containing the MSAL configuration, then use that file to
            // create the PublicClientApplication
            // We first need to create the JSON model using the passed in parameters

            JSONObject msalConfigJsonObj = params.hasKey("androidConfigOptions")
                    ? ReadableMapUtils.toJsonObject(params.getMap("androidConfigOptions"))
                    : new JSONObject();

            // Account mode. Required to be MULTIPLE for this library
            msalConfigJsonObj.put("account_mode", "MULTIPLE");

            // If broker_redirect_uri_registered is not provided in androidConfigOptions,
            // default it to false
            if (!msalConfigJsonObj.has("broker_redirect_uri_registered")) {
                msalConfigJsonObj.put("broker_redirect_uri_registered", false);
            }

            ReadableMap auth = params.getMap("auth");

            // Authority
            String authority = getStringOrDefault(auth, "authority", "https://login.microsoftonline.com/common");
            msalConfigJsonObj.put("authority", authority);

            // Client id
            msalConfigJsonObj.put("client_id", getStringOrThrow(auth, "clientId"));

            // Redirect URI
            msalConfigJsonObj.put("redirect_uri", auth.hasKey("redirectUri") ? auth.getString("redirectUri") : makeRedirectUri(context).toString());

            // Authorities
            ReadableArray knownAuthorities = auth.getArray("knownAuthorities");
            // List WILL be instantiated and empty if `knownAuthorities` is null
            List<String> authoritiesList = readableArrayToStringList(knownAuthorities);
            // Make sure the `authority` makes it in the authority list
            if (!authoritiesList.contains(authority)) {
                authoritiesList.add(authority);
            }
            // The authoritiesList is just a list of urls (strings), but the native android MSAL
            // library expects an array of objects, so we have to parse the urls
            JSONArray authoritiesJsonArr = makeAuthoritiesJsonArray(authoritiesList, authority);
            msalConfigJsonObj.put("authorities", authoritiesJsonArr);

            // Serialize the JSON config to a string
            String serializedMsalConfig = msalConfigJsonObj.toString();
            Log.d("RNMSALModule", serializedMsalConfig);

            // Create a temporary file and write the serialized config to it
            File file = File.createTempFile("RNMSAL_msal_config", ".tmp");
            file.deleteOnExit();
            FileWriter writer = new FileWriter(file);
            writer.write(serializedMsalConfig);
            writer.close();

            // Finally, create the PCA with the temporary config file we created
            publicClientApplication =
                    PublicClientApplication.createMultipleAccountPublicClientApplication(
                            context, file);
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    private JSONArray makeAuthoritiesJsonArray(List<String> authorityUrls, String authority) throws JSONException {
        JSONArray authoritiesJsonArr = new JSONArray();
        boolean foundDefaultAuthority = false;

        for (String authorityUrl : authorityUrls) {
            JSONObject authorityJsonObj = new JSONObject();

            // Authority is set as the default if one is not set yet, and it matches `authority`
            if (!foundDefaultAuthority && authorityUrl.equals(authority)) {
                authorityJsonObj.put("default", true);
                foundDefaultAuthority = true;
            }

            // Parse this information from the authority url. Some variables will end up staying null
            String type = null, audience_type = null, audience_tenantId = null, b2cAuthorityUrl = null;

            Matcher b2cAuthorityMatcher = b2cAuthorityPattern.matcher(authorityUrl);
            Matcher aadMyOrgAuthorityMatcher = aadMyOrgAuthorityPattern.matcher(authorityUrl);

            if (authorityUrl.equals("https://login.microsoftonline.com/common")) {
                type = AUTHORITY_TYPE_AAD;
                audience_type = "AzureADandPersonalMicrosoftAccount";
            } else if (authorityUrl.equals("https://login.microsoftonline.com/organizations")) {
                type = AUTHORITY_TYPE_AAD;
                audience_type = "AzureADMultipleOrgs";
            } else if (authorityUrl.equals("https://login.microsoftonline.com/consumers")) {
                type = AUTHORITY_TYPE_AAD;
                audience_type = "PersonalMicrosoftAccount";
            } else if (b2cAuthorityMatcher.find()) {
                type = AUTHORITY_TYPE_B2C;
                b2cAuthorityUrl = authorityUrl;
            } else if (aadMyOrgAuthorityMatcher.find()) {
                type = AUTHORITY_TYPE_AAD;
                audience_type = "AzureADMyOrg";
                audience_tenantId = aadMyOrgAuthorityMatcher.group(1);
            }

            authorityJsonObj
                    .put("type", type)
                    .put("authority_url", b2cAuthorityUrl)
                    .put("audience", audience_type == null ? null : new JSONObject()
                            .put("type", audience_type)
                            .put("tenant_id", audience_tenantId)
                    );

            authoritiesJsonArr.put(authorityJsonObj);
        }

        // If a default authority was not found, we set the first authority as the default
        if (!foundDefaultAuthority && authoritiesJsonArr.length() > 0) {
            authoritiesJsonArr.getJSONObject(0).put("default", true);
        }

        return authoritiesJsonArr;
    }

    private Uri makeRedirectUri(ReactApplicationContext context) throws Exception {
        try {
            final String packageName = context.getPackageName();
            final PackageInfo info = context.getPackageManager().getPackageInfo(packageName, PackageManager.GET_SIGNATURES);
            if (info.signatures.length != 1) {
                throw new RuntimeException("RNMSAL expected there to be exactly one signature for package " + packageName);
            }
            Signature signature = info.signatures[0];
            final MessageDigest messageDigest = MessageDigest.getInstance("SHA");
            messageDigest.update(signature.toByteArray());
            final String signatureHash = Base64.encodeToString(messageDigest.digest(), Base64.NO_WRAP);
            Log.d("RNMSALModule", signatureHash);

            return new Uri.Builder().scheme("msauth")
                    .authority(packageName)
                    .appendPath(signatureHash)
                    .build();
        } catch (Exception ex) {
            throw new Exception("Could not create redirect uri from package name and signature hash", ex);
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
                if (authenticationResult != null) {
                    promise.resolve(msalResultToDictionary(authenticationResult));
                } else {
                    promise.resolve(null);
                }
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
                if (authenticationResult != null) {
                    promise.resolve(msalResultToDictionary(authenticationResult));
                } else {
                    promise.resolve(null);
                }
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
            if (accounts != null) {
                for (IAccount account : accounts) {
                    array.pushMap(accountToMap(account));
                }
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
            if (account != null) {
                promise.resolve(accountToMap(account));
            } else {
                promise.resolve(null);
            }
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

    private WritableMap msalResultToDictionary(@NonNull IAuthenticationResult result) {
        WritableMap map = Arguments.createMap();
        map.putString("accessToken", result.getAccessToken());
        map.putString("expiresOn", String.format("%s", result.getExpiresOn().getTime() / 1000));
        String idToken = result.getAccount().getIdToken();
        if (idToken==null){
          idToken = ((IMultiTenantAccount) result.getAccount()).getTenantProfiles().get(result.getTenantId()).getIdToken();
        }
        map.putString("idToken", idToken);
        map.putArray("scopes", Arguments.fromArray(result.getScope()));
        map.putString("tenantId", result.getTenantId());
        map.putMap("account", accountToMap(result.getAccount()));
        return map;
    }

    private WritableMap accountToMap(@NonNull IAccount account) {
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


    @NonNull
    private List<String> readableArrayToStringList(@Nullable ReadableArray readableArray) {
        List<String> list = new ArrayList<>();
        if (readableArray != null) {
            for (Object item : readableArray.toArrayList()) {
                list.add(item.toString());
            }
        }
        return list;
    }

    @NonNull
    private WritableMap toWritableMap(@NonNull Map<String, ?> map) {
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

    @NonNull
    private WritableArray toWritableArray(@NonNull List<?> list) {
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
