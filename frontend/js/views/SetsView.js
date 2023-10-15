import { getSetsClient } from '../sets.js'
import { dom, html } from '../dom.js'
import { navigateTo, updateUI } from '../navigation.js'

import PlayView from './PlayView.js'
import SetSettingsView from './SetSettingsView.js'

import Divider from '../components/Divider.js'
import IconButton from '../components/IconButton.js'
import Fab from '../components/Fab.js'
import FabContainer from '../components/FabContainer.js'
import List from '../components/List.js'
import WordStatus from '../components/WordStatus.js'
import Navbar from '../components/Navbar.js'
import { getWordsClient, getActualScore } from '../words.js'

/**
 * Handlers
 */

async function handleAddSet(sets, setName) {
    await sets.addSet(setName)
    updateUI()
}

async function handleDeleteSet(sets, setName) {
    if (confirm(`Are you sure you want to delete set '${setName}'`)) {
        await sets.removeSet(setName)
        updateUI()
    }
}

function handleClickSettings(setName) {
    navigateTo(SetSettingsView, { setName })
}

function handleClickSet(setName, wordList) {
    if (wordList.length > 0) {
        navigateTo(PlayView, { setName })
    }
}

/**
 * Components
 */
export default function SetsView() {

    const sets = getSetsClient()
    const words = getWordsClient()

    const containerEl = html('<div></div>')

    async function doEffect() {
        const components = [
            Navbar(),
            html(`<h1 style='margin: 0; padding: 0;'>Sets</h1>`)
        ]

        const allSets = await sets.getSets()

        if (allSets.length > 0) {
            components.push(
                List({
                    addDivider: true,
                    items: await Promise.all(allSets.map(async setName => {
                        const wordList = await sets.getWords(setName)

                        const allScoresList = await Promise.all(wordList.map(async word => {
                            const { score, lastUpdated } = await words.getWord(word)
                            return getActualScore(score, lastUpdated)
                        }))

                        const endSlotComponents = [
                            IconButton({ icon: 'settings', onClick: () => handleClickSettings(setName) }),
                            IconButton({ icon: 'delete', onClick: () => handleDeleteSet(sets, setName) })
                        ]
                        if (wordList.length > 0) {
                            endSlotComponents.unshift(WordStatus({ allScoresList }))
                        }
                        return {
                            headline: `<strong>${setName}</strong>`,
                            supportingText: `${wordList.length} words`,
                            isButton: true,
                            onClick: () => handleClickSet(setName, wordList),
                            endSlotComponents
                        }
                    }))
                })
            )
        } else {
            const addWordEl = html(`
            <div>
                You don't have sets yet. Add your first set by clicking the
                <md-fab size='small' style="margin: 0 4px 0 4px;"><md-icon slot='icon'>add</md-icon></md-fab>
                button in the bottom-right corner.
            </div>
            `)
            components.push(addWordEl)
        }

        const dialog = AddSetDialog({ onConfirm: setName => handleAddSet(sets, setName) })
        components.push(
            FabContainer([
                Fab({ icon: 'add', onClick: () => dialog.show() })
            ])
        )
        components.push(dialog)

        for (let c of components) {
            containerEl.appendChild(c)
        }

    }
    doEffect()

    // return dom('div', {}, ...components)
    return containerEl
}

// TODO: add description text area
function AddSetDialog({ onConfirm }) {
    const el = html(`
    <md-dialog id="dialog">
        <form slot="content" id="form-id" method="dialog">
            <md-filled-text-field label="Set name" type="text">
            </md-filled-text-field>
        </form>
        <div slot="actions">
            <md-text-button form="form-id" value="cancel">Cancel</md-text-button>
            <md-text-button form="form-id" value="ok">Ok</md-text-button>
        </div>
    </md-dialog>
    `)
    const textEl = el.querySelector('md-filled-text-field')
    el.addEventListener('close', () => {
        if (el.returnValue === 'cancel') {
            console.debug('canceled set creation dialog');
        } else if (el.returnValue === 'ok') {
            console.debug('confirmed set creation dialog: ' + textEl.value);
            onConfirm(textEl.value)
        }
        textEl.value = ''
    });
    return el
}

function WordSets({ setNames, onClick }) {
    const children = []
    let addDivider = false
    for (let set of setNames) {
        if (addDivider) {
            children.push(Divider())
        }
        addDivider = true
        children.push(WordSet({ setName: set, onClick }))
    }
    return dom('md-list', {}, ...children)
}

function WordSet({ setName, onClick }) {
    const el = html(`
    <md-list-item type='button'>
        <div slot="headline">${setName}</div>
        <md-icon slot="end">settings</md-icon>
    </md-list-item>
    `)

    el.addEventListener('click', () => onClick(setName))

    return el
}