import { watchMount, watchResize } from "./utils";

export class EL {
    // Создать элемент и поместить его в переменную $root
    constructor(tag, cfg = {}, svg = false) {
        this.$root = EL.makeIn(this, tag, cfg, svg);
    }

    //#region ## make

    // Создать элемент
    static make(tag, cfg = {}, svg = false) {
        if (cfg instanceof Node) return cfg;
        let el = (tag == 'svg' || svg)
            ? document.createElementNS("http://www.w3.org/2000/svg", tag ?? 'svg')
            : document.createElement(tag ?? 'div');

        /// #if !TINY_COMPONENT
        for (let k of EL_METHODS) {
            el[k] = (...a) => EL[k](el, ...a);
        }
        /// #endif

        return EL.update(el, cfg);
    }

    // Создать элемент в контексте
    static makeIn(context, tag, cfg = {}, svg = false) {
        return EL.make(tag, { ...cfg, context }, svg);
    }

    //#region ## update

    // Обновить элемент или массив элементов
    static update(el, cfg) {
        if (Array.isArray(el)) {
            return el.map(e => EL.update(e, cfg));
        }
        if (!(el instanceof Node) || (typeof cfg !== 'object')) {
            return el;
        }

        const context = ('context' in cfg) ? cfg.context : EL.context;
        const e = { el, context, ctx: context };

        /// #if !TINY_COMPONENT
        CALLBACKS.forEach(fn => {
            if (fn in cfg) el['_' + fn] = cfg[fn].bind(context, e);
        });
        /// #endif

        for (let [param, val] of Object.entries(cfg)) _update(e, param, val);

        /// #if !TINY_COMPONENT
        if (el._onUpdate) el._onUpdate();
        /// #endif

        if (cfg.also) cfg.also.call(context, e);

        if ('context' in cfg) EL.context = cfg.context;

        return el;
    }

    // Обновить элемент в контексте
    static updateIn(context, el, cfg) {
        return EL.update(el, { ...cfg, context });
    }

    //#region ## lifecycle

    // Подключить к родителю, null - отключить, вернёт Promise
    static mount(el, parent, waitRender = false, tries = 100) {
        /// #if !TINY_COMPONENT
        if (el) {
            if (parent == null) {
                if (el.parentNode) el.parentNode.removeChild(el);
            } else {
                /// #endif
                if (el.parentNode !== parent) parent.appendChild(el);
                /// #if !TINY_COMPONENT
                if (tries) return watchMount(el, waitRender, tries);
            }
        }
        /// #endif
        return Promise.resolve(el);
    }

    // Удалить всех детей
    static clear(el, recursive = true) {
        if (!el) return;
        while (el.firstChild) {
            /// #if !TINY_COMPONENT
            if (recursive) EL.clear(el.firstChild, true);
            /// #endif
            EL.remove(el.firstChild, false);
        }
    }

    // Удалить элемент
    static remove(el, recursive = true) {
        if (!el) return;
        /// #if !TINY_COMPONENT
        if (recursive) EL.clear(el, true);
        EL.release(el);
        EL.unbind(el);
        if (el._onDestroy) el._onDestroy();
        CALLBACKS.forEach(fn => el['_' + fn] = null);
        /// #endif
        if (el.parentNode) el.parentNode.removeChild(el); // remove
    }

    /// #if !TINY_COMPONENT

    // Наблюдать изменения размера
    static watchResize = watchResize;

    // Наблюдать статус подключения и рендера
    static watchMount = watchMount;

    // Заменить ребёнка old на нового el, old удалить, у el запустить монтаж с вызовом обработчиков. Вернёт el
    static replace(old, el) {
        if (old) {
            if (old.parentNode) old.parentNode.replaceChild(el, old);
            watchMount(el);
            old.remove();
        }
        return el;
    }

    // Отключить on-обработчики
    static release(el) {
        if (el && el._events) {
            el._events.forEach(({ ev, fn, options }) => el.removeEventListener(ev, fn, options));
            el._events = [];
        }
    }

    // Отключить state-бинды
    static unbind(el) {
        if (el && el._unsub) {
            el._unsub.forEach(f => f());
            el._unsub = [];
        }
    }

    /// #endif

    //#region ## shadow

    /// #if !TINY_COMPONENT

    // Создать теневой элемент от указанного тега host, дети подключатся к нему в shadowRoot, стили запишутся в $style
    static makeShadow(host, cfg = {}, css = '') {
        if (!host || typeof cfg !== 'object') return null;

        let $host = (host instanceof Node) ? host : document.createElement(host);
        $host.attachShadow({ mode: 'open' });

        EL.update($host.shadowRoot, {
            context: cfg.context,
            children: [
                { tag: 'style', $: 'style', text: css },
                cfg.child,
                cfg.children,
            ]
        });
        delete cfg.child;
        delete cfg.children;
        return EL.update($host, cfg);
    }

    // Создать теневой элемент в контексте
    static makeShadowIn(context, host, cfg = {}, css = '') {
        return EL.makeShadow(host, { ...cfg, context }, css);
    }

    /// #endif

    //#region ## template

    /// #if !TINY_COMPONENT

    // Определить глобальный шаблон, fn - функция, возвращающая cfg-конфиг
    static setTemplate(name, tag, fn) {
        EL.templates.set(name, (...args) => EL.make(tag, fn(...args)));
    }

    // Вызвать шаблон
    static useTemplate(name, ...args) {
        const t = EL.templates.get(name);
        return t ? t(...args) : null;
    }

    static templates = new Map();

    /// #endif

    static context;     // fallback context

    // legacy
    static config = EL.update;
    static configIn = EL.updateIn;
}

//#region ## private

/// #if !TINY_COMPONENT
const EL_METHODS = ['update', 'mount', 'replace', 'clear', 'remove', 'release', 'unbind', 'watchResize', 'watchMount'];
const CALLBACKS = ['onMount', 'onRender', 'onUpdate', 'onDestroy'];
/// #endif

const SKIP_PARAM = new Set(['tag', 'get', 'also', 'context',
    /// #if !TINY_COMPONENT
    ...CALLBACKS
    /// #endif
]);

const PARAM_ALIAS = {
    var: '$',
    child: 'children',
    child_r: 'children_r',
    text: 'textContent',
    html: 'innerHTML',
    click: 'onclick',
    input: 'oninput',
    change: 'onchange',
    mousewheel: 'onmousewheel',
};

const PARAM_UPD = {
    push(e, val) {
        val.push(e.el);
    },
    $(e, val) {
        if (e.ctx) e.ctx['$' + val] = e.el;
    },
    attrs(e, val) {
        _applyP('attrs', e, val, (k, v) => e.el.setAttribute(k, v), k => e.el.removeAttribute(k));
    },
    data(e, val) {
        _applyP('data', e, val, (k, v) => e.el.dataset[k] = v, k => delete e.el.dataset[k]);
    },
    props(e, val) {
        for (let p in val) {
            let v = _makeVal(e, p, null, val[p]);
            e.el[p] = (
                (p == 'value' && ['number', 'range'].includes(e.el.type)) ||
                ['min', 'max', 'step'].includes(p)
            ) ? (Number.isFinite(v) ? v : 0) : (v ?? '');
        }
    },
    animate(e, val) {
        const { duration = 300, easing = 'ease', onEnd = null, ...styles } = val;
        e.el.style.transition = Object.keys(styles).map(st => `${st} ${duration}ms ${easing}`).join(', ');
        requestAnimationFrame(() => { for (let st in styles) e.el.style[st] = styles[st]; });
        if (onEnd) e.el.addEventListener('transitionend', () => onEnd.call(e.ctx, e), { once: true });
    },
    events(e, val) {
        for (let ev in val) {
            let h = val[ev];
            let options = {};

            if (typeof h === 'object') {
                for (let opt in h) {
                    if (opt != 'handler') options[opt] = h[opt];
                }
                h = h.handler;
            }

            const fn = (evt) => h.call(e.ctx, Object.assign(evt, e));
            (e.el._events ??= []).push({ ev, fn, options });
            e.el.addEventListener(ev, fn, options);
        }
    },
    events_r(e, val) {
        /// #if !TINY_COMPONENT
        EL.release(e.el);
        /// #endif
        PARAM_UPD.events(e, val);
    },
    children(e, val) {
        _addChild(e, val);
    },
    children_r(e, val) {
        EL.clear(e.el);
        _addChild(e, val);
    },
    style(e, val) {
        _applyObj('style', e, val,
            r => e.el.style.cssText += r + ';',
            (k, v) => e.el.style[k] = v
        );
    },
    style_r(e, val) {
        e.el.style.cssText = '';
        PARAM_UPD.style(e, val);
    },
    class(e, val) {
        _applyObj('class', e, val,
            r => r.split(/\s+/).forEach(c => c && e.el.classList.add(c)),
            (k, v) => v ? e.el.classList.add(k) : e.el.classList.remove(k)
        );
    },
    class_r(e, val) {
        e.el.className = '';
        PARAM_UPD.class(e, val);
    },
    parent(e, val) {
        EL.mount(e.el, val, false, (e.el._onMount || e.el._onRender) ? 100 : 0);
    },
};

function _applyP(param, e, val, set, del) {
    for (let p in val) {
        let v = _makeVal(e, param, p, val[p]);
        (v == null) ? del(p) : set(p, String(v));
    }
}

function _applyObj(param, e, val, raw, add) {
    if (typeof val === 'string') {
        raw(val);
    } else {
        for (let k in val) {
            if (k == '_raw') PARAM_UPD[param](e, val[k]);
            else add(k, _makeVal(e, param, k, val[k]));
        }
    }
}

function _addChild(e, obj) {
    if (!obj) return;
    else if (obj instanceof Node) EL.mount(obj, e.el);
    else if (obj instanceof EL) EL.mount(obj.$root, e.el);
    else if (Array.isArray(obj)) obj.forEach(o => _addChild(e, o));
    else if (typeof obj === 'string') e.el.insertAdjacentHTML('beforeend', obj);
    else if (typeof obj === 'object') EL.make(obj.tag, { ...obj, parent: e.el, context: obj.context ?? e.ctx }, e.el instanceof SVGElement);
}

function _makeVal(e, param, sub, val) {
    /// #if !TINY_COMPONENT
    if (typeof val == 'function') {
        return val.call(e.ctx, e);
    }

    if (Array.isArray(val) && val[0] && val[0]._state) {
        return val.map(v => _makeVal(e, param, sub, v))[0];
    }

    if (val && val._state) {     // instanceof State
        const fn = (name, value) => {
            if (name == val.name) {
                value = val.map({ ...e, name, value });
                _update(e, param, sub ? { [sub]: value } : value);
                if (e.el._onUpdate) e.el._onUpdate();
            }
        }
        (e.el._unsub ??= []).push(val._state.subscribe(fn));
        return val.map({ ...e, name: val.name, value: val._state[val.name] });
    }
    /// #endif

    return val;
}

function _update(e, param, val) {
    if (SKIP_PARAM.has(param)) return;

    param = PARAM_ALIAS[param] ?? param;

    if (param.startsWith('on')) {
        val = { [param.slice(2).toLowerCase()]: val };
        param = 'events';
    } else {
        /// #if !TINY_COMPONENT
        val = _makeVal(e, param, null, val);
        /// #endif
    }

    const fn = PARAM_UPD[param];
    if (val != null && fn) fn(e, val);
    else PARAM_UPD.props(e, { [param]: val });
}