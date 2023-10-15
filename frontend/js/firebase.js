import { initializeApp } from 'firebase/app'
import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    browserLocalPersistence,
    setPersistence,
    onAuthStateChanged
} from "firebase/auth"

let app
let user
let unsubscribeAuthListener

export async function initialize() {
    if (app) {
        console.warn(`attempted to initialize firebase but app is already initialized.`)
        return
    }
    const config = await (await fetch('/config.json')).json()
    const firebaseConfig = config.firebase
    app = initializeApp(firebaseConfig)
}

export function getApp() {
    return app
}

export function getUser() {
    return user
}

export async function checkGoogleSession() {
    return new Promise(async (resolve, reject) => {
        const auth = getAuth()
        await setPersistence(auth, browserLocalPersistence)
        unsubscribeAuthListener = onAuthStateChanged(auth, async newUser => {
            unsubscribeAuthListener()
            if (newUser) {
                user = newUser
            }
            resolve(newUser)
        })
    })
}

export async function googleLogIn() {
    const auth = getAuth()
    const provider = new GoogleAuthProvider()
    try {
        const result = await signInWithPopup(auth, provider)
        // This gives you a Google Access Token. You can use it to access the Google API.
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;
        // The signed-in user info.
        const user = result.user;

        return user
    } catch (error) {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        // The email of the user's account used.
        const email = error.customData.email;
        // The AuthCredential type that was used.
        const credential = GoogleAuthProvider.credentialFromError(error);

        console.error({ errorCode, errorMessage, email, credential });
    }
}