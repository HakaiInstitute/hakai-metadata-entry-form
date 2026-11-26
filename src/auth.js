import { getAuth, signInWithPopup, onAuthStateChanged, GoogleAuthProvider } from "firebase/auth";
import firebase from "./firebase";

const provider = new GoogleAuthProvider();

// "promt" was a typo. Google ignores parameters it doesn't recognise, so the account
// chooser this is meant to request was never actually asked for.
provider.setCustomParameters({ prompt: "select_account" });
const auth = getAuth(firebase);
const signInWithGoogle = () => signInWithPopup(auth, provider);
export { signInWithGoogle, auth, getAuth, onAuthStateChanged };
