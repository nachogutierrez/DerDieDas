import { html, dom } from "../dom.js";
import { loadWords } from "../words.js";
import { scoreToAsset } from "../words.js";

export default function Score({ wordList }) {
    const words = loadWords()

    const scoreMap = {}
    for (const word of wordList) {
        const score = words.getScore(word)
        if (!(score in scoreMap)) {
            scoreMap[score] = 0
        }
        scoreMap[score] += 1
    }

    const components = []
    for (let score = 0; score <= 4; score++) {
        let amount = scoreMap[score]
        if (!amount) {
            amount = 0
        }
        components.push(ScoreItem({ score, amount }))
    }

    return dom('div', { style: 'display: flex; gap: 16px;', class: 'unselectable' }, ...components)
}

function ScoreItem({ score, amount }) {
    return html(`
    <div style='display: flex; align-items: center; gap: 2px;'>
        <img src='${scoreToAsset(score)}' width=32 height=32></img>
        <p><strong>${amount}</strong></p>
    </div>
    `)
}