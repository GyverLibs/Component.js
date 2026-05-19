export class EL {
    // Создать элемент и поместить его в переменную $root
    constructor(tag, cfg = {}, svg = false) {
        this.$root = EL.make(tag, { ...cfg, ctx: this }, svg);
    }

    //#region ## make

    // Создать элемент
    static make(tag, cfg = {}, svg = false) {
        tag ||= cfg.tag;

        let el = (tag == 'svg' || cfg.svg || svg)
            ? document.createElementNS("http://www.w3.org/2000/svg", tag || 'svg')
            : document.createElement(tag || 'div');

        /// #if !NO_LIFE
        Object.assign(el, EL_METHODS);

        CALLBACKS.forEach(fn => {
            if (fn in cfg) el['_' + fn] = cfg[fn];
        });

        if (el._onResize) {
            const ro = new ResizeObserver(() => _call(el, el._onResize));
            ro.observe(el);
            EL.register(el, () => ro.disconnect());
        }
        /// #endif

        return EL.update(el, cfg);
    }

    //#region ## update

    // Обновить элемент
    static update(el, cfg) {
        if (!is.node(el) || !is.obj(cfg)) return el;

        el.ctx = cfg.ctx ?? cfg.context ?? el.ctx;

        for (let [param, val] of Object.entries(cfg)) _update(el, param, val);

        EL.mount(el, cfg.parent);

        /// #if !NO_LIFE
        _call(el, el._onUpdate);
        /// #endif

        return el;
    }

    //#region ## lifecycle

    // Подключить к родителю, null - отключить
    static mount(el, parent) {
        if (el) {
            if (parent === null) {
                el.parentNode?.removeChild(el);
                /// #if !NO_LIFE
                el._mounted = el._rendered = false;
                /// #endif
            } else if (parent && parent != el.parentNode) {
                parent.appendChild(el);
                /// #if !NO_LIFE
                _watchMount(el);
                /// #endif
            }
        }
    }

    // Удалить всех детей
    static clear(el, recursive = true) {
        if (el) {
            while (el.firstChild) {
                /// #if !NO_LIFE
                if (recursive) EL.clear(el.firstChild, true);
                /// #endif
                EL.remove(el.firstChild, false);
            }
        }
    }

    // Удалить элемент
    static remove(el, recursive = true) {
        if (el) {
            /// #if !NO_LIFE
            if (recursive) EL.clear(el, true);
            _release(el);
            if (el._unsub) {
                for (let f of el._unsub) f && f();
                el._unsub = [];
            }
            if (el._states) {
                Object.values(el._states).forEach(f => f());
                el._states = {};
            }
            _call(el, el._onDestroy);
            CALLBACKS.forEach(fn => el['_' + fn] = null);
            /// #endif

            el.parentNode?.removeChild(el); // remove
        }
    }

    /// #if !NO_LIFE

    // Заменить ребёнка old на нового el, old удалить, у el запустить монтаж с вызовом обработчиков. Вернёт el
    static replace(old, el, keepContext = true) {
        if (old) {
            old.parentNode?.replaceChild(el, old);
            if (el) {
                _watchMount(el);
                if (keepContext) el.ctx = old?.ctx;
            }
            EL.remove(old);
        }
        return el;
    }

    // Добавить функцию отписки или массив функций, будут вызваны при удалении элемента
    static register(el, unsub) {
        if (!el._unsub) el._unsub = [];
        el._unsub.push(...(is.arr(unsub) ? unsub : [unsub]));
    }

    /// #endif
}

//#region ## private

/// #if !NO_LIFE
const EL_METHODS = {};
['update', 'mount', 'clear', 'remove'].forEach(k => {
    EL_METHODS[k] = function (...a) { return EL[k](this, ...a); }
});
const CALLBACKS = ['onMount', 'onRender', 'onUpdate', 'onResize', 'onDestroy'];
/// #endif

const SKIP_PARAM = new Set(['tag', 'get', 'context', 'ctx', 'svg', 'parent',
    /// #if !NO_LIFE
    ...CALLBACKS
    /// #endif
]);

/// #if !NO_LIFE
function _release(el) {
    if (el._events) {
        Object.values(el._events).forEach(({ ev, fn, opts }) => el.removeEventListener(ev, fn, opts));
        el._events = {};
    }
}

function _call(el, fn) {
    return fn ? fn.call(el.ctx, { el, ctx: el.ctx }) : null;
}

function _watchMount(el, tries = 50) {
    const check = () => {
        if (el.isConnected) {
            if (!el._mounted) {
                el._mounted = true;
                _call(el, el._onMount);
            }

            if (el.clientWidth || el.clientHeight) {
                if (!el._rendered) {
                    el._rendered = true;
                    _call(el, el._onRender);
                }
                return;
            }
        }
        if (tries--) requestAnimationFrame(check);
    }
    if (el._onMount || el._onRender) check();
}
/// #endif

const PARAM_ALIAS = {
    children: 'child',
    children_r: 'child_r',
    text: 'textContent',
    html: 'innerHTML',
};

const PARAM_UPD = {
    /// #if !NO_LIFE
    register(el, val) {
        EL.register(el, val);
    },
    /// #endif
    $(el, val) {
        if (el.ctx) el.ctx['$' + val] = el;
    },
    push(el, val) {
        val.push(el);
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
                ['min', 'max', 'step', 'selectedIndex'].includes(p)
                || (p == 'value' && ['number', 'range'].includes(el.type)))
                ? ((v == null || v === '' || Number.isNaN(v)) ? '' : +v)
                : (v ?? '');
        }
    },
    transition(el, val) {
        const { duration = 300, easing = 'ease', delay = 0, onEnd = null, ...styles } = val;
        el.style.transition = Object.keys(styles).map(st => `${st} ${duration}ms ${easing} ${delay}ms`).join(', ');
        if (onEnd) {
            PARAM_UPD.events(el, { transitionend: { handler: onEnd, once: true } });
        }
        requestAnimationFrame(() => PARAM_UPD.style(el, styles));
    },
    events(el, val) {
        for (let ev in val) {
            let h = val[ev];
            let opts = {};

            if (is.obj(h)) {
                opts = h;
                h = h.handler;
                if (!h) continue;
            }

            const fn = (evt) => h.call(el.ctx, Object.assign(evt, { el, ctx: el.ctx }));
            /// #if !NO_LIFE
            if (!opts.once) {
                const old = (el._events ??= {})[ev];
                if (old) el.removeEventListener(ev, old.fn, old.opts);
                el._events[ev] = { ev, fn, opts };
            }
            /// #endif
            el.addEventListener(ev, fn, opts);
        }
    },
    events_r(el, val) {
        /// #if !NO_LIFE
        _release(el);
        /// #endif
        PARAM_UPD.events(el, val);
    },
    child(el, val) {
        _addChild(el, val);
    },
    child_r(el, val) {
        EL.clear(el);
        PARAM_UPD.child(el, val);
    },
    style(el, val) {
        _applyObj('style', el, val,
            r => el.style.cssText += r + ';',
            (k, v) => {
                k.startsWith('--') ? el.style.setProperty(k, v) : el.style[k] = v;
            }
        );
    },
    style_r(el, val) {
        el.style.cssText = '';
        PARAM_UPD.style(el, val);
    },
    class(el, val) {
        if (is.arr(val)) val = Object.fromEntries(val.filter(Boolean).map(c => [c, true]));
        _applyObj('class', el, val,
            r => r.split(/\s+/).forEach(c => c && el.classList.add(c)),
            (k, v) => v ? el.classList.add(k) : el.classList.remove(k)
        );
    },
    class_r(el, val) {
        el.classList.value = '';
        PARAM_UPD.class(el, val);
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
            if (k == '_raw') raw(val[k]);
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
    /// #if !NO_STATE
    if (is.func(val)) {
        return _call(el, val);
    }

    if (is.arr(val) && is.state(val[0])) {
        return val.map(v => _makeVal(el, param, sub, v))[0];
    }

    if (is.state(val)) {
        const fn = (name, value) => {
            value = val.map({ el, ctx: el.ctx, name, value });
            _update(el, param, sub ? { [sub]: value } : value);
            _call(el, el._onUpdate);
        }
        const key = `${param}.${sub}.${val.name}`;
        let old = (el._states ??= {})[key];
        if (old) old();
        el._states[key] = val._state.subscribe(val.name, fn);
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
        /// #if !NO_STATE
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
    obj: x => x !== null && typeof x === 'object' && !(x instanceof Node),
    state: x => x?._state,
}