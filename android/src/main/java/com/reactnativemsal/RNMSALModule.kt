package com.reactnativemsal

import android.util.Pair
import com.facebook.react.bridge.*
import com.microsoft.identity.client.*
import com.microsoft.identity.client.exception.MsalException
import org.apache.commons.io.FileUtils
import java.io.File

class RNMSALModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val publicClientApplication: IMultipleAccountPublicClientApplication

    init {
        val inputStream = reactApplicationContext.assets.open("msal_config.json")
        val file = File.createTempFile("RNMSAL_msal_config", ".tmp")
        file.deleteOnExit()
        FileUtils.copyInputStreamToFile(inputStream, file)
        publicClientApplication = PublicClientApplication.createMultipleAccountPublicClientApplication(reactApplicationContext, file)
    }

    override fun getName(): String {
        return "RNMSAL"
    }

    @ReactMethod
    fun acquireToken(params: ReadableMap, promise: Promise) {
        try {
            // Required parameters
            val authority = params.getString("authority")!!
            val scopes = readableArrayToStringList(params.getArray("scopes")!!)

            // Optional parameters but supplied with default values, so don't have to check if null
            val promptType = params.getInt("promptType")
            val loginHint = params.getString("loginHint")!!
            val extraScopesToConsent = readableArrayToStringList(params.getArray("extraScopesToConsent")!!)
            val eqp = params.getMap("extraQueryParameters")!!
            val eqpHashMap = eqp.toHashMap()
            val extraQueryParameters = arrayListOf<Pair<String, String>>()
            for (o in eqpHashMap.entries) {
                val pair = Pair(o.key.toString(), o.value.toString())
                extraQueryParameters.add(pair)
            }

            val parameters = AcquireTokenParameters.Builder()
                    .startAuthorizationFromActivity(this.currentActivity)
                    .fromAuthority(authority)
                    .withScopes(scopes)
                    .withPrompt(Prompt.values()[promptType])
                    .withAuthorizationQueryStringParameters(extraQueryParameters)
                    .withLoginHint(loginHint)
                    .withOtherScopesToAuthorize(extraScopesToConsent)
                    .withCallback(getAuthInteractiveCallback(promise, authority))
                    .build()

            publicClientApplication.acquireToken(parameters)

        } catch (e: Exception) {
            promise.reject(e)
        }
    }

    private fun getAuthInteractiveCallback(promise: Promise, authority: String): AuthenticationCallback {
        return object : AuthenticationCallback {
            override fun onCancel() {
                promise.reject("userCancel", "userCancel")
            }

            override fun onSuccess(authenticationResult: IAuthenticationResult) {
                promise.resolve(msalResultToDictionary(authenticationResult, authority))
            }

            override fun onError(exception: MsalException) {
                promise.reject(exception)
            }
        }
    }


    @ReactMethod
    fun acquireTokenSilent(params: ReadableMap, promise: Promise) {
        try {
            // Required parameters
            val authority = params.getString("authority")!!
            val scopes = readableArrayToStringList(params.getArray("scopes")!!)
            val accountIdentifier = params.getString("accountIdentifier")!!

            // Optional values with default values
            val forceRefresh = params.getBoolean("forceRefresh")

            val account = publicClientApplication.getAccount(accountIdentifier)

            val silentParams = AcquireTokenSilentParameters.Builder()
                    .fromAuthority(authority)
                    .forAccount(account)
                    .withScopes(scopes)
                    .withCallback(getAuthSilentCallback(promise, authority))
                    .forceRefresh(forceRefresh)
                    .build()

            publicClientApplication.acquireTokenSilentAsync(silentParams)

        } catch (e: Exception) {
            promise.reject(e)
        }
    }

    private fun getAuthSilentCallback(promise: Promise, authority: String): SilentAuthenticationCallback {
        return object : SilentAuthenticationCallback {
            override fun onSuccess(authenticationResult: IAuthenticationResult) {
                promise.resolve(msalResultToDictionary(authenticationResult, authority))
            }

            override fun onError(exception: MsalException) {
                promise.reject(exception)
            }
        }
    }

    @ReactMethod
    fun removeAccount(params: ReadableMap, promise: Promise) {
        try {
            // Required parameters
            val accountIdentifier = params.getString("accountIdentifier")!!

            val account = publicClientApplication.getAccount(accountIdentifier)

            publicClientApplication.removeAccount(account, object : IMultipleAccountPublicClientApplication.RemoveAccountCallback {
                override fun onRemoved() {
                    promise.resolve(null)
                }

                override fun onError(exception: MsalException) {
                    promise.reject(exception)
                }
            })
        } catch (e: Exception) {
            promise.reject(e)
        }
    }

    private fun msalResultToDictionary(result: IAuthenticationResult, authority: String): WritableMap {
        val map = Arguments.createMap()
        map.putString("accessToken", result.accessToken)
        map.putString("expiresOn", String.format("%s", result.expiresOn.time))
        map.putString("idToken", result.account.idToken)
        map.putArray("scopes", Arguments.fromArray(result.scope))
        map.putString("authority", authority)
        map.putString("tenantId", result.tenantId)
        map.putMap("account", accountToDictionary(result.account))
        return map
    }

    private fun accountToDictionary(account: IAccount): WritableMap {
        val map = Arguments.createMap()
        map.putString("username", account.username)
        map.putString("identifier", account.id)
        return map
    }

    private fun readableArrayToStringList(readableArray: ReadableArray): List<String> {
        return readableArray.toArrayList().map { item -> item.toString() }
    }
}
