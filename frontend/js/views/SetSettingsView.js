import { dom, html } from '../dom.js'
import { loadSets } from '../sets.js'
import { loadWords, scoreToAsset } from '../words.js'
import { getPons } from '../pons.js'
import { goBack, updateUI } from '../navigation.js'

import FabContainer from '../components/FabContainer.js'
import Fab from '../components/Fab.js'
import List from '../components/List.js'
import IconButton from '../components/IconButton.js'
import Score from '../components/Score.js'

async function handleSearchBarChange(pons, query, onWordsReady) {
    if (!query) {
        onWordsReady([])
        return
    }

    // Add progress
    const response = await pons.search(query)
    // Remove progress

    onWordsReady(Object.keys(response).map(word => ({ word, translation: response[word].translation })))
}

async function handleAddWord(sets, setName, word) {
    sets.addWord(setName, word)
    updateUI()
}

function handleDeleteWord(sets, setName, word) {
    if (confirm(`Are you sure you want to delete word '${word}'`)) {
        sets.removeWord(setName, word)
        updateUI()
    }
}

function handleWordClick(word) {
    console.log(`Clicked word '${word}'. TODO: implement word click`)
}

// TODO: add translation
export default function SetSettingsView({ setName }) {
    const words = loadWords()
    const sets = loadSets()

    const wordList = sets.getWords(setName)

    const root = dom('div', {})

    async function createComponents() {
        const pons = await getPons()

        const addWordDialog = AddWordDialog({
            onConfirm: word => handleAddWord(sets, setName, word),
            onSearch: (query, onWordsReady) => handleSearchBarChange(pons, query, onWordsReady)
        })

        let components = [html(`<h1>Sets > ${setName}</h1>`)]
        components.push(Score({ wordList }))
        if (wordList.length > 0) {
            components.push(
                List({
                    addDivider: true,
                    items: await Promise.all(wordList.map(async word => {
                        const wordDetails = await pons.get(word)
                        return {
                            headline: `${capitalizeFirst(wordDetails.article)} ${word}`,
                            supportingText: wordDetails.translation,
                            onClick: () => {
                                handleWordClick(word)
                            },
                            startSlotComponents: [
                                html(`<img src='${scoreToAsset(words.getScore(word))}' width=32 height=32></img>`)
                            ],
                            endSlotComponents: [
                                IconButton({ icon: 'settings', onClick: () => { } }),
                                IconButton({ icon: 'delete', onClick: () => handleDeleteWord(sets, setName, word) })
                            ]
                        }
                    }))
                })
            )
        } else {
            const addWordEl = html(`
            <div>
                This set is empty. Add your first word by clicking the
                <md-fab size='small' style="margin: 0 4px 0 4px;"><md-icon slot='icon'>add</md-icon></md-fab>
                button in the bottom-right corner.
            </div>
            `)
            components.push(addWordEl)
        }
        components.push(addWordDialog)
        components.push(
            FabContainer([
                Fab({ icon: 'add', onClick: () => { addWordDialog.show() } }),
            ])
        )

        for (let component of components) {
            root.appendChild(component)
        }
    }

    createComponents()

    return root
}

function AddWordDialog({ onConfirm, onSearch }) {
    const el = html(`<md-dialog></md-dialog>`)
    const listContainerEl = html(`<div style="height: 500px; overflow-y: scroll;"></div>`)

    // TODO: Optimize so we don't call the api on EVERY update
    function onWordsReady(wordList) {
        const listItems = []
        for (let wordItem of wordList) {
            const { word, translation } = wordItem
            listItems.push({
                headline: word,
                supportingText: translation,
                isButton: true,
                onClick: item => {
                    onConfirm(item.headline)
                    el.close()
                }
            })
        }
        listContainerEl.innerHTML = ''
        if (wordList.length > 0) {
            listContainerEl.appendChild(List({ addDivider: true, items: listItems }))
        }
    }

    let last = undefined

    el.appendChild(dom('form', { method: 'dialog', id: 'form-id', slot: 'content' },
        SearchBar({
            onChange: query => {
                if (last !== undefined) {
                    last.cancel()
                }
                listContainerEl.innerHTML = ''
                listContainerEl.appendChild(ProgressIndicator())
                last = cancellableCallback(onWordsReady)
                return onSearch(query, last)
            }
        }),
        listContainerEl
    ))
    return el
}

function ProgressIndicator() {
    return html(`
    <div style='display: flex; justify-content: center;'>
        <md-circular-progress indeterminate></md-circular-progress>
    </div>
    `)
}

function SearchBar({ onChange }) {
    const el = html(`
    <md-outlined-text-field placeholder="Search for words" type="search">
        <md-icon slot="leading-icon">search</md-icon>
    </md-outlined-text-field>
    `)

    el.addEventListener('input', e => {
        onChange(el.value)
    })

    return el
}

function capitalizeFirst(s) {
    return s[0].toUpperCase() + s.slice(1)
}

function cancellableCallback(cb) {
    let canceled = false
    const newCallback = function (...args) {
        if (!canceled) {
            cb(...args)
        }
    }
    newCallback.cancel = function () {
        canceled = true
    }
    return newCallback
}