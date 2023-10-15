import { html, dom } from "../dom.js";
import { initialize, checkGoogleSession, googleLogIn } from "../firebase.js";
import { navigateTo, onNextNavigate } from "../navigation.js";

import SetsView from "./SetsView.js";
import { sleep } from "../promises.js";

export default function LoginView() {

    async function doEffect() {
        await initialize()
        const user = await checkGoogleSession()
        if (user) {
            navigateTo(SetsView)
        }
    }
    doEffect()

    async function handleGoogleLogin() {
        await googleLogIn()
        const user = await checkGoogleSession()
        if (user) {
            navigateTo(SetsView)
        }
    }

    const googleButton = html(`
    <img class='google-button' width=191 tabindex="0">
    `)

    googleButton.addEventListener('click', () => {
        handleGoogleLogin()
        googleButton.disabled = true
    })
    return dom('div',
        {
            style: 'position: fixed; width:100%; height:100%; display: flex; justify-content: center; align-items: center;'
        },
        googleButton
    )
}