export class Sheet {
    /**
     * @abstract Добавить стиль с уникальным id в head. ext - стиль можно будет удалить по id
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
        makevar - создаёт переменную $name в указанном контексте
        style - object: { padding: '0px', ... }
        events - object
        children - DOM, Component или параметры как object
   */
    /**
     * @abstract Создать компонент и поместить его в переменную $root
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

        for (const [key, value] of Object.entries(data)) {
            switch (key) {
                case 'context': case 'tag': continue;
                case 'text': $el.textContent = value; break;
                case 'html': $el.innerHTML = value; break;
                case 'class': $el.className = value; break;
                case 'also': if (context) value.call(context, $el); break;
                case 'makevar': if (context) context['$' + value] = $el; break;
                case 'style': for (const [skey, sval] of Object.entries(value)) $el.style[skey] = sval; break;
                case 'events': for (const [ev, handler] of Object.entries(value)) $el.addEventListener(ev, handler.bind(context)); break;
                case 'children':
                    for (const obj of value) {
                        if (obj instanceof Element || obj instanceof HTMLDocument) $el.appendChild(obj);
                        else if (obj instanceof Component) $el.appendChild(obj.$root);
                        else if (typeof obj === 'object') {
                            if (!obj.context) obj.context = context;
                            let comp = Component.make(obj.tag, obj);
                            if (comp) $el.appendChild(comp);
                        }
                    }
                    break;
                default: $el[key] = value; break;
            }
        }
        return $el;
    }
}