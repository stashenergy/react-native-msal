package com.reactnativemsal

import android.util.Pair
import com.facebook.react.bridge.*
import com.microsoft.identity.client.*
import com.microsoft.identity.client.exception.MsalException
import java.io.File

class RNMSALModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

  private lateinit var publicClientApplication: IMultipleAccountPublicClientApplication

  override fun getName(): String {
    return "RNMSAL"
  }

  @ReactMethod
  fun createPublicClientApplication(params: ReadableMap) {
    val inputStream = reactApplicationContext.assets.open("msal_config.json")
    val file = File.createTempFile("RNMSAL_msal_config", ".tmp")
    file.deleteOnExit()
    FileUtils.copyInputStreamToFile(inputStream, file)
    publicClientApplication = PublicClientApplication.createMultipleAccountPublicClientApplication(reactApplicationContext, file)
  }

  @ReactMethod
  fun acquireToken(params: ReadableMap, promise: Promise) {
    try {
      val acquireTokenParameters = AcquireTokenParameters.Builder()
        .startAuthorizationFromActivity(this.currentActivity)

      // Required parameters
      val scopes = readableArrayToStringList(params.getArray("scopes")!!)
      acquireTokenParameters.withScopes(scopes)

      // Optional parameters
      var authority: String = publicClientApplication.configuration.defaultAuthority.authorityURL.toString()

      if (params.hasKey("authority")) {
        params.getString("authority")?.let {
          authority = it
          acquireTokenParameters.fromAuthority(it)
        }
      }

      if (params.hasKey("promptType")) {
        params.getInt("promptType").let { acquireTokenParameters.withPrompt(Prompt.values()[it]) }
      }

      if (params.hasKey("loginHint")) {
        params.getString("loginHint")?.let { acquireTokenParameters.withLoginHint(it) }
      }

      if (params.hasKey("extraScopesToConsent")) {
        params.getArray("extraScopesToConsent")?.let {
          acquireTokenParameters.withOtherScopesToAuthorize(readableArrayToStringList(it))
        }
      }

      if (params.hasKey("extraQueryParameters")) {
        params.getMap("extraQueryParameters")?.toHashMap()?.let {
          val extraQueryParameters = arrayListOf<Pair<String, String>>()
          for (o in it.entries) {
            val pair = Pair(o.key.toString(), o.value.toString())
            extraQueryParameters.add(pair)
          }
          acquireTokenParameters.withAuthorizationQueryStringParameters(extraQueryParameters)
        }
      }

      acquireTokenParameters.withCallback(getAuthInteractiveCallback(promise, authority))
      publicClientApplication.acquireToken(acquireTokenParameters.build())
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
      val acquireTokenSilentParameters = AcquireTokenSilentParameters.Builder()

      // Required parameters
      val scopes = readableArrayToStringList(params.getArray("scopes")!!)
      acquireTokenSilentParameters.withScopes(scopes)

      val accountIn = params.getMap("account")!!
      val accountIdentifier = accountIn.getString("identifier")!!
      val account = publicClientApplication.getAccount(accountIdentifier)
      acquireTokenSilentParameters.forAccount(account)

      // Optional parameters
      var authority: String = publicClientApplication.configuration.defaultAuthority.authorityURL.toString()

      if (params.hasKey("authority")) {
        params.getString("authority")?.let { authority = it }
      }
      acquireTokenSilentParameters.fromAuthority(authority)

      if (params.hasKey("forceRefresh")) {
        params.getBoolean("forceRefresh").let { acquireTokenSilentParameters.forceRefresh(it) }
      }

      acquireTokenSilentParameters.withCallback(getAuthSilentCallback(promise, authority))
      publicClientApplication.acquireTokenSilentAsync(acquireTokenSilentParameters.build())
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
  fun getAccounts(promise: Promise) {
    try {
      val accounts = publicClientApplication.accounts
      val array = Arguments.createArray()
      accounts.forEach { account ->
        array.pushMap(accountToMap(account))
      }
      promise.resolve(array)
    } catch (e: Exception) {
      promise.reject(e)
    }
  }

  @ReactMethod
  fun getAccount(accountIdentifier: String, promise: Promise) {
    try {
      val account = publicClientApplication.getAccount(accountIdentifier)
      promise.resolve(accountToMap(account))
    } catch (e: Exception) {
      promise.reject(e)
    }
  }

  @ReactMethod
  fun removeAccount(accountIn: ReadableMap, promise: Promise) {
    try {
      // Required parameters
      val accountIdentifier = accountIn.getString(("identifier"))!!

      val account = publicClientApplication.getAccount(accountIdentifier)

      publicClientApplication.removeAccount(account, object : IMultipleAccountPublicClientApplication.RemoveAccountCallback {
        override fun onRemoved() {
          promise.resolve(true)
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
    map.putString("expiresOn", String.format("%s", result.expiresOn.time / 1000))
    map.putString("idToken", result.account.idToken)
    map.putArray("scopes", Arguments.fromArray(result.scope))
    map.putString("authority", authority)
    map.putString("tenantId", result.tenantId)
    map.putMap("account", accountToMap(result.account))
    return map
  }

  private fun accountToMap(account: IAccount): WritableMap {
    val map = Arguments.createMap()
    map.putString("identifier", account.id)
    map.putString("username", account.username)
    account.claims?.let {
      map.putMap("claims", toWritableMap(it as Map<String, Any?>))
    }
    return map
  }

  private fun readableArrayToStringList(readableArray: ReadableArray): List<String> {
    return readableArray.toArrayList().map { item -> item.toString() }
  }

  private fun toWritableMap(map: Map<String, Any?>): WritableMap {
    val writableMap = Arguments.createMap()
    val iterator = map.entries.iterator()
    while (iterator.hasNext()) {
      val pair = iterator.next()
      when (val value = pair.value) {
        null -> writableMap.putNull(pair.key)
        is Boolean -> writableMap.putBoolean(pair.key, value)
        is Double -> writableMap.putDouble(pair.key, value)
        is Int -> writableMap.putInt(pair.key, value)
        is String -> writableMap.putString(pair.key, value)
        is Map<*, *> -> writableMap.putMap(pair.key, toWritableMap(value as Map<String, Any?>))
        is Array<*> -> writableMap.putArray(pair.key, toWritableArray(value as Array<Any?>))
      }
    }
    return writableMap
  }

  private fun toWritableArray(array: Array<Any?>): WritableArray {
    val writableArray = Arguments.createArray()
    for (value in array) {
      when (value) {
        null -> writableArray.pushNull()
        is Boolean -> writableArray.pushBoolean(value)
        is Double -> writableArray.pushDouble(value)
        is Int -> writableArray.pushInt(value)
        is String -> writableArray.pushString(value)
        is Map<*, *> -> writableArray.pushMap(toWritableMap(value as Map<String, Any?>))
        is Array<*> -> writableArray.pushArray(toWritableArray(value as Array<Any?>))
      }
    }
    return writableArray
  }
}
