import { dom, html } from '../dom.js'
import { loadWords, scoreToColor } from '../words.js'

export default function WordStatus({ wordList = [] }) {
    const words = loadWords()

    const components = wordList
        .sort((a, b) => words.getScore(a) - words.getScore(b))
        .map(word => (
            html(`<div style='width: 4px; background: ${scoreToColor(words.getScore(word))}; flex: 1;'></div>`)
        ))
    return dom('div', { style: 'display: flex; border: 2px solid black; height: 16px; width: 128px; background: blue;' }, ...components)
}