package com.reactnativemsal;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.ReadableType;

import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONException;

public class ReadableMapUtils {
  public static JSONObject toJsonObject(ReadableMap readableMap) throws JSONException {
    JSONObject jsonObject = new JSONObject();

    ReadableMapKeySetIterator iterator = readableMap.keySetIterator();

    while (iterator.hasNextKey()) {
      String key = iterator.nextKey();
      ReadableType type = readableMap.getType(key);

      switch (type) {
        case Null:
          jsonObject.put(key, null);
          break;
        case Boolean:
          jsonObject.put(key, readableMap.getBoolean(key));
          break;
        case Number:
          jsonObject.put(key, readableMap.getDouble(key));
          break;
        case String:
          jsonObject.put(key, readableMap.getString(key));
          break;
        case Map:
          jsonObject.put(key, ReadableMapUtils.toJsonObject(readableMap.getMap(key)));
          break;
        case Array:
          jsonObject.put(key, ReadableMapUtils.toJsonArray(readableMap.getArray(key)));
          break;
      }
    }

    return jsonObject;
  }

  public static JSONArray toJsonArray(ReadableArray readableArray) throws JSONException {
    JSONArray jsonArray = new JSONArray();

    for (int i = 0; i < readableArray.size(); i++) {
      ReadableType type = readableArray.getType(i);

      switch (type) {
        case Null:
          jsonArray.put(i, null);
          break;
        case Boolean:
          jsonArray.put(i, readableArray.getBoolean(i));
          break;
        case Number:
          jsonArray.put(i, readableArray.getDouble(i));
          break;
        case String:
          jsonArray.put(i, readableArray.getString(i));
          break;
        case Map:
          jsonArray.put(i, ReadableMapUtils.toJsonObject(readableArray.getMap(i)));
          break;
        case Array:
          jsonArray.put(i, ReadableMapUtils.toJsonArray(readableArray.getArray(i)));
          break;
      }
    }

    return jsonArray;
  }
}
