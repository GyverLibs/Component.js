//#region CSS

// Добавить стили, уникально. Без ID будет вычислен хэш
export function addCSS(css, id = '') {
    if (!id) id = _hash(css);
    if (cssMap.has(id)) return;

    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
    cssMap.set(id, style);
    return style;
}

// Удалить стили. Без ID будет вычислен хэш
export function removeCSS(css, id = '') {
    if (!id) id = _hash(css);
    const style = cssMap.get(id);
    if (!style) return;

    cssMap.delete(id);
    style.remove();
}

function _hash(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return hash.toString(36);
}

const cssMap = new Map();   // hash: styleElement