export class Component {
    /**
     * Создать компонент и поместить его в переменную $root
     * @param {string} tag html tag элемента
     * @param {object} data параметры
     */
    constructor(tag, data = {}, svg = false) {
        data.context = this;
        this.$root = Component.make(tag, data, svg);
    }

    /**
     * Создать компонент
     * @param {string} tag html tag элемента
     * @param {object} data параметры
     * @returns {Node}
     * @params
     * tag {string} тег html элемента (для указания в children например)
     * context {object} контекст для параметра 'var' и вызовов 'also'
     * text {string} добавить в textContent
     * html {string} добавить в innerHTML
     * attrs {object} добавить аттрибуты
     * props {object} добавить свойства
     * class {string} добавить в className
     * also {function} - вызвать с текущим компонентом: { ... , also(el) { console.log(el); }, }
     * export {array} - положить в 0 ячейку указанного массива
     * var {string} создаёт переменную $имя в указанном контексте
     * events {object} добавляет addEventListener'ы {event: handler}
     * parent - {Element} добавляет компонент к указанному элементу (имеет смысл только для корневого компонента)
     * style {string | object} объект в виде { padding: '0px', ... } или строка css стилей
     * children - массив DOM, Component, object, html string
     * child - DOM, Component, object, html string
     * всё остальное будет добавлено как property
     */
    static make(tag, data = {}, svg = false) {
        if (!tag || typeof data !== 'object') return null;
        if (data instanceof Node) return data;
        return Component.config(svg ? document.createElementNS("http://www.w3.org/2000/svg", tag) : document.createElement(tag), data, svg);
    }

    static makeSVG(tag, data = {}) {
        return Component.make(tag, data, true);
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

        Component.config($host.shadowRoot, {
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
        Component.config($host, data);
        return $host;
    }

    /**
     * Настроить элемент
     * @param {Node} el элемент
     * @param {object} data параметры
     * @param {object} svg SVG
     * @returns {Node}
     */
    static config(el, data, svg = false) {
        if (Array.isArray(el)) {
            el.forEach(e => Component.config(e, data, svg));
            return;
        }
        if (!(el instanceof Node) || (typeof data !== 'object')) return el;

        const context = data.context;
        if ('svg' in data) svg = data.svg;

        let addChild = (obj) => {
            if (!obj) return;
            if (obj instanceof Node) el.appendChild(obj);
            else if (obj instanceof Component) el.appendChild(obj.$root);
            else if (typeof obj === 'object') {
                if (!obj.context) obj.context = context;
                let cmp = Component.make(obj.tag, obj, svg);
                if (cmp) el.appendChild(cmp);
            } else if (typeof obj === 'string') {
                el.innerHTML += obj;
            }
        }

        for (const [key, val] of Object.entries(data)) {
            if (!val) continue;
            switch (key) {
                case 'tag':
                case 'context':
                case 'svg':
                    continue;
                case 'text': el.textContent = val; break;
                case 'html': el.innerHTML = val; break;
                case 'class': el.classList.add(...val.split(' ')); break;
                case 'also': if (context) val.call(context, el); break;
                case 'export': val[0] = el; break;
                case 'var': if (context) context['$' + val] = el; break;
                case 'events': for (let ev in val) if (val[ev]) el.addEventListener(ev, val[ev].bind(context)); break;
                case 'parent': if (val instanceof Node || val instanceof DocumentFragment) val.append(el); break;
                case 'attrs': for (let attr in val) el.setAttribute(attr, val[attr]); break;
                case 'props': for (let prop in val) el[prop] = val[prop]; break;
                case 'child_r': el.replaceChildren();
                case 'child': addChild(val); break;
                case 'children_r': el.replaceChildren();
                case 'children': for (const obj of val) addChild(obj); break;
                case 'style':
                    if (typeof val === 'string') el.style.cssText += (val + ';');
                    else for (let st in val) el.style[st] = val[st];
                    break;
                default: el[key] = val; break;
            }
        }
        return el;
    }

    static configSVG(el, data) {
        return Component.config(el, data, true);
    }

    /**
     * Создать массив компонентов из массива объектов конфигурации
     * @param {array} arr массив объектов конфигурации
     * @returns {array} of Elements
     */
    static makeArray(arr, svg = false) {
        if (!arr || !Array.isArray(arr)) return [];
        return arr.map(x => Component.make(x.tag, x, svg));
    }

    static makeArraySVG(arr) {
        return Component.makeArray(arr, true);
    }
}

export class Sheet {
    /**
     * Добавить стиль с уникальным id в head. ext - стиль можно будет удалить по id
     * @param {string|array} style стили в виде css строки или [ 'class', ['color: red', 'padding: 0'], ... ]
     * @param {string|this} id уникальный id стиля. При передаче this будет именем класса
     * @param {boolean} ext внешний стиль - может быть удалён по id
     */
    static addStyle(style, id, ext = false) {
        if (!style || !id) return;
        if (typeof id === 'object') id = id.constructor.name;

        if (!Sheet.#internal.has(id) && !Sheet.#external.has(id)) {
            if (typeof style === 'object') {
                let str = '';
                let f = 0;
                for (const v of style) {
                    if (f = !f) {
                        str += v;
                    } else {
                        str += '{';
                        for (const rule of v) str += rule + ';';
                        str += '}';
                    }
                }
                style = str;
            }

            if (ext) {
                let sheet = document.createElement('style');
                document.head.appendChild(sheet);
                sheet.sheet.insertRule(style);
                Sheet.#external.set(id, sheet);
            } else {
                if (!Sheet.#sheet) {
                    Sheet.#sheet = document.head.appendChild(document.createElement('style')).sheet;
                }
                Sheet.#sheet.insertRule(style);
                Sheet.#internal.add(id);
            }
        }
    }

    /**
     * Удалить ext стиль по его id
     * @param {string} id id стиля
     */
    static removeStyle(id) {
        if (Sheet.#external.has(id)) {
            Sheet.#external.get(id).remove();
            Sheet.#external.delete(id);
        }
    }

    static #sheet;
    static #internal = new Set();
    static #external = new Map();
}

export class StyledComponent extends Component {
    /**
     * Создать компонент и поместить его в переменную $root
     * @param {string} tag html tag элемента
     * @param {object} data параметры
     * @param {string|array} style стили в виде css строки или [ 'class', ['color: red', 'padding: 0'], ... ]
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
     * @param {string|array} style стили в виде css строки или [ 'class', ['color: red', 'padding: 0'], ... ]
     * @param {string|this} id уникальный id стиля. При передаче this будет именем класса
     * @param {boolean} ext внешний стиль - может быть удалён по id
     */
    static make(tag, data = {}, style = null, id = null, ext = false) {
        Sheet.addStyle(style, id, ext);
        return Component.make(tag, data);
    }
}