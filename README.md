# Component.js
Библиотека для создания и настройки DOM/SVG элементов как JS объектов

> npm i @alexgyver/component

## Дока
### EL
Параметры для конфига `data`:

- `context` [объект] - привязывает контекст для других параметров (см ниже), пробрасывается в детей и не сбрасывается между вызовами make/config
- `$` [текст] - добавляет созданный элемент в context с именем `$значение`
- `events` [объект] - подключает события `{ eventName: handlerFunc(event, element, context) }`, в this тоже прокидывается context
- `click`, `change`, `input`, `mousewheel` [функция] - подключает эти события как `handlerFunc(event, element, context)`, в this тоже прокидывается context
- `also` [функция] - вызывает указанную функцию вида `handlerFunc(element, context)`, в this тоже прокидывается context
- `text` [текст] - добавится в textContent, nullish значения - очистить
- `html` [текст] - добавится в innerHTML, nullish значения - очистить
- `tag` [текст] - HTML тег для child-объектов
- `push` [массив] - добавляет созданный элемент в указанный массив
- `parent` [Node] - добавит к нему созданный элемент как child
- `attrs` [объект] - аттрибуты будут установлены через setAttribute
- `props` [объект] - свойства будут установлены как el[prop] = val
- `data` [объект] - датасеты будут добавлены как аттрибуты data-name = value
- `child`, `child_r` [объект] конфиг, добавится как ребёнок к созданному элементу. Без указания tag будет добавлен div. `_r` - заменить ребёнка
- `children`, `children_r` [массив] объектов конфига, добавятся как дети к созданному элементу. Без указания tag будет добавлен div. `_r` - заменить всех детей на новых
- `animate` [объект] - добавить CSS анимаций, может содержать параметры анимации `duration` и `easing`, обработчик окончания анимации `onEnd(element, context)`, в this тоже прокидывается context
- `style`, `style_r` - стили. Принимает:
  - [Строка] CSS стилей
  - [Объект] вида `{styleName: value}`
- `class`, `class_r` - установка классов в classList, версия с `_r` - заменить классы. Принимает:
  - [Строку] вида `newClass active foo bar`
  - [Массив] вида `['newClass', 'active']`, причём можно по условию: `['newClass', isActive && 'active']`
  - [Объект] вида `{newClass: true, active: false}` - true значение добавляет класс, false не добавляет
- `onUpdate` [функция] вида `handlerFunc(element, context)`, вызовется при настройке через функцию config, в this тоже прокидывается context
- `onMount` [функция] вида `handlerFunc(element, context)`, вызовется при присоединении к DOM, в this тоже прокидывается context
- `onDestroy` [функция] вида `handlerFunc(element, context)`, вызовется при удалении через EL.remove(el) или EL.clear(el), в this тоже прокидывается context
- Другие значения будут добавлены как свойства

#### Класс
```js
/**
 * Создать компонент и поместить его в переменную this.$root
 * @param {string} tag html tag элемента
 * @param {object} data параметры
 */
EL(tag, data = {}, svg = false);

// аналоги с авто-this контекстом для вызова внутри класса
make(tag, data = {}, svg = false);
makeArray(arr, svg = false);
config(el, data, svg = false);
makeShadow(host, data = {}, sheet = null);
```

#### Static
```js
/**
 * Создать компонент
 * @param {string} tag html tag элемента
 * @param {object} data параметры
 * @returns {Node}
 */
EL.make(tag, data = {});
EL.makeIn(ctx, tag, data = {}, svg = false);

/**
 * Настроить элемент
 * @param {Node | Array} el элемент или массив элементов
 * @param {object} data параметры
 * @returns {Node}
 */
EL.config(el, data);
EL.configIn(ctx, el, data, svg = false);

/**
 * Создать массив компонентов из массива объектов конфигурации
 * @param {array} arr массив объектов конфигурации
 * @returns {array} of Elements
 */
EL.makeArray(arr);
EL.makeArrayIn(ctx, arr, svg);

/**
 * Создать теневой компонент от указанного tag, дети подключатся к нему в shadowRoot
 * @param {string|Node} host html tag теневого элемента или Node
 * @param {object} data параметры внешнего элемента
 * @param {string} sheet css стили
 * @returns {Node} host
 */
EL.makeShadow(host, data = {}, sheet = null);
EL.makeShadowIn(ctx, host, data = {}, sheet = null);

/**
 * Удалить все child ноды
 * @param {HTMLElement} el 
 */
EL.clear(el, recursive = true);

/**
 * Удалить элемент
 * @param {HTMLElement} el 
 */
EL.remove(el, recursive = true);
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

## Примеры
Создаст контейнер с двумя вложенными блоками текста и прикрепит к body

```js
EL.make('div', {
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

Простой элемент с текстом и классами

```js
const box = new EL('div', {
    text: 'Привет, мир!',
    class: ['box', 'highlight'],
    style: { padding: '10px', color: 'white', backgroundColor: 'blue' },
    click() { console.log('Box кликнут!'); },
    $: 'myBox'  // создаёт ctx.$myBox
});

document.body.appendChild(box.$root);
console.log(box.$root);         // сам DOM-элемент
console.log(EL.context.$myBox); // доступ через контекст
```

Полная замена классов и стилей

```js
EL.config(someElement, {
    text: 'Обновлённый блок',
    class_r: ['newClass', 'active'], // полностью заменяет классы
    style_r: { color: 'red', fontWeight: 'bold' } // сброс и новые стили
});
```

Вложенные дети и массив children

```cpp
EL.make('div', {
    parent: document.body,
    class: 'parent',
    children: [
        { tag: 'p', text: 'Первый ребёнок', class: 'child' },
        { tag: 'p', text: 'Второй ребёнок', class: ['child', 'second'] },
        'Просто текстовый узел'
    ]
});
```

Гораздо интереснее использовать в классе и передавать контекст. Параметр `$` создаст переменную с элементом с указанным именем + префикс `$`:

```js
class Button {
    constructor(text) {
        EL.make('button', {
            context: this,
            $: 'button',
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

Использование контекста для $ и событий

```js
class MyComponent extends EL {
    constructor() {
        super('div', {
            class: 'comp',
            $: 'root',
            children: [
                { tag: 'button', text: 'Нажми меня', click() { console.log(this.$root); } }
            ]
        });
    }
}

const comp = new MyComponent();
document.body.appendChild(comp.$root);
```

Некоторые трюки

```js
EL.make('div', {
    context: this,
    children: [
        {},   // валидно
        null, // валидно
        {
            // без тега - div
        },
        EL.make(...), // контекст будет проброшен сюда автоматически
        foo && {...}, // добавить компонент если foo - true
        {
            tag: 'svg', // автоматически запустится режим SVG
            children: [
                // и будет проброшен сюда
                SVG.circle(10, 10, 5),
                {
                    tag: 'line',
                    attrs: {}
                },
            ],
        },
    ],
    class: ['some', 'class', foo && 'plus_me'], // добавить plus_me если foo - true
});
```


Создание SVG

```js
const svg = SVG.svg({ width: 200, height: 200 }, {
    children: [
        SVG.rect(10, 10, 50, 50, 5, 5, { fill: 'green' }),
        SVG.circle(100, 100, 40, { fill: 'red' }),
        SVG.line(0, 0, 200, 200, { stroke: 'blue', 'stroke-width': 2 })
    ]
});
```

Shadow DOM со стилями

```js
const shadowHost = EL.makeShadow('div', {
    child: { tag: 'p', text: 'Текст внутри Shadow DOM', class: 'shadow-text' }
}, `
    .shadow-text { color: purple; font-weight: bold; }
`);

document.body.appendChild(shadowHost);
```


Прочее

```js
const state = new State({ count: 0 });

let d = EL.make('div', {
    text: state.get('count'),
    also: el => state.subscribe(d => el.textContent = d.count),
    style: { width: '100px', height: '50px', background: 'red' },
    animate: { width: '200px', background: 'blue', duration: 500 },
    onUpdate: el => console.log('update'),
    onMount: el => console.log('mount'),
});

setInterval(() => state.set('count', state.get('count') + 1), 1000);
setTimeout(() => { document.body.appendChild(d) }, 2000);
```