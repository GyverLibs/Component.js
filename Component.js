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
     * tag {string} - тег html элемента (для указания в children например)
     * svg {boolean} - создавать как SVG элемент
     * context {object} - контекст для параметра 'var' и вызовов 'also'
     * text {string} - добавить в textContent
     * html {string} - добавить в innerHTML
     * attrs {object} - добавить аттрибуты
     * props {object} - добавить свойства
     * class {string} - добавить в className
     * also {function} - вызвать с текущим компонентом: { ... , also(el) { console.log(el); }, }
     * export {array} - положить в 0 ячейку указанного массива
     * push {array} - добавить к массиву
     * var {string} - создаёт переменную $имя в указанном контексте
     * events {object} - добавляет addEventListener'ы {event: handler}
     * parent - {Element} добавляет компонент к указанному элементу (имеет смысл только для корневого компонента)
     * style {string | object} - объект в виде { padding: '0px', ... } или строка css стилей
     * children/children_r - массив DOM, Component, object, html string. _r - заменить имеющиеся. Без тега tag будет div
     * child/child_r - DOM, Component, object, html string. _r - заменить имеющиеся. Без тега tag будет div
     * onrender - функция вызовется с компонентом когда он отрендерится
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
     * Настроить элемент
     * @param {Node | Array} el элемент или массив элементов
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
                let cmp = Component.make(obj.tag ?? 'div', obj, svg || ('svg' in obj));
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
                case 'text': el.textContent = val + ''; break;
                case 'html': el.innerHTML = val; break;
                case 'class': el.classList.add(...val.split(' ')); break;
                case 'also': if (context) val.call(context, el); break;
                case 'export': val[0] = el; break;
                case 'push': val.push(el); break;
                case 'var': if (context) context['$' + val] = el; break;
                case 'events': for (let ev in val) if (val[ev]) el.addEventListener(ev, val[ev].bind(context)); break;
                case 'parent': if (val) val.appendChild(el); break;
                case 'attrs': for (let attr in val) svg ? el.setAttributeNS(null, attr, val[attr]) : el.setAttribute(attr, val[attr]); break;
                case 'props': for (let prop in val) el[prop] = val[prop]; break;
                case 'child_r': el.replaceChildren();
                case 'child': addChild(val); break;
                case 'children_r': el.replaceChildren();
                case 'children': for (const obj of val) addChild(obj); break;
                case 'onrender': waitRender(el, val); break;
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
}

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

export class StyledComponent extends Component {
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
        return Component.make(tag, data);
    }
}

export async function waitRender(elm, cb = null, ctx = window) {
    return new Promise(res => {
        let e = elm;
        while (e.parentNode) e = e.parentNode;
        if (e instanceof Document) {
            if (cb) cb(elm);
            res(elm);
        }
        const obs = new MutationObserver((mut) => {
            if (mut[0].addedNodes.length === 0) return;
            if (Array.prototype.indexOf.call(mut[0].addedNodes, elm) === -1) return;
            obs.disconnect();
            if (cb) cb(elm);
            res(elm);
        });
        obs.observe(ctx.document.body, { childList: true, subtree: true });
    });
}