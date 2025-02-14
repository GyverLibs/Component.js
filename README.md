# Component.js
Библиотека для создания и настройки DOM/SVG элементов как JS объектов

> npm i @alexgyver/component

## Дока
### Component
```js
/**
 * Создать компонент и поместить его в переменную $root
 * @param {string} tag html tag элемента
 * @param {object} data параметры
 */
Component(tag, data = {}, svg = false);

/**
 * Создать компонент
 * @param {string} tag html tag элемента
 * @param {object} data параметры
 * @returns {Node}
 * tag {string} - тег html элемента. Если 'svg' - включится режим SVG на детей
 * context {object} - контекст для параметра 'var' и вызовов, прокидывается в детей. Если указан явно как null - прерывает проброс
 * parent - {Element} добавляет компонент к указанному элементу
 * text {string} - добавить в textContent
 * html {string} - добавить в innerHTML
 * class {string | Array} - добавить в className
 * style {string | object} - объект в виде { padding: '0px', ... } или строка css стилей
 * push {array} - добавить к указанному массиву
 * var {string} - создаёт переменную $имя в указанном контексте
 * events {object} - добавляет addEventListener'ы {event: e => {}}
 * children/children_r - массив {DOM, Component, object, html string}. _r - заменить имеющиеся. Без тега tag будет div
 * child/child_r - {DOM, Component, object, html string}. _r - заменить имеющиеся. Без тега tag будет div
 * attrs {object} - добавить аттрибуты (через setAttribute)
 * props {object} - добавить свойства (как el[prop])
 * also {function} - вызвать с текущим компонентом: also(el) { console.log(el); }
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
 * @param {Node | Array} el элемент или массив элементов
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

### SVG
```js
SVG.make(tag, data);
SVG.config(el, data);
SVG.makeArray(arr);
SVG.svg(attrs = {}, props = {});

SVG.rect(x, y, w, h, rx, ry, attrs = {}, props = {});
SVG.circle(x, y, r, attrs = {}, props = {});
SVG.line(x1, y1, x2, y2, attrs = {}, props = {});
SVG.polyline(points, attrs = {}, props = {});
SVG.polygon(points, attrs = {}, props = {});
SVG.path(d, attrs = {}, props = {});
SVG.text(text, x, y, attrs = {}, props = {});
```

### Sheet
```js
/**
 * Добавить стиль с уникальным id в head. ext - стиль можно будет удалить по id
 * @param {string|array} style стили в виде css
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
 * @param {string|array} style стили в виде css строки
 * @param {string|this} id уникальный id стиля. При передаче this будет именем класса
 * @param {boolean} ext внешний стиль - может быть удалён по id
 */
StyledComponent(tag, data = {}, style = null, id = null, ext = false);

/**
 * Создать компонент
 * @param {string} tag html tag элемента
 * @param {object} data параметры
 * @param {string|array} style стили в виде css строки
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