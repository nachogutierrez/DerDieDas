import { dom, html } from '../dom.js'
import { currentMilestone, milestoneToColor } from '../words.js'

export default function WordStatus({ allScoresList = [] }) {
    const components = allScoresList
        .sort((a, b) => a - b)
        .map(score => (
            html(`<div style='width: 4px; background: ${milestoneToColor(currentMilestone(score))}; flex: 1;'></div>`)
        ))
    return dom('div', { style: 'display: flex; border: 2px solid black; height: 16px; width: 128px; background: blue;' }, ...components)
}