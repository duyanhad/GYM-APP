// frontend/screens/auth/authStyles.js
import { StyleSheet } from "react-native";

export const authStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#283633ff",
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    width: "90%",
    backgroundColor: "#000000ff",
    padding: 30,
    borderRadius: 30,
    alignItems: "center",
  },

  logoWrapper: {
    width: 110,
    height: 110,
    backgroundColor: "#222",
    borderRadius: 55,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#e53935",
    marginBottom: 25,
  },

  logo: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },

  title: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "800",
    marginBottom: 10,
  },

  subtitle: {
    color: "#aaa",
    marginBottom: 20,
    textAlign: "center",
  },

  bold: {
    color: "#fff",
    fontWeight: "700",
  },

  input: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 10,
  },

  inputError: {
    borderWidth: 2,
    borderColor: "#ff4d4d",
  },

  errorText: {
    color: "#ff4d4d",
    fontSize: 13,
    marginBottom: 10,
    marginLeft: 5,
  },

  button: {
    width: "100%",
    backgroundColor: "#e53935",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
    overflow: "hidden",
  },

  btnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },

  neonOverlay: {
    position: "absolute",
    top: -5,
    bottom: -5,
    left: -5,
    right: -5,
    borderRadius: 14,
    backgroundColor: "#ff4d4d55",
  },

  switchText: {
    color: "#ddd",
    fontSize: 14,
  },

  forgot: {
    color: "#e53935",
    marginBottom: 14,
    marginTop: -10,
    fontWeight: "600",
  },

  back: {
    color: "#ddd",
    textAlign: "center",
    marginTop: 14,
  },

  backText: {
    color: "#ddd",
    textAlign: "center",
    marginTop: 4,
  },

  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },

  otpInput: {
    width: 45,
    height: 55,
    backgroundColor: "#fff",
    borderRadius: 10,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
  },

  resendRow: {
    marginBottom: 10,
  },

  resendText: {
    color: "#ccc",
  },

  resendLink: {
    color: "#e53935",
    fontWeight: "700",
  },
});
