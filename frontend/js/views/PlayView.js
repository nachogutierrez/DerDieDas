import { dom, html } from '../dom.js'
import { loadSets } from '../sets.js'
import { loadWords, scoreToAsset } from '../words.js'
import { getPons } from '../pons.js'
import { goBack } from '../navigation.js'

function handleMiss(words, word) {
    words.miss(word)
}

function handleHit(words, word) {
    words.hit(word)
}

export default function PlayView({ setName }) {
    const sets = loadSets()
    const words = loadWords()
    const pons = getPons()

    // FIXME: sort based on hits in the past week
    const setWords = sets.getWords(setName).sort(asc(w => words.getScore(w)))
    let currentWordIndex = 0
    let alreadyGuessed = false

    const gameContainerEl = html('<div></div>')
    const damageEffectEl = html(`<div class='damage-effect'></div>`)

    async function updateGameUI() {
        gameContainerEl.innerHTML = ''
        if (currentWordIndex < setWords.length) {
            const word = setWords[currentWordIndex]

            gameContainerEl.appendChild(dom('div',
                {
                    style: 'display: flex; justify-content: center; align-items: center; gap: 8px;'
                },
                html(`<p style='font-size: 36px'>${word}</p>`)
            ))

            const wordDetails = await (await pons).get(word)

            let buttons = {}
            for (let article of ['der', 'die', 'das']) {

                buttons[article] = TextButton({
                    text: capitalizeFirst(article),
                    onClick: () => {
                        // TODO: Add hint or rule when the player makes a mistake
                        buttons[article].setAttribute('disabled', true)
                        if (!alreadyGuessed) {
                            showDamageEffect(damageEffectEl)
                            handleMiss(words, word)
                        }
                        alreadyGuessed = true
                    }
                })
            }

            buttons[wordDetails.article] = TextButton({
                text: capitalizeFirst(wordDetails.article),
                onClick: () => {

                    if (!alreadyGuessed) {
                        confetti()
                        handleHit(words, word)
                    }
                    currentWordIndex++
                    alreadyGuessed = false
                    // Maybe add a small pause with an animation to celebrate
                    updateGameUI()
                }
            })

            gameContainerEl.appendChild(dom('div',
                {
                    style: 'display: flex; justify-content: center; gap: 16px;'
                },
                buttons.der,
                buttons.die,
                buttons.das
            ))
        } else {
            // Game is finished, print final score and add navigation to go back
            // gameContainerEl.appendChild(TextButton({ text: 'Go back', onClick: goBack }))
            goBack()
        }
    }

    updateGameUI()

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