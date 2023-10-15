import { dom, html } from '../dom.js'
import { getSetsClient } from '../sets.js'
import {
    getWordsClient,
    currentMilestone,
    getActualScore,
    getExperience,
    isMaxScore,
    willLevelUp,
    updateScore
} from '../words.js'
import { getApi } from '../api.js'
import { goBack } from '../navigation.js'
import { shuffle } from '../array.js'
import { sleep } from '../promises.js'

import ExperienceBar from '../components/ExperienceBar.js'
import Column from '../components/Column.js'
import Level from '../components/Level.js'
import MilestoneIcon from '../components/MilestoneIcon.js'

function handleMiss(words, word, score) {
    const newScore = updateScore(score, false)
    return words.updateWord(word, newScore)
}

function handleHit(words, word, score) {
    const newScore = updateScore(score, true)
    return words.updateWord(word, newScore)
}

export default function PlayView({ setName }) {
    const api = getApi()
    const sets = getSetsClient()
    const words = getWordsClient()
    let allWords = {}

    let currentWordIndex = 0
    let alreadyGuessed = false
    let animating = false

    const gameContainerEl = html('<div></div>')
    const damageEffectEl = html(`<div class='damage-effect'></div>`)

    async function updateGameUI(setWords) {
        gameContainerEl.innerHTML = ''
        if (currentWordIndex < setWords.length) {
            const word = setWords[currentWordIndex]
            const wordDetails = await (await api).get(word)
            const { score, lastUpdated } = allWords[word]
            const actualScore = getActualScore(score, lastUpdated)
            const milestone = currentMilestone(actualScore)
            const experience = getExperience(actualScore)

            let experienceBar
            if (milestone === 4) {
                experienceBar = ExperienceBar({ experience: 1, isMaxedOut: true })
            } else {
                experienceBar = ExperienceBar({ experience })
            }
            const milestoneIcon = MilestoneIcon({
                milestone,
                style: {
                    position: 'absolute',
                    left: '-8px',
                    top: '50%',
                    transform: 'translateY(-50%) translateX(-100%)'
                }
            })

            let buttons = {}
            for (let article of ['der', 'die', 'das']) {

                buttons[article] = TextButton({
                    text: capitalizeFirst(article),
                    onClick: async () => {
                        if (animating) {
                            return
                        }
                        buttons[article].setAttribute('disabled', true)
                        if (!alreadyGuessed) {
                            alreadyGuessed = true
                            await handleMiss(words, word, actualScore)
                            animating = true
                            showDamageEffect(damageEffectEl)
                            if (milestone === 4) {
                                experienceBar.setMaxedOut(false)
                            }
                            if (experience > 0 || milestone === 4) {
                                experienceBar.setAnimate(true)
                                await sleep(0)
                                experienceBar.setExperience(0)
                                await sleep(300)
                            }
                            if (milestone > 0) {
                                milestoneIcon.setMilestone(milestone - 1)
                                experienceBar.setAnimate(false)
                                await sleep(0)
                                experienceBar.setExperience(1)
                                await sleep(50) // allow render
                                experienceBar.setAnimate(true)
                                await sleep(0)
                                experienceBar.setExperience(0)
                                await sleep(600)
                            }
                            animating = false
                        }
                    }
                })
            }

            buttons[wordDetails.article] = TextButton({
                text: capitalizeFirst(wordDetails.article),
                onClick: async () => {
                    if (animating) {
                        return
                    }
                    if (!alreadyGuessed) {
                        alreadyGuessed = true
                        await handleHit(words, word, actualScore)
                        if (!isMaxScore(actualScore)) {
                            animating = true
                            if (willLevelUp(actualScore)) {
                                confetti()
                                experienceBar.setAnimate(true)
                                await sleep(0)
                                experienceBar.setExperience(1)
                                await sleep(300)
                            } else {
                                const newExperience = getExperience(actualScore + 1)
                                experienceBar.setAnimate(true)
                                await sleep(0)
                                experienceBar.setExperience(newExperience)
                                await sleep(300)
                            }
                            animating = false
                        }
                    }
                    currentWordIndex++
                    alreadyGuessed = false
                    // Maybe add a small pause with an animation to celebrate
                    updateGameUI(setWords)
                }
            })

            const derDieDasButtons = dom('div',
                {
                    style: 'display: flex; justify-content: center; gap: 16px;'
                },
                buttons.der,
                buttons.die,
                buttons.das
            )

            gameContainerEl.appendChild(
                Column({
                    children: [
                        html(`<p style='font-size: 36px; margin: 0;'>${word}</p>`),
                        Level({
                            children: [
                                milestoneIcon,
                                experienceBar
                            ],
                            style: {
                                gap: '8px',
                                position: 'relative'

                            }
                        }),
                        derDieDasButtons
                    ],
                    style: { gap: '8px' }
                })
            )
        } else {
            // Game is finished, print final score and add navigation to go back
            // gameContainerEl.appendChild(TextButton({ text: 'Go back', onClick: goBack }))
            goBack()
        }
    }

    async function doEffect() {
        const wordList = await sets.getWords(setName)
        await Promise.all(wordList.map(async word => {
            allWords[word] = await words.getWord(word)
        }))

        const wordsByMilestone = {}
        wordsByMilestone[0] = []
        wordsByMilestone[1] = []
        wordsByMilestone[2] = []
        wordsByMilestone[3] = []
        wordsByMilestone[4] = []
        for (let word of wordList) {
            const { score, lastUpdated } = allWords[word]
            const actualScore = getActualScore(score, lastUpdated)
            const milestone = currentMilestone(actualScore)
            wordsByMilestone[milestone].push(word)
        }
        shuffle(wordsByMilestone[0])
        shuffle(wordsByMilestone[1])
        shuffle(wordsByMilestone[2])
        shuffle(wordsByMilestone[3])
        shuffle(wordsByMilestone[4])
        const setWords = [
            ...wordsByMilestone[0],
            ...wordsByMilestone[1],
            ...wordsByMilestone[2],
            ...wordsByMilestone[3],
            ...wordsByMilestone[4],
        ]

        updateGameUI(setWords)
    }
    doEffect()

    return dom('div', {},
        gameContainerEl,
        damageEffectEl,
    )
}

function TextButton({ text, onClick, disabled = false }) {
    const el = html(`<md-filled-button ${disabled ? 'disabled' : ''}>${text}</md-filled-button>`)
    el.addEventListener('click', onClick)
    return el
}

function showDamageEffect(damageEffectEl) {

    damageEffectEl.style.opacity = '.5';

    // After a short duration, begin fading out the effect
    setTimeout(() => {
        damageEffectEl.style.opacity = '0';
    }, 150); // You can adjust this duration based on how long you want the effect to remain fully visible before fading out.
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

const asc = f => (a, b) => f(a) - f(b)
const desc = f => (a, b) => f(b) - f(a)

const hours = h => h * 60 * 60 * 1000
const days = d => hours(24 * d)