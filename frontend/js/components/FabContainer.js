import { dom, html } from '../dom.js'

// HOC
// [Component] => Component
export default function FabContainer(fabs = []) {
    return dom('div', { class: 'fab-container' }, ...fabs)
}