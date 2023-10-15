import PlayView from './views/PlayView.js'
import SetsView from './views/SetsView.js'
import SetSettingsView from './views/SetSettingsView.js'
import LoginView from './views/LoginView.js'

const views = [
    PlayView,
    SetsView,
    SetSettingsView,
    LoginView
]

let navigationCallbacks = []

function findViewByName(viewName) {
    return views.find(v => v.name === viewName)
}

// Figure out how to maintain a consistent url and navigation history
// Might have to implement a router
export function navigateTo(view, context = {}) {
    navigationCallbacks.forEach(f => f())
    navigationCallbacks = []
    history.pushState({ viewName: view.name, context }, "")
    updateUI()
}

export function onNextNavigate(f) {
    navigationCallbacks.push(f)
}

export function goBack() {
    history.back()
    updateUI()
}

export function updateUI() {
    const { viewName, context } = history.state
    if (!viewName || !context) {
        throw new Error(`Can't update UI if { viewName, context } are not present in the history state`)
    }
    const view = findViewByName(viewName)
    if (!view) {
        throw new Error(`Couldn't find view by name '${viewName}'`)
    }
    const app = document.getElementById('app')
    app.innerHTML = '' // clear dom
    app.appendChild(view(context))
}