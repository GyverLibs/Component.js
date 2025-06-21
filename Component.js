//#region EL
export class EL {
    static ctx;

    /**
     * Создать компонент и поместить его в переменную $root
     * @param {string} tag html tag элемента
     * @param {object} data параметры
     * @param {Boolean} svg SVG
     */
    constructor(tag, data = {}, svg = false) {
        EL.ctx = this;
        this.$root = EL.make(tag, data, svg);
    }

    /**
     * Создать компонент
     * @param {string} tag html tag элемента
     * @param {object} data параметры
     * @param {Boolean} svg SVG
     * @returns {Node}
     * @params
     * tag {string} - тег html элемента. Если 'svg' - включится режим SVG на детей
     * context {object} - контекст для параметра 'var' и вызовов, прокидывается в детей. Если указан явно как null - прерывает проброс
     * parent - {Element} добавляет компонент к указанному элементу
     * text {string} - добавить в textContent
     * html {string} - добавить в innerHTML
     * class {string | Array} - добавить в className
     * style {string | object} - объект в виде { padding: '0px', ... } или строка css стилей
     * push {array} - добавить к указанному массиву
     * var | $ {string} - создаёт переменную $имя в указанном контексте
     * events {object} - добавляет addEventListener'ы {event: e => {}}
     * children/children_r - массив {DOM, EL, object, html string}. _r - заменить имеющиеся. Без тега tag будет div
     * child/child_r - {DOM, EL, object, html string}. _r - заменить имеющиеся. Без тега tag будет div
     * attrs {object} - добавить аттрибуты (через setAttribute)
     * props {object} - добавить свойства (как el[prop])
     * also {function} - вызвать с текущим компонентом: also(el) { console.log(el); }
     * всё остальное будет добавлено как property
     */
    static make(tag, data = {}, svg = false) {
        if (!tag || typeof data !== 'object') return null;
        if (data instanceof Node) return data;
        if (tag == 'svg') svg = true;
        return EL.config(svg ? document.createElementNS("http://www.w3.org/2000/svg", tag) : document.createElement(tag), data, svg);
    }

    /**
     * Настроить элемент
     * @param {Node | Array} el элемент или массив элементов
     * @param {object} data параметры
     * @param {Boolean} svg SVG
     * @returns {Node}
     */
    static config(el, data, svg = false) {
        if (Array.isArray(el)) {
            el.forEach(e => EL.config(e, data, svg));
            return null;
        }
        if (!(el instanceof Node) || (typeof data !== 'object')) return el;

        let ctx = data.context;
        EL.ctx = (ctx === null) ? null : (ctx ? ctx : EL.ctx);
        ctx = EL.ctx;

        let addChild = (obj) => {
            if (!obj) return;
            if (obj instanceof Node) el.appendChild(obj);
            else if (obj instanceof EL) el.appendChild(obj.$root);
            else if (typeof obj === 'string') el.innerHTML += obj;
            else if (typeof obj === 'object') {
                let cmp = EL.make(obj.tag ?? 'div', obj, svg || obj.tag == 'svg');
                if (cmp) el.appendChild(cmp);
            }
        }

        for (const [key, val] of Object.entries(data)) {
            switch (key) {
                case 'text': el.textContent = (val == null) ? '' : (val + ''); continue;
                case 'html': el.innerHTML = (val == null) ? '' : (val + ''); continue;
                case 'tag':
                case 'context':
                case 'get':
                case 'also':
                    continue;
            }
            if (!val) continue;
            switch (key) {
                case 'class': (Array.isArray(val) ? val : val.split(' ')).map(c => c && el.classList.add(c)); break;
                case 'push': val.push(el); break;
                case '$': case 'var': if (ctx) ctx['$' + val] = el; break;
                case 'events': for (let ev in val) el.addEventListener(ev, val[ev].bind(ctx)); break;
                case 'parent': val.appendChild(el); break;
                case 'attrs': for (let attr in val) el.setAttribute(attr, val[attr]); break;
                case 'props': for (let prop in val) el[prop] = val[prop]; break;
                case 'child_r': EL.clear(el); // fall
                case 'child': addChild(val); break;
                case 'children_r': EL.clear(el); // fall
                case 'children': for (let obj of val) addChild(obj); break;
                case 'style':
                    if (typeof val === 'string') el.style.cssText += val + ';';
                    else for (let st in val) if (val[st]) el.style[st] = val[st];
                    break;
                default: el[key] = val; break;
            }
        }
        if (data.also && ctx) data.also.call(ctx, el);
        return el;
    }

    /**
     * Удалить все child ноды
     * @param {HTMLElement} el 
     */
    static clear(el) {
        while (el.firstChild) el.removeChild(el.lastChild);
    }

    /**
     * Создать массив компонентов из массива объектов конфигурации
     * @param {array} arr массив объектов конфигурации
     * @param {Boolean} svg SVG
     * @returns {array} of Elements
     */
    static makeArray(arr, svg = false) {
        if (!arr || !Array.isArray(arr)) return [];
        return arr.map(x => EL.make(x.tag, x, svg));
    }

    /**
     * Создать теневой компонент от указанного tag, дети подключатся к нему в shadowRoot
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
}

// legacy
export const Component = EL;

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
     * Создать компонент и поместить его в переменную $root
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
     * Создать компонент
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