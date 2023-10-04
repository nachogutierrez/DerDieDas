import { dom } from "../dom.js";

export default function MobileOnly(...children) {
    return dom('div', { class: 'mobile-only' }, ...children)
}