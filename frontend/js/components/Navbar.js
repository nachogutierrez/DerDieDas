import { getUser } from "../firebase.js";
import { dom, html } from "../dom.js";
import { getAuth, signOut } from 'firebase/auth'

import Level from "./Level.js";
import IconButton from "./IconButton.js";
import { navigateTo } from "../navigation.js";
import LoginView from "../views/LoginView.js";

export default function Navbar() {
    const user = getUser()

    return Level({
        children: [
            html(`<p style='margin: 0; padding: 0;'>Welcome, ${user.displayName}!</p>`),
            IconButton({
                icon: 'logout', onClick: async function () {
                    await signOut(getAuth())
                    navigateTo(LoginView)
                }
            })
        ],
        style: {
            'justify-content': 'flex-end'
        }
    })
}

function NavbarItem() {

}