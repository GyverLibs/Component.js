# Component.js
Реактивный микро-фреймворк для создания и обновления HTML элементов как JS объектов

- Ванильный JS, прямая работа из браузера без компиляции, поддержка рантайм eval-плагинов
- 2.5 кБ gzip на все фичи против 6 кБ Preact (минимальный идентичный пример), возможна компиляция в тини-версию 1.8 кБ
- Установка и удаление свойств, атрибутов, датасетов, классов, стилей, анимаций, обработчиков событий
- Обновление параметров
- Поддержка Shadow DOM
- Нормализация текстовых и численных полей
- Поддержка реактивного State
- Жизненный цикл: коллбэки на монтирование, рендер, обновление и удаление элемента
- Автоотключение обработчиков и биндов при удалении элемента
- Поддержка SVG элементов + набор готовых инструментов
- Создание шаблонов компонентов

> npm i @alexgyver/component
> https://gyverlibs.github.io/Component.js/Component.min.js
> https://gyverlibs.github.io/Component.js/Component.tiny.min.js

## EL
Билдер элементов.

### Конфиг
Параметры для конфига `cfg`, с которым вызывается `make`/`update`:

- **text** `< Строка|Функция|State >` - заменить textContent
- **html** `< Строка|Функция|State >` - заменить innerHTML
- **parent** `< Node >` - монтировать созданный элемент в указанный
- **children** `< Объект конфиг|Массив объектов >` создать детей и добавить к элементу. Без указания tag будет добавлен div
- **children_r** - заменить детей
- **tag** `< Строка >` - HTML тег для children-объектов
- **props** `< Объект вида {name: Any|Функция|State} >` - добавить свойства как el[name] = val
- **attrs** `< Объект вида {name: Any|Функция|State} >` - добавить аттрибуты как `setAttribute(name, val)`. `null` - удалить аттрибут
- **data** `< Объект вида {name: Any|Функция|State} >` - добавить датасеты как `data-name = val`. `null` - удалить датасет
- **style** - добавить стили в style. Принимает:
  - `< Строка|Функция|State >` CSS стили вида `color: red; padding: 0`
  - `< Объект вида {styleName: Строка|Функция|State} >`. При `styleName` равном `_raw` прибавляет стили в виде строки
- **style_r** - заменить все стили
- **class** - добавить классы в classList. Принимает:
  - `< Строка|Функция|State >` вида `newClass active foo bar`
  - `< Объект вида {className: Bool|Функция|State} >`, например `{newClass: true, active: isActive}` - true значение добавляет класс, false убирает. При `className` равном `_raw` прибавляет классы в виде строки
- **class_r** - заменить все классы
- **animate** `< Объект {styleName: Any} >` - добавить CSS анимации, может содержать параметры анимации `duration` и `easing`, функция-обработчик однократного окончания анимации `onEnd`
- **events** `< Объект вида {eventName: func} >`, где `eventName` вида click, change..., а `func`:
  - `< Функция >`
  - `< Объект вида {handler: Функция, once: true, passive: false} >` - параметры addEventListener
- **events_r** - заменить все обработчики событий
- **on<>** `< Функция|Объект >` если параметр начинается с `on` - добавить обработчик события (перехват стандартных onclick/onpress). Вид объекта как у **events**
- **also** `< Функция >` - вызовется в конце текущего `make`/`update`
- **onMount** `< Функция >` вызовется при присоединении к DOM
- **onRender** `< Функция >` вызовется при отрисовке (момент появления размеров)
- **onUpdate** `< Функция >` вызовется при настройке через `update`
- **onDestroy** `< Функция >` вызовется при удалении через `EL.remove(el)`, `EL.clear(el)` или `el.remove()`
- **context** `< Объект >` - привязать контекст, пробрасывается в детей и не сбрасывается между вызовами `make`/`update` в рамках одного потока
- **$** `< Строка >` - добавить созданный элемент в context с именем `$значение`
- **push** `< Массив >` - добавить созданный элемент в указанный массив
- **Другие** будут добавлены как **props**

> [!NOTE]
> При обновлении `update` всё что указано как **добавить** - добавится, а **заменить** - заменит старое. Обработчики событий и `State`-бинды **не заменяют** старые

> [!NOTE]
> Во все обработчики передаётся объект `{el, context/ctx}`, где el - сам элемент, ctx - его контекст. Также во все обработчики прокидывается контекст в `this` (если обработчик - function())

### Функции
Статические методы EL:

```js
// Создать элемент
EL.make(tag, cfg = {}, svg = false)

// Создать элемент в контексте
EL.makeIn(context, tag, cfg = {}, svg = false);

// Обновить элемент или массив элементов
EL.update(el, cfg);

// Обновить элемент в контексте
EL.updateIn(context, el, cfg);

// Подключить к родителю, вернёт Promise
EL.mount(el, parent, waitRender = false, tries = 100);

// Заменить ребёнка old на нового el, old удалить, у el запустить монтаж с вызовом обработчиков. Вернёт el
EL.replace(old, el);

// Удалить всех детей
EL.clear(el, recursive = true);

// Удалить элемент
EL.remove(el, recursive = true);

// Отключить on-обработчики
EL.release(el);

// Отключить state-бинды
EL.unbind(el);

// Создать теневой элемент от указанного тега host, дети подключатся к нему в shadowRoot, стили запишутся в $style
EL.makeShadow(host, cfg = {}, css = '');

// Создать теневой элемент в контексте
EL.makeShadowIn(context, host, cfg = {}, css = '');

// Определить глобальный шаблон, fn - функция, возвращающая cfg-конфиг
EL.setTemplate(name, tag, fn);

// Вызвать шаблон
EL.useTemplate(name, ...args);
```

> [!NOTE]
> Методы `update`, `mount`, `replace`, `clear`, `remove`, `release` добавляются к созданному элементу и передают его первым аргументом, то есть можно вызывать `el.update(cfg)`, `el.mount(parent)` и т.д.

### State
Для реактивного поведения нужно создать `State` с параметрами как:

```js
let state = new State({foo: 1});
let state2 = useState({foo: 1});    // React-стиль
```

> [!WARNING]
> Нельзя создавать параметры с именами `subscribe` и `bind`! Они не будут работать

У объекта можно менять и читать созданные поля как

```js
state.foo = 123;
console.log(state.foo);
```

Для подключения стейта к элементу используется метод `bind(имя)` или `bind(имя, map)`, например:

```js
let state = useState({ count: 0 });

EL.make('button', {
    parent: document.body,
    text: state.bind('count'),
    onclick: () => {
        state.count += 1;   // будет менять text
    },
});
```

Кастомизированный вывод:

```js
EL.make('button', {
    parent: document.body,
    text: state.bind('count', e => 'Count: ' + e.value),
    onclick: () => {
        state.count += 1;   // будет менять text
    },
});
```

Также можно передать массив стейтов. Начальное значение будет взято из первого, реакция будет на все:

```js
let state = useState({ count: 0, name: 'test' });

EL.make('button', {
    parent: document.body,
    class: 'btn',
    text: [
        state.bind('count', e => 'Count: ' + e.value),
        state.bind('name', e => 'Name: ' + e.value),
    ]
});

state.count = 10;       // изменит текст на 'Count: 10'
state.name = 'hello';   // изменит текст на 'Name: hello'
```

Стейты поддерживаются везде, где это указано в списке параметров выше, то есть у классов и стилей тоже:

```js
let state = useState({ foo: false, bar: true, display: 'block' });

EL.make('button', {
    parent: document.body,
    // class: state.bind('foo'),
    class: {
        foo: state.bind('foo'), // bool
        bar: state.bind('bar'), // bool
    },
    style: {
        display: state.bind('display'), // string
    }
});
```

Для удобного задания дефолтных стилей и классов в объекте можно прописать их в параметр `_raw`, а остальные сделать реактивными:

```js
class: {
    _raw: 'my-button my-class',
    foo: state.bind('foo'), // bool
    bar: state.bind('bar'), // bool
},
```

### Компиляция
При установке **ifdef-loader** (`npm install ifdef-loader --save-dev`) флага `TINY_COMPONENT`:

```json
module: {
	rules: [
		{
			test: /\.js$/,
			loader: 'ifdef-loader',
			options: {
				TINY_COMPONENT: true,
			}
		}
	]
},
```

Компилируется минимальная версия фреймворка:

- Не создаются методы на элемент
- Нет lifecycle и обработчиков onMount, onUpdate...
- Удаление и очистка элемента не рекурсивные
- Нет отключения обработчиков событий в remove
- Нет функций и методов: replace, release, unbind, makeShadow, makeShadowIn, setTemplate, useTemplate
- Нет поддержки State и функций в значениях параметров

### Примеры
#### Минимальный пример
```js
let div1 = EL.make('div', {     // создать div
    parent: document.body,      // прикрепить к body
    text: 'hello 1',            // вывести текст
    class: 'card bordered',     // класс строкой
    style: 'color: red',        // стиль строкой
});

// стили и классы можно задавать объектом

let div2 = EL.make('div', {     // создать div
    text: 'hello 2',            // вывести текст
    class: {                    // класс объектом + условно
        card: true,
        bordered: false,
    },
    style: {                    // стиль объектом
        color: 'green',
        'font-size': '20px',
    }
});

// можно прикрепить вручную
div2.mount(document.body);
```

#### Обновления
```js
// (переменные div1 и div2 из прошлого примера)
// через 1 сек поменять текст, стиль и убрать класс bordered

setTimeout(() => {
    div1.update({
        text: 'hello world!',
        class: {
            bordered: false,
        },
        style: {
            color: 'unset',
        }
    });
}, 1000);

// можно очистить/перезаписать стили и классы через _r

setTimeout(() => {
    div2.update({
        class_r: '',
        style_r: '',
    });
}, 2000);
```

#### Вложенные элементы
```js
EL.make('div', {
    parent: document.body,
    class: 'card',
    children: [             // может быть массивом
        {
            tag: 'span',
            text: 'hello 1',
        },
        {
            // без указания тега будет div
            class: 'card',
            children: {     // может быть объектом (1 элемент)
                tag: 'span',
                text: 'hello 2',
            }
        }
    ]
});

// трюки

EL.make('div', {
    parent: document.body,
    class: 'card',
    children: [
        {},                     // валидно, пустой div
        null,                   // валидно, ничего не добавится
        undefined,              // валидно, ничего не добавится
        true && {               // можно добавлять детей по условию
            tag: 'span',
            text: 'hello 1',
        }
    ]
});
```

#### События и обработчики
```js
EL.make('button', {
    parent: document.body,
    text: 'press me',
    class: 'btn',

    // обработчик клика
    onclick: (e) => {
        console.log('click!', e, e.el, e.ctx);
        // e - Event
        // e.el - сам элемент (кнопка)
        // e.ctx - контекст (о нём ниже)
    },

    // можно добавлять options для событий, обработчик указывается в handler
    onmousedown: {
        handler: () => console.log('press'),
        once: true
    },

    // можно подключить ещё вот так
    events: {
        mousemove: () => { },

        input: {
            handler: () => { },
            passive: false
        }
    }
});
```

#### Жизненный цикл и его обработчики
```js
// кнопка меняет счётчик, после 5 кликов кнопка удаляется

let count = 0;

EL.make('button', {
    parent: document.body,
    class: 'btn',
    text: 'press',
    onclick: e => {
        e.el.update({ text: 'update ' + count });
        if (++count == 5) e.el.remove();
    },
    also: () => {
        console.log('div also');      // вызовется после make
    },
    onMount: () => {
        console.log('div mount');     // вызовется после добавления в body
    },
    onRender: () => {
        console.log('div render');    // вызовется после фактического рендера
    },
    onUpdate: () => {
        console.log('div update');    // вызовется после обновления параметров
    },
    onDestroy: () => {
        console.log('div destroy');   // вызовется после удаления
    },
});
```

#### Стейты и реактивность
```js
// создаём стейт
let state = new State({ count: 0, name: 'Alex' });

// пример 1 (без стейта)
EL.make('button', {
    parent: document.body,
    class: 'btn',
    text: 0,
    onclick: (e) => e.el.update({ text: Number(e.el.textContent) + 1 }),
});

// пример 2
EL.make('button', {
    parent: document.body,
    class: 'btn',
    text: state.bind('count'),  // привязываем к count
    onclick: () => {
        state.count += 1;       // будет менять text
    },
});

// пример 3
EL.make('button', {
    parent: document.body,
    class: 'btn',
    text: state.bind('count', e => 'Count: ' + e.value),    // кастомный вывод
    onclick: () => {
        state.count += 1;       // будет менять text
    },
});

// пример 4
EL.make('div', {
    parent: document.body,
    class: 'card',
    children: [
        {
            tag: 'input',
            type: 'text',
            size: 10,
            value: state.name,      // значение по умолчанию
            oninput: e => state.name = e.el.value,  // меняем
        },
        {
            tag: 'span',
            text: state.bind('name'),   // и меняется тут
        }
    ]
});
```

#### Контекст и экспорт
```js
let obj = {};   // контекст
let arr = [];   // массив

EL.make('div', {            // создать div
    push: arr,              // добавить div в массив (переменная arr выше)
    context: obj,           // контекст для $ и обработчиков (переменная obj выше)
    $: 'myDiv',             // создать $myDiv в контексте
    parent: document.body,  // прикрепить к body
    children: [             // добавить вложенные
        {
            tag: 'span',        // элемент span
            $: 'mySpan',        // контекст прокидывается в детей, создать $mySpan
            text: 'text',       // с текстом 'text'
        },
        {
            tag: 'button',
            class: 'btn',
            text: 'say hello',
            onclick: (e) => {
                // e.context/e.ctx - контекст
                // обновим текст и цвет mySpan
                e.ctx.$mySpan.update({
                    text: 'hello!',
                    style: 'color: red',
                });
            }
        },
        {
            tag: 'button',
            class: 'btn',
            text: 'remove',
            onclick: (e) => {
                e.ctx.$myDiv.remove();    // удалить весь контейнер div
            },
        },
    ],
});

console.log(obj);   // {$myDiv: div.card, $mySpan: span, $counter: span}
console.log(arr);   // [div.card]

// добавим поле для счётчика
// контекст автоматически прокидывается сюда после прошлого вызова make
obj.$myDiv.update({
    children: {
        tag: 'span',
        $: 'counter',   // создать $counter в obj
        text: 0,
    }
});

// будем менять счётчик по таймеру
let count = 0;
setInterval(() => {
    obj.$counter.update({
        text: count++,
    });
}, 1000);

// через 3 сек заменим mySpan на новую кнопку и сохраним в контексте
setTimeout(() => {
    obj.$mySpan = obj.$mySpan.replace(EL.make('button', {
        class: 'btn',
        text: obj.$mySpan.textContent,
    }));
}, 3000);
```

#### Анимации
```js
EL.make('div', {
    // анимируем и удаляем после завершения
    parent: document.body,
    style: { width: '50px', height: '50px', backgroundColor: 'orange' },
    animate: {
        width: '150px', height: '150px',
        duration: 1500, onEnd: (e) => e.el.remove()
    },
});
```

#### Шаблоны компонентов
```js
// через глобальный шаблон EL
EL.setTemplate('userCard', 'div', (name, lastname, birthdate) => ({
    class: 'card',
    children: [
        { tag: 'h3', text: `${name} ${lastname}` },
        { tag: 'p', text: `Birthdate: ${birthdate}` }
    ]
}));

EL.useTemplate('userCard', 'Alice', 'Smith', '1995-06-12').mount(document.body);
EL.useTemplate('userCard', 'Bob', 'Johnson', '1990-01-01').mount(document.body);

// вручную + родитель
const myTemplate = (name, lastname, birthdate, parent) => (EL.make('div', {
    class: 'card',
    parent,
    children: [
        { tag: 'h3', text: `${name} ${lastname}` },
        { tag: 'p', text: `Birthdate: ${birthdate}` }
    ]
}));

myTemplate('Alice', 'Smith', '1995-06-12', document.body);
myTemplate('Bob', 'Johnson', '1990-01-01', document.body);
```

#### Shadow DOM
```js
// элемент со своими изолированными стилями

EL.makeShadow('div', {
    parent: document.body,
    children: [
        {
            class: 'myclass',
            children: {
                text: 'I am shadow!',
            }
        }
    ]
},
    '.myclass{color:red;}'
);
```

## Прочее
```js
// Добавить стили. Без ID будет вычислен хэш
function addCSS(css, id = null);

// Удалить стили. Без ID будет вычислен хэш
function removeCSS(css, id = null);

// следить за обновлениями размера элемента
function watchResize(el, onResize);
```

## SVG
Набор инструментов для создания SVG компонентов:

```js
SVG.make(tag, cfg);
SVG.update(el, cfg);

SVG.svg(attrs = {}, cfg = {});
SVG.rect(x, y, w, h, rx, ry, attrs = {}, cfg = {});
SVG.circle(x, y, r, attrs = {}, cfg = {});
SVG.line(x1, y1, x2, y2, attrs = {}, cfg = {});
SVG.polyline(points, attrs = {}, cfg = {});
SVG.polygon(points, attrs = {}, cfg = {});
SVG.path(d, attrs = {}, cfg = {});
SVG.text(text, x, y, attrs = {}, cfg = {});
```

### Примеры
```js
SVG.svg({ width: 200, height: 200 }, {
    parent: document.body,
    style: 'border: 1px solid #ccc',
    children: [
        // вручную
        {
            tag: 'rect',
            attrs: {
                x: 10,
                y: 130,
                width: 50,
                height: 50,
                fill: 'green',
            }
        },

        // билдеры
        SVG.rect(10, 10, 50, 50, 5, 5, { fill: 'blue' }),
        SVG.circle(100, 100, 30, { fill: 'red' }),
        SVG.line(0, 0, 200, 200, { stroke: 'black', 'stroke-width': 2 })
    ],
});
```