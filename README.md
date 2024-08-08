# Component.js
Библиотека для создания и настройки DOM элементов как JS объектов

> npm i @alexgyver/component

## Дока
### Component
```js
/**
 * Создать компонент и поместить его в переменную $root
 * @param {string} tag html tag элемента
 * @param {object} data параметры
 */
Component(tag, data = {});

/**
 * Создать компонент
 * @param {string} tag html tag элемента
 * @param {object} data параметры
 * @returns {Node}
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
Component.make(tag, data = {});

/**
 * Создать теневой компонент от указанного tag, дети подключатся к нему в shadowRoot
 * @param {string|Node} host html tag теневого элемента или Node
 * @param {object} data параметры внешнего элемента
 * @param {string} sheet css стили
 * @returns {Node} host
 */
Component.makeShadow(host, data = {}, sheet = null);

/**
 * Настроить элемент
 * @param {Node} el элемент
 * @param {object} data параметры
 * @returns {Node}
 */
Component.config(el, data);

/**
 * Создать массив компонентов из массива объектов конфигурации
 * @param {array} arr массив объектов конфигурации
 * @returns {array} of Elements
 */
Component.makeArray(arr);
```

### Sheet
```js
/**
 * Добавить стиль с уникальным id в head. ext - стиль можно будет удалить по id
 * @param {string|array} style стили в виде css строки или [ 'class', ['color: red', 'padding: 0'], ... ]
 * @param {string|this} id уникальный id стиля. При передаче this будет именем класса
 * @param {boolean} ext внешний стиль - может быть удалён по id
 */
Sheet.addStyle(style, id, ext = false);

/**
 * Удалить ext стиль по его id
 * @param {string} id id стиля
 */
Sheet.removeStyle(id);
```

### StyledComponent
```js
/**
 * Создать компонент и поместить его в переменную $root
 * @param {string} tag html tag элемента
 * @param {object} data параметры
 * @param {string|array} style стили в виде css строки или [ 'class', ['color: red', 'padding: 0'], ... ]
 * @param {string|this} id уникальный id стиля. При передаче this будет именем класса
 * @param {boolean} ext внешний стиль - может быть удалён по id
 */
StyledComponent(tag, data = {}, style = null, id = null, ext = false);

/**
 * Создать компонент
 * @param {string} tag html tag элемента
 * @param {object} data параметры
 * @param {string|array} style стили в виде css строки или [ 'class', ['color: red', 'padding: 0'], ... ]
 * @param {string|this} id уникальный id стиля. При передаче this будет именем класса
 * @param {boolean} ext внешний стиль - может быть удалён по id
 */
StyledComponent.make(tag, data = {}, style = null, id = null, ext = false);
```

## Пример
Создаст контейнер с двумя вложенными блоками текста и прикрепит к body
```js
Component.make('div', {
    parent: document.body,
    class: 'my-div',
    style: {
        background: 'red',
    },
    events: {
        click: () => console.log('click'),
    },
    children: [
        {
            tag: 'span',
            text: 'hello',
        },
        {
            tag: 'span',
            text: 'world',
        }
    ]
});
```

Гораздо интереснее использовать в классе и передавать контекст. Параметр `var` создаст переменную с элементом с указанным именем + префикс `$`:
```js
class Button {
    constructor(text) {
        Component.make('button', {
            context: this,
            var: 'button',
            text: text,
            class: 'btn',
            events: {
                click: console.log(this.$button),
            },
        });

        // тут уже существует this.$button
    }
}

let btn = new Button('kek');
btn.$button; // элемент кнопки
```