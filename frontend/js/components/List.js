import { html, dom } from '../dom.js'

import Divider from './Divider.js'

export default function List({ items = [], addDivider = false }) {
    let listItems = items.map(ListItem)
    if (addDivider) {
        listItems = listItems.flatMap((x, i) => i > 0 ? [Divider(), x] : [x])
    }
    return dom('md-list', {}, ...listItems)
}

function ListItem(item = {}) {
    const { headline, supportingText, onClick, startSlotComponents = [], endSlotComponents = [], isButton = false } = item
    const components = [Headline({ text: headline })]
    let attrs = {}
    if (supportingText) {
        components.push(SupportingText({ text: supportingText }))
    }
    if (startSlotComponents) {
        components.push(StartSlot(...startSlotComponents))
    }
    if (endSlotComponents) {
        components.push(EndSlot(...endSlotComponents))
    }
    if (isButton) {
        attrs.type = 'button'
    }
    const el = dom('md-list-item', attrs, ...components)
    if (onClick) {
        el.addEventListener('click', () => onClick(item))
    }
    return el
}

function Headline({ text }) {
    return html(`<div slot="headline">${text}</div>`)
}

function SupportingText({ text }) {
    return html(`<div slot="supporting-text">${text}</div>`)
}

function StartSlot(...components) {
    return Slot({ slot: 'start', children: components })
}

function EndSlot(...components) {
    // return dom('div', { slot: 'end', style: 'display: flex; align-items: center;' }, ...components)
    return Slot({ slot: 'end', children: components })
}

function Slot({ slot, children = [] }) {
    return dom('div', { slot, style: 'display: flex; align-items: center;' }, ...children)
}