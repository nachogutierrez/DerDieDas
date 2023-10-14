import { dom, styleString } from "../dom.js";

export default function Column({ children = [], style = {} }) {

    const actualStyle = {
        'align-items': 'center',
        ...style,
        'display': 'flex',
        'flex-direction': 'column'
    }

    return dom('div', { style: styleString(actualStyle) }, ...children)
}