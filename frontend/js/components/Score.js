import { html, dom } from "../dom.js";
import { loadWords } from "../words.js";
import { milestoneToAsset } from "../words.js";

export default function Score({ wordList }) {
    const words = loadWords()

    const milestoneMap = {}
    for (const word of wordList) {
        // const score = words.getScore(word)
        const milestone = words.currentMilestone(word)
        if (!(milestone in milestoneMap)) {
            milestoneMap[milestone] = 0
        }
        milestoneMap[milestone] += 1
    }

    const components = []
    for (let milestone = 0; milestone <= 4; milestone++) {
        let amount = milestoneMap[milestone]
        if (!amount) {
            amount = 0
        }
        components.push(MilestoneItem({ milestone, amount }))
    }

    return dom('div', { style: 'display: flex; gap: 16px;', class: 'unselectable' }, ...components)
}

function MilestoneItem({ milestone, amount }) {
    return html(`
    <div style='display: flex; align-items: center; gap: 2px;'>
        <img src='${milestoneToAsset(milestone)}' width=32 height=32></img>
        <p><strong>${amount}</strong></p>
    </div>
    `)
}