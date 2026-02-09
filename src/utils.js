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

//#region watch

// проверить статус подключения в DOM и рендера
export function watchMount(el, waitRender = false, tries = 100) {
    return new Promise(res => {
        let mounted, rendered;
        const check = () => {
            if (el.isConnected) {
                if (!el._mounted) {
                    el._mounted = true;
                    if (el._onMount) el._onMount();
                }
                if (!mounted) {
                    mounted = true;
                    if (!waitRender) res(el);
                }

                if (el.clientWidth || el.clientHeight) {
                    if (!el._rendered) {
                        el._rendered = true;
                        if (el._onRender) el._onRender();
                    }
                    if (!rendered) {
                        rendered = true;
                        if (waitRender) res(el);
                    }
                    return;
                }
            }
            if (tries--) {
                requestAnimationFrame(check);
            } else {
                if ((waitRender && !rendered) || (!waitRender && !mounted)) res(null);
            }
        };

        check();
    });
}

// следить за обновлениями размера элемента
export function watchResize(el, onResize) {
    const ro = new ResizeObserver(entries => {
        for (const entry of entries) {
            if (entry.target === el) onResize(entry);
        }
    });

    ro.observe(el);

    const mo = new MutationObserver(() => {
        if (!el.isConnected) {
            ro.disconnect();
            mo.disconnect();
        }
    });

    mo.observe(document.body, { childList: true, subtree: true });
}