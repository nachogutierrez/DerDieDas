export function dom(elType, attrs = {}, ...children) {
    const el = document.createElement(elType)
    for (let key of Object.keys(attrs)) {
        el.setAttribute(key, attrs[key])
    }
    children.filter(x => x !== undefined).forEach(c => el.appendChild(c))
    return el
}

export function html(htmlString) {
    const el = document.createElement('div')
    el.innerHTML = htmlString.trim()
    return el.firstChild
}

export function styleString(style = {}) {
    let str = ''
    for (let key of Object.keys(style)) {
        str += `${key}:${style[key]};`
    }
    return str
}