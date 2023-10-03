import { html } from '../dom.js'

export default function IconButton({ icon, onClick }) {
    const el = html(`<md-icon-button><md-icon>${icon}</md-icon></md-icon>`)
    el.addEventListener('click', e => {
        if (onClick) {
            onClick()
        }
        e.stopPropagation()
    })
    return el
}