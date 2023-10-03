import { html } from '../dom.js'

export default function Fab({ icon, onClick }) {
    const el = html(`
    <md-fab lowered aria-label="Add" class="fab">
        <md-icon slot="icon">${icon}</md-icon>
    </md-fab>
    `)
    el.addEventListener('click', onClick)
    return el
}