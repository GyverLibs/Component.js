import { watchMount, watchResize } from "./utils";

export class EL {
    // Создать элемент и поместить его в переменную $root
    constructor(tag, cfg = {}, svg = false) {
        this.$root = EL.make(tag, { ...cfg, ctx: this }, svg);
    }

    //#region ## make

    // Создать элемент
    static make(tag, cfg = {}, svg = false) {
        tag ??= cfg.tag;

        let el = (tag == 'svg' || svg)
            ? document.createElementNS("http://www.w3.org/2000/svg", tag ?? 'svg')
            : document.createElement(tag ?? 'div');

        EL.update(el, cfg);

        /// #if !TINY_COMPONENT
        for (let k of EL_METHODS) {
            el[k] = (...a) => EL[k](el, ...a);
        }
        if (el._onResize) watchResize(el, el._onResize);
        /// #endif

        return el;
    }

    //#region ## update

    // Обновить элемент
    static update(el, cfg) {
        if (!is.node(el) || !is.obj(cfg)) return el;

        el.ctx = cfg.ctx ?? cfg.context ?? el.ctx;

        /// #if !TINY_COMPONENT
        CALLBACKS.forEach(fn => {
            if (fn in cfg) el['_' + fn] = cfg[fn].bind(el.ctx, { el, ctx: el.ctx });
        });
        /// #endif

        for (let [param, val] of Object.entries(cfg)) _update(el, param, val);

        /// #if !TINY_COMPONENT
        if (el._onUpdate) el._onUpdate();
        /// #endif

        if (cfg.also) cfg.also.call(el.ctx, { el, ctx: el.ctx });

        return el;
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

    // Заменить ребёнка old на нового el, old удалить, у el запустить монтаж с вызовом обработчиков. Вернёт el
    static replace(old, el) {
        if (old) {
            if (old.parentNode) old.parentNode.replaceChild(el, old);
            if (old.ctx) el.ctx = old.ctx;
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

    // Создать теневой элемент от указанного тега/Node host, дети подключатся к нему в shadowRoot, стили запишутся в $style
    static makeShadow(host, cfg = {}, css = '') {
        if (!host || !is.obj(cfg)) return null;

        if (!is.node(host)) host = document.createElement(host);
        host.attachShadow({ mode: 'open' });

        EL.update(host.shadowRoot, {
            ctx: cfg.context ?? cfg.ctx,
            children: [{ tag: 'style', $: 'style', text: css }, cfg.children],
        });
        delete cfg.children;
        return EL.update(host, cfg);
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

    // legacy
    static config = EL.update;
}

//#region ## private

/// #if !TINY_COMPONENT
const EL_METHODS = ['update', 'mount', 'clear', 'remove'];
const CALLBACKS = ['onMount', 'onRender', 'onUpdate', 'onResize', 'onDestroy'];
/// #endif

const SKIP_PARAM = new Set(['tag', 'get', 'also', 'context', 'ctx',
    /// #if !TINY_COMPONENT
    ...CALLBACKS
    /// #endif
]);

const PARAM_ALIAS = {
    child: 'children',
    child_r: 'children_r',
    text: 'textContent',
    html: 'innerHTML',
};

const PARAM_UPD = {
    push(el, val) {
        val.push(el);
    },
    $(el, val) {
        if (el.ctx) el.ctx['$' + val] = el;
    },
    attrs(el, val) {
        _applyP('attrs', el, val, (k, v) => el.setAttribute(k, v), k => el.removeAttribute(k));
    },
    data(el, val) {
        _applyP('data', el, val, (k, v) => el.dataset[k] = v, k => delete el.dataset[k]);
    },
    props(el, val) {
        for (let p in val) {
            let v = _makeVal(el, p, null, val[p]);
            el[p] = (
                (p == 'value' && ['number', 'range'].includes(el.type)) ||
                ['min', 'max', 'step'].includes(p)
            ) ? (Number.isFinite(v) ? v : 0) : (v ?? '');
        }
    },
    animate(el, val) {
        const { duration = 300, easing = 'ease', onEnd = null, ...styles } = val;
        el.style.transition = Object.keys(styles).map(st => `${st} ${duration}ms ${easing}`).join(', ');
        if (onEnd) el.addEventListener('transitionend', (evt) => onEnd.call(el.ctx, Object.assign(evt, { el, ctx: el.ctx })), { once: true });
        requestAnimationFrame(() => PARAM_UPD.style(el, styles));
    },
    events(el, val) {
        for (let ev in val) {
            let h = val[ev];
            let options = {};

            if (is.obj(h)) {
                options = h;
                h = h.handler;
                if (!h) continue;
            }

            const fn = (evt) => h.call(el.ctx, Object.assign(evt, { el, ctx: el.ctx }));
            (el._events ??= []).push({ ev, fn, options });
            el.addEventListener(ev, fn, options);
        }
    },
    events_r(el, val) {
        /// #if !TINY_COMPONENT
        EL.release(el);
        /// #endif
        PARAM_UPD.events(el, val);
    },
    children(el, val) {
        _addChild(el, val);
    },
    children_r(el, val) {
        EL.clear(el);
        _addChild(el, val);
    },
    style(el, val) {
        _applyObj('style', el, val,
            r => el.style.cssText += r + ';',
            (k, v) => {
                if (v && Number.isInteger(v)) v += 'px';
                (k.startsWith('--')) ? el.style.setProperty(k, v) : el.style[k] = v;
            }
        );
    },
    style_r(el, val) {
        el.style.cssText = '';
        PARAM_UPD.style(el, val);
    },
    class(el, val) {
        _applyObj('class', el, val,
            r => r.split(/\s+/).forEach(c => c && el.classList.add(c)),
            (k, v) => v ? el.classList.add(k) : el.classList.remove(k)
        );
    },
    class_r(el, val) {
        el.className = '';
        PARAM_UPD.class(el, val);
    },
    parent(el, val) {
        EL.mount(el, val, false, (el._onMount || el._onRender) ? 100 : 0);
    },
};

function _applyP(param, el, val, set, del) {
    for (let p in val) {
        let v = _makeVal(el, param, p, val[p]);
        (v == null) ? del(p) : set(p, String(v));
    }
}

function _applyObj(param, el, val, raw, add) {
    if (is.str(val)) {
        raw(val);
    } else {
        for (let k in val) {
            if (k == '_raw') PARAM_UPD[param](el, val[k]);
            else add(k, _makeVal(el, param, k, val[k]));
        }
    }
}

function _addChild(el, obj) {
    if (!obj) return;
    else if (is.str(obj)) el.insertAdjacentHTML('beforeend', obj);
    else if (is.arr(obj)) obj.forEach(o => _addChild(el, o));
    else if (is.node(obj)) EL.mount(obj, el);
    else if (obj instanceof EL) EL.mount(obj.$root, el);
    else if (is.obj(obj)) EL.make(null, { ctx: el.ctx, ...obj, parent: el }, el instanceof SVGElement);
}

function _makeVal(el, param, sub, val) {
    /// #if !TINY_COMPONENT
    if (is.func(val)) {
        return val.call(el.ctx, { el, ctx: el.ctx });
    }

    if (is.arr(val) && is.state(val[0])) {
        return val.map(v => _makeVal(el, param, sub, v))[0];
    }

    if (is.state(val)) {
        const fn = (name, value) => {
            if (name == val.name) {
                value = val.map({ el, ctx: el.ctx, name, value });
                _update(el, param, sub ? { [sub]: value } : value);
                if (el._onUpdate) el._onUpdate();
            }
        }
        (el._unsub ??= []).push(val._state.subscribe(fn));
        return val.map({ el, ctx: el.ctx, name: val.name, value: val._state[val.name] });
    }
    /// #endif

    return val;
}

function _update(el, param, val) {
    if (SKIP_PARAM.has(param)) return;

    param = PARAM_ALIAS[param] ?? param;

    if (param.startsWith('on')) {
        val = { [param.slice(2).toLowerCase()]: val };
        param = 'events';
    } else {
        /// #if !TINY_COMPONENT
        val = _makeVal(el, param, null, val);
        /// #endif
    }

    const fn = PARAM_UPD[param];
    if (val != null && fn) fn(el, val);
    else PARAM_UPD.props(el, { [param]: val });
}

const is = {
    func: x => typeof x === 'function',
    str: x => typeof x === 'string',
    arr: x => Array.isArray(x),
    node: x => x instanceof Node,
    obj: x => x !== null && typeof x === 'object',
    state: x => x && x._state,
}