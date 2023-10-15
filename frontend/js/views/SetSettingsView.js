import { dom, html } from '../dom.js'
import { getSetsClient } from '../sets.js'
import {
    getWordsClient,
    currentMilestone,
    getActualScore,
    getExperience,
    milestoneToAsset
} from '../words.js'
import { getApi } from '../api.js'
import { goBack, updateUI } from '../navigation.js'

import FabContainer from '../components/FabContainer.js'
import Fab from '../components/Fab.js'
import List from '../components/List.js'
import IconButton from '../components/IconButton.js'
import Score from '../components/Score.js'
import ExperienceBar from '../components/ExperienceBar.js'
import Navbar from '../components/Navbar.js'

async function handleSearchBarChange(api, query, onWordsReady) {
    if (!query) {
        onWordsReady([])
        return
    }

    // Add progress
    const response = await api.search(query)
    // Remove progress

    onWordsReady(response)
}

async function handleAddWord(sets, setName, word) {
    await sets.addWord(setName, word)
    updateUI()
}

async function handleDeleteWord(sets, setName, word) {
    if (confirm(`Are you sure you want to delete word '${word}'`)) {
        await sets.removeWord(setName, word)
        updateUI()
    }
}

function handleWordClick(word) {
    console.log(`Clicked word '${word}'. TODO: implement word click`)
}

// TODO: add translation
export default function SetSettingsView({ setName }) {
    const sets = getSetsClient()
    const words = getWordsClient()

    const containerEl = dom('div', {})

    async function doEffect() {
        const wordList = await sets.getWords(setName)

        const allScores = {}
        const allScoresList = []
        const allWords = {}
        await Promise.all(wordList.map(async word => {
            allWords[word] = await words.getWord(word)
            const { score, lastUpdated } = allWords[word]
            allScores[word] = getActualScore(score, lastUpdated)
            allScoresList.push(allScores[word])
        }))

        const api = await getApi()

        const addWordDialog = AddWordDialog({
            onConfirm: word => handleAddWord(sets, setName, word),
            onSearch: (query, onWordsReady) => handleSearchBarChange(api, query, onWordsReady)
        })

        let components = [
            Navbar(),
            html(`<h1>Sets > ${setName}</h1>`),
            Score({ allScoresList })
        ]

        if (wordList.length > 0) {
            components.push(
                List({
                    addDivider: true,
                    items: await Promise.all(wordList.map(async word => {
                        const { key, singular, plural, article, translations } = await api.get(word)
                        const score = allScores[word]

                        const endSlotComponents = [
                            IconButton({ icon: 'settings', onClick: () => { } }),
                            IconButton({ icon: 'delete', onClick: () => handleDeleteWord(sets, setName, key) })
                        ]
                        if (currentMilestone(score) < 4) {
                            endSlotComponents.unshift(ExperienceBar({ experience: getExperience(score) }))
                        } else {
                            endSlotComponents.unshift(ExperienceBar({ experience: 1, isMaxedOut: true }))
                        }

                        return {
                            headline: `${capitalizeFirst(article)} ${key}`,
                            supportingText: translations.join(', '),
                            onClick: () => {
                                handleWordClick(key)
                            },
                            startSlotComponents: [
                                html(`<img src='${milestoneToAsset(currentMilestone(score))}' width=32 height=32></img>`)
                            ],
                            endSlotComponents
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
            containerEl.appendChild(component)
        }
    }
    doEffect()

    return containerEl
}

function AddWordDialog({ onConfirm, onSearch }) {
    const el = html(`<md-dialog></md-dialog>`)
    const listContainerEl = html(`<div style="height: 500px; overflow-y: scroll;"></div>`)

    // TODO: Optimize so we don't call the api on EVERY update
    function onWordsReady(wordList) {
        const listItems = []
        for (let wordItem of wordList) {
            const { key, translations } = wordItem
            listItems.push({
                headline: key,
                supportingText: translations.join(', '),
                isButton: true,
                onClick: item => {
                    onConfirm(key)
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