import { navigateTo, updateUI } from './navigation.js'
import LoginView from './views/LoginView.js'

import SetsView from './views/SetsView.js'

window.addEventListener('load', async () => {
    const splash = document.querySelector('.splashscreen')
    await import('@material/web/all.js')
    navigateTo(LoginView)
    setTimeout(() => {
        splash.style.opacity = '0'
        setTimeout(() => {
            splash.style.display = 'none'
        }, 1000)
    }, 1000)
})

window.addEventListener('popstate', () => {
    // Some back button events might leave history in invalid state
    if (!history.state.viewName) {
        console.debug(`Invalid history state, navigating to SetsView`)
        navigateTo(SetsView)
        return
    }

    // Refresh UI on each back event
    updateUI()
})