import { dom } from "../dom.js";

export default function NonMobile(...children) {
    return dom('div', { class: 'non-mobile' }, ...children)
}