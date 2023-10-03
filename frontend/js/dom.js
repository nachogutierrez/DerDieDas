export function dom(elType, attrs = {}, ...children) {
    const el = document.createElement(elType)
    for (let key of Object.keys(attrs)) {
        el.setAttribute(key, attrs[key])
    }
    children.forEach(c => el.appendChild(c))
    return el
}

export function html(htmlString) {
    const el = document.createElement('div')
    el.innerHTML = htmlString.trim()
    return el.firstChild
}