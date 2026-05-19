import { EL } from "./EL";
export { EL };

/// #if !NO_SVG
import { SVG } from "./SVG";
export { SVG };
/// #endif

/// #if !NO_STYLE
import { addCSS, removeCSS } from "./Style";
export { addCSS, removeCSS };
/// #endif

/// #if !NO_STATE
import { State, useState } from "./State";
export { State, useState };
/// #endif

/// #if !NO_SHADOW

// Создать теневой элемент от указанного тега/Node host, дети подключатся к нему в shadowRoot, стили запишутся в $style
export function makeShadow(host, cfg = {}, css = '') {
    if (!host) return null;

    if (!(host instanceof Node)) host = document.createElement(host);
    host.attachShadow({ mode: 'open' });

    EL.update(host.shadowRoot, {
        ctx: cfg.context ?? cfg.ctx,
        child: [{ tag: 'style', $: 'style', text: css }, cfg.child, cfg.children],
    });
    delete cfg.child;
    delete cfg.children;
    return EL.update(host, cfg);
}

/// #endif

/// #if !NO_TEMPLATE

// Определить глобальный шаблон, fn - функция, возвращающая cfg-конфиг
export function setTemplate(name, tag, fn) {
    _templates.set(name, (...args) => EL.make(tag, fn(...args)));
}

// Вызвать шаблон
export function useTemplate(name, ...args) {
    const t = _templates.get(name);
    return t ? t(...args) : null;
}

const _templates = new Map();

/// #endif