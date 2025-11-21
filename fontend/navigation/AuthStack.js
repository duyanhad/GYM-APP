// navigation/AuthStack.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// AUTH SCREENS
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import OTPScreen from "../screens/auth/OTPScreen";
import VerifyLoginOTPScreen from "../screens/auth/VerifyLoginOTPScreen";
import VerifyRegisterScreen from "../screens/auth/VerifyRegisterScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";
import ForgotPasswordVerifyScreen from "../screens/auth/ForgotPasswordVerifyScreen";

const Stack = createNativeStackNavigator();

export default function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />

      {/* OTP SCREENS */}
      <Stack.Screen name="OTP" component={OTPScreen} />
      <Stack.Screen name="VerifyLoginOTP" component={VerifyLoginOTPScreen} />
      <Stack.Screen name="VerifyRegister" component={VerifyRegisterScreen} />

      {/* FORGOT PASSWORD */}
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ForgotPasswordVerify" component={ForgotPasswordVerifyScreen} />
    </Stack.Navigator>
  );
}
