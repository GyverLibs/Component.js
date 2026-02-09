import { EL } from "./EL";

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