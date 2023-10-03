import { navigateTo, updateUI } from './navigation.js'

import SetsView from './views/SetsView.js'

window.addEventListener('load', async () => {
    // TODO: add waiting message
    await import('@material/web/all.js')
    // TODO: remove waiting message
    navigateTo(SetsView)
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