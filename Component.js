//#region EL
export class EL {
    static context;

    /**
     * Создать элемент и поместить его в переменную $root
     * @param {string} tag html tag элемента
     * @param {object} data параметры
     * @param {Boolean} svg SVG
     */
    constructor(tag, data = {}, svg = false) {
        this.$root = EL.makeIn(this, tag, data, svg);
    }
    make(tag, data = {}, svg = false) {
        return EL.makeIn(this, tag, data, svg);
    }
    makeArray(arr, svg = false) {
        return EL.makeArrayIn(this, arr, svg);
    }
    config(el, data, svg = false) {
        return EL.configIn(this, el, data, svg);
    }
    makeShadow(host, data = {}, sheet = null) {
        return EL.makeShadowIn(this, host, data, sheet);
    }

    /**
     * Создать элемент
     * @param {string} tag html tag элемента
     * @param {object} data параметры
     * @param {Boolean} svg SVG
     * @returns {Node}
     */
    static make(tag, data = {}, svg = false) {
        if (data instanceof Node) return data;
        if (tag == 'svg') svg = true;
        return EL.config(svg ? document.createElementNS("http://www.w3.org/2000/svg", tag ?? 'svg') : document.createElement(tag ?? 'div'), data, svg);
    }
    static makeIn(ctx, tag, data = {}, svg = false) {
        return EL.make(tag, { ...data, context: ctx }, svg);
    }

    /**
     * Настроить элемент
     * @param {Node | Array} el элемент или массив элементов
     * @param {object} data параметры
     * @param {Boolean} svg SVG
     * @returns {Node | Array}
     */
    static config(el, data, svg = false) {
        if (!(el instanceof Node) || (typeof data !== 'object')) {
            return el;
        }
        if (Array.isArray(el)) {
            return el.map(e => EL.config(e, data, svg));
        }

        const ctx = ('context' in data) ? (EL.context = data.context) : EL.context;

        const addChild = obj => {
            if (obj) {
                if (obj instanceof Node) el.appendChild(obj);
                else if (obj instanceof EL) el.appendChild(obj.$root);
                else if (typeof obj === 'string') el.insertAdjacentHTML('beforeend', obj);
                else if (typeof obj === 'object') EL.make(obj.tag, { ...obj, parent: el }, (svg || obj.tag == 'svg'));
            }
        }

        const call = fn => { if (fn) fn.call(ctx, el, ctx) }

        for (const [key, val] of Object.entries(data)) {
            switch (key) {
                case 'text':
                    el.textContent = (val == null) ? '' : String(val);  // == - null + undef
                    continue;

                case 'html':
                    el.innerHTML = (val == null) ? '' : String(val);
                    continue;

                case 'tag':
                case 'get':
                case 'also':
                case 'parent':
                case 'context':
                case 'onMount':
                case 'onUpdate':
                case 'onDestroy':
                    continue;
            }

            if (val === undefined || val === null) continue;

            switch (key) {
                case 'push':
                    val.push(el);
                    break;

                case '$':
                case 'var':
                    if (ctx) ctx['$' + val] = el;
                    break;

                case 'events':
                    for (let ev in val) el.addEventListener(ev, e => val[ev].call(ctx, e, el, ctx));
                    break;

                case 'click':
                case 'input':
                case 'change':
                case 'mousewheel':
                    el.addEventListener(key, e => val.call(ctx, e, el, ctx));
                    break;

                case 'attrs':
                    for (let attr in val) el.setAttribute(attr, val[attr]);
                    break;

                case 'props':
                    for (let prop in val) el[prop] = val[prop];
                    break;

                case 'data':
                    for (let key in val) el.dataset[key] = val[key];
                    break;

                case 'child_r':
                    EL.clear(el);
                // fall
                case 'child':
                    addChild(val);
                    break;

                case 'children_r':
                    EL.clear(el);
                // fall
                case 'children':
                    for (let obj of val) addChild(obj);
                    break;

                case 'style_r':
                    el.style.cssText = '';
                // fall
                case 'style':
                    if (typeof val === 'string') {
                        el.style.cssText += val + ';';
                    } else {
                        for (let st in val) if (val[st]) el.style[st] = val[st];
                    }
                    break;

                case 'class_r':
                    el.className = '';
                // fall
                case 'class': {
                    const getClasses = (cls) => {
                        if (Array.isArray(cls)) return Object.fromEntries(cls.filter(Boolean).map(c => [c, true]));
                        if (typeof cls === 'string') return getClasses(cls.split(/\s+/));
                        return cls;
                    }
                    for (const [cls, state] of Object.entries(getClasses(val))) {
                        state ? el.classList.add(cls) : el.classList.remove(cls);
                    }
                } break;

                case 'animate': {
                    const { duration = 300, easing = 'ease', onEnd = null, ...styles } = val;
                    el.style.transition = Object.keys(styles).map(st => `${st} ${duration}ms ${easing}`).join(', ');
                    requestAnimationFrame(() => { for (let st in styles) el.style[st] = styles[st]; });

                    const onEndHandler = () => {
                        el.removeEventListener('transitionend', onEndHandler);
                        call(onEnd);
                    };
                    el.addEventListener('transitionend', onEndHandler);
                } break;

                default: el[key] = val;
                    break;
            }
        }

        if (data.parent) data.parent.appendChild(el);

        let tries = 50;
        const mount = () => {
            if (!el._mounted) {
                if (el.isConnected) {
                    el._mounted = true;
                    call(data.onMount);
                } else if (--tries) {
                    requestAnimationFrame(mount);
                }
            }
        }
        mount();

        if (data.onDestroy) el._onDestroy = data.onDestroy.bind(ctx, el, ctx);
        if (data.onUpdate) el._onUpdate = data.onUpdate.bind(ctx, el, ctx);
        if (el._onUpdate) el._onUpdate();
        call(data.also);

        return el;
    }
    static configIn(ctx, el, data, svg = false) {
        return EL.config(el, { ...data, context: ctx }, svg);
    }

    /**
     * Удалить все child ноды
     * @param {HTMLElement} el 
     */
    static clear(el, recursive = true) {
        while (el.firstChild) {
            if (recursive) EL.clear(el.firstChild, true);
            EL.remove(el.firstChild, false);
        }
    }

    /**
     * Удалить элемент
     * @param {HTMLElement} el 
     */
    static remove(el, recursive = true) {
        if (recursive) EL.clear(el);
        if (el._onDestroy) el._onDestroy();
        el.remove();
    }

    /**
     * Создать массив элементов из массива объектов конфигурации
     * @param {array} arr массив объектов конфигурации
     * @param {Boolean} svg SVG
     * @returns {array} of Elements
     */
    static makeArray(arr, svg = false) {
        if (!arr || !Array.isArray(arr)) return [];
        return arr.map(data => EL.make(data.tag, data, svg));
    }
    static makeArrayIn(ctx, arr, svg) {
        return EL.makeArray(arr.map(data => ({ ...data, context: ctx })), svg);
    }

    /**
     * Создать теневой элемент от указанного tag, дети подключатся к нему в shadowRoot
     * @param {string|Node} host html tag теневого элемента или Node
     * @param {object} data параметры внешнего элемента
     * @param {string} sheet css стили
     * @returns {Node} host
     */
    static makeShadow(host, data = {}, sheet = null) {
        if (!host || typeof data !== 'object') return null;

        let $host = (host instanceof Node) ? host : document.createElement(host);
        $host.attachShadow({ mode: 'open' });

        EL.config($host.shadowRoot, {
            context: data.context,
            children: [
                {
                    tag: 'style',
                    textContent: sheet ?? '',
                },
                data.child ?? {},
                ...(data.children ?? []),
            ]
        });
        delete data.children;
        delete data.child;
        EL.config($host, data);
        return $host;
    }
    static makeShadowIn(ctx, host, data = {}, sheet = null) {
        return EL.makeShadow(host, { ...data, context: ctx }, sheet);
    }
}

// legacy
export const Component = EL;

//#region State
export class State {
    constructor(init = {}) {
        this.data = init;
        this.subs = new Set();
    }
    set(key, value) {
        this.data[key] = value;
        this.subs.forEach(fn => fn(this.data));
    }
    get(key) {
        return this.data[key];
    }
    subscribe(fn) {
        this.subs.add(fn);
        return () => this.subs.delete(fn);
    }
}

//#region SVG
export class SVG {
    static make = (tag, data) => EL.make(tag, data, true);
    static config = (el, data) => EL.config(el, data, true);
    static makeArray = (arr) => EL.makeArray(arr, true);

    static svg = (attrs = {}, props = {}) => SVG._make('svg', attrs, props);
    static rect = (x, y, w, h, rx, ry, attrs = {}, props = {}) => SVG._make('rect', { ...attrs, x: x, y: y, width: w, height: h, rx: rx, ry: ry }, props);
    static circle = (x, y, r, attrs = {}, props = {}) => SVG._make('circle', { ...attrs, cx: x, cy: y, r: r }, props);
    static line = (x1, y1, x2, y2, attrs = {}, props = {}) => SVG._make('line', { ...attrs, x1: x1, y1: y1, x2: x2, y2: y2 }, props);
    static polyline = (points, attrs = {}, props = {}) => SVG._make('polyline', { ...attrs, points: points }, props);
    static polygon = (points, attrs = {}, props = {}) => SVG._make('polygon', { ...attrs, points: points }, props);
    static path = (d, attrs = {}, props = {}) => SVG._make('path', { ...attrs, d: d }, props);
    static text = (text, x, y, attrs = {}, props = {}) => SVG._make('text', { ...attrs, x: x, y: y }, { ...props, text: text });

    static _make = (tag, attrs = {}, props = {}) => SVG.make(tag, { attrs: { ...attrs }, ...props });
}

//#region Sheet
export class Sheet {
    /**
     * Добавить стиль с уникальным id в head. ext - стиль можно будет удалить по id
     * @param {string|array} style стили в виде css строки
     * @param {string|this} id уникальный id стиля. При передаче this будет именем класса
     * @param {boolean} ext внешний стиль - может быть удалён по id
     */
    static addStyle(style, id, ext = false) {
        if (!style || !id) return;
        if (typeof id === 'object') id = id.constructor.name;

        if (!Sheet.#int.has(id) && !Sheet.#ext.has(id)) {
            if (ext) {
                let sheet = document.createElement('style');
                document.head.appendChild(sheet);
                sheet.textContent = style;
                Sheet.#ext.set(id, sheet);
            } else {
                if (!Sheet.#sheet) Sheet.#sheet = document.head.appendChild(document.createElement('style'));
                Sheet.#sheet.textContent += style + '\r\n';
                Sheet.#int.add(id);
            }
        }
    }

    /**
     * Удалить ext стиль по его id
     * @param {string} id id стиля. При передаче this будет именем класса
     */
    static removeStyle(id) {
        if (typeof id === 'object') id = id.constructor.name;
        if (Sheet.#ext.has(id)) {
            Sheet.#ext.get(id).remove();
            Sheet.#ext.delete(id);
        }
    }

    static #sheet = null;
    static #int = new Set();
    static #ext = new Map();
}

//#region StyledComponent
export class StyledComponent extends EL {
    /**
     * Создать элемент и поместить его в переменную $root
     * @param {string} tag html tag элемента
     * @param {object} data параметры
     * @param {string|array} style стили в виде css строки
     * @param {string|this} id уникальный id стиля. При передаче this будет именем класса
     * @param {boolean} ext внешний стиль - может быть удалён по id
     */
    constructor(tag, data = {}, style = null, id = null, ext = false) {
        super(tag, data);
        Sheet.addStyle(style, id, ext);
    }

    /**
     * Создать элемент
     * @param {string} tag html tag элемента
     * @param {object} data параметры
     * @param {string|array} style стили в виде css строки
     * @param {string|this} id уникальный id стиля. При передаче this будет именем класса
     * @param {boolean} ext внешний стиль - может быть удалён по id
     */
    static make(tag, data = {}, style = null, id = null, ext = false) {
        Sheet.addStyle(style, id, ext);
        return EL.make(tag, data);
    }
}