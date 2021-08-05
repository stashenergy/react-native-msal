"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const withAndroidReactNativeMSAL_1 = require("./withAndroidReactNativeMSAL");
const withIosReactNativeMSAL_1 = require("./withIosReactNativeMSAL");
const withReactNativeMSAL = (config, { signatureHash }) => {
    return config_plugins_1.withPlugins(config, [[withAndroidReactNativeMSAL_1.withAndroidReactNativeMSAL, { signatureHash }], withIosReactNativeMSAL_1.withIosReactNativeMSAL]);
};
exports.default = withReactNativeMSAL;
