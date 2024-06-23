export class Sheet {
    /**
     * @abstract Добавить стиль с уникальным id в head. ext - стиль можно будет удалить по id
     * @param {string|array} style стили в виде css строки или [ 'class', ['color: red', 'padding: 0'], ... ]
     * @param {string} id уникальный id стиля
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
                if (!Sheet.#sheet) Sheet.#sheet = document.head.appendChild(document.createElement('style')).sheet;
                Sheet.#sheet.insertRule(style);
                Sheet.#internal.add(id);
            }
        }
    }

    /**
     * @abstract Удалить ext стиль по его id
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

export class Component {
    /**
     * @abstract Создать компонент и поместить его в переменную $root
     * @param {string} tag html tag элемента
     * @param {object} data параметры
     * @param {string|array} style стили в виде css строки или [ 'class', ['color: red', 'padding: 0'], ... ]
     * @param {string|this} id уникальный id стиля
     * @param {boolean} ext внешний стиль - может быть удалён по id
     */
    constructor(tag, data = {}, style = null, id = null, ext = false) {
        data.context = this;
        this.$root = Component.make(tag, data, style, id, ext);
    }

    /*
        context - контекст для параметра 'make' и вызовов 'also'
        also - вызвать с текущим компонентом: { ... , also(el) { console.log('123'); }, }
        var - создаёт переменную $name в указанном контексте
        style - string или object: { padding: '0px', ... }
        events - object
        children - массив DOM, Component, object, html string
   */
    /**
     * @abstract Создать компонент
     * @param {string} tag html tag элемента
     * @param {object} data параметры
     * @param {string|array} style стили в виде css строки или [ 'class', ['color: red', 'padding: 0'], ... ]
     * @param {string|this} id уникальный id стиля
     * @param {boolean} ext внешний стиль - может быть удалён по id
     */
    static make(tag, data = {}, style = null, id = null, ext = false) {
        Sheet.addStyle(style, id, ext);
        if (!tag || typeof data !== 'object') return null;

        const context = data.context;
        const $el = document.createElement(tag);

        for (const [key, val] of Object.entries(data)) {
            switch (key) {
                case 'context':
                case 'tag':
                    continue;
                case 'text': $el.textContent = val; break;
                case 'html': $el.innerHTML = val; break;
                case 'class': $el.className = val; break;
                case 'also': if (context) val.call(context, $el); break;
                case 'var': if (context) context['$' + val] = $el; break;
                case 'events': for (const [ev, handler] of Object.entries(val)) $el.addEventListener(ev, handler.bind(context)); break;
                case 'style':
                    if (typeof val === 'string') $el.style = val + ';';
                    else for (const [skey, sval] of Object.entries(val)) $el.style[skey] = sval;
                    break;
                case 'children':
                    for (const obj of val) {
                        if (obj instanceof Node) $el.appendChild(obj);
                        else if (obj instanceof Component) $el.appendChild(obj.$root);
                        else if (typeof obj === 'object') {
                            if (!obj.context) obj.context = context;
                            let cmp = Component.make(obj.tag, obj);
                            if (cmp) $el.appendChild(cmp);
                        } else if (typeof obj === 'string') {
                            $el.innerHTML += obj;
                        }
                    }
                    break;
                default: $el[key] = val; break;
            }
        }
        return $el;
    }
}