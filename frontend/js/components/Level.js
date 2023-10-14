import { dom, styleString } from "../dom.js";

export default function Level({ children = [], style = {} }) {
    const actualStyle = {
        'align-items': 'center',
        ...style,
        'display': 'flex'
    }

    return dom('div', { style: styleString(actualStyle) }, ...children)
}