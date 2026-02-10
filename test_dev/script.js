// import { addCSS, EL, useState, SVG, State } from "https://gyverlibs.github.io/Component.js/Component.min.js";
import { addCSS, EL, useState, SVG, State } from "../src/Component.js";

// добавить стили в head
addCSS(`
    body { font-family: sans-serif; padding: 20px; }
    span { padding: 0 5px }
    .card { border: 1px solid #ccc; padding: 10px; margin: 10px 0; border-radius: 6px; max-width: 250px; }
    .btn { padding: 5px 10px; background: #007bff; color: white; border: none; cursor: pointer; border-radius: 4px; margin: 0 5px; }
    .bordered { border: 1px solid red; }
    hr { margin: 10px; }
`);

test1();
test2();
test3();
test4();
test5();
test6();
test7();
test8();
test9();
test10();

// минимальный пример, настройка стилей
function test1() {
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
    // EL.mount(div2, document.body);

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

    EL.make('hr', { parent: document.body });
}

// вложенные элементы
function test2() {
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

    EL.make('hr', { parent: document.body });
}

// события и обработчики
function test3() {
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

    EL.make('hr', { parent: document.body });
}

// жизненный цикл и его обработчики
function test4() {
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

    EL.make('hr', { parent: document.body });
}

// Контекст и экспорт
function test5() {
    let obj = {};   // контекст
    let arr = [];   // массив

    EL.make('div', {            // создать div
        push: arr,              // добавить div в массив (переменная arr выше)
        ctx: obj,               // контекст для $ и обработчиков (переменная obj выше)
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
                    // e.ctx - контекст
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

    // добавим поле для счётчика. Используется контекст родителя
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
        obj.$mySpan = EL.replace(obj.$mySpan, EL.make('button', {
            class: 'btn',
            text: obj.$mySpan.textContent,
        }));
    }, 3000);

    EL.make('hr', { parent: document.body });
}

// Стейты и реактивность
function test6() {
    // создаём стейт
    let state = new State({ count: 0, name: 'Alex' });
    // можно useState() вместо new State() =)

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

    EL.make('hr', { parent: document.body });
}

// Shadow DOM
function test7() {
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

    EL.make('hr', { parent: document.body });
}

// Шаблоны компонентов
function test8() {
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

    EL.make('hr', { parent: document.body });
}

// Анимации
function test9() {
    EL.make('div', {
        // анимируем и удаляем после завершения
        parent: document.body,
        style: { width: '50px', height: '50px', backgroundColor: 'orange' },
        animate: {
            width: '150px', height: '150px',
            duration: 1500, onEnd: (e) => e.el.remove()
        },
    });

    EL.make('hr', { parent: document.body });
}

// SVG
function test10() {
    let circ = SVG.make_circle(100, 100, 30, { fill: 'red' });

    SVG.make_svg({ width: 200, height: 200 }, {
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

            // внешний
            circ,

            // билдеры
            SVG.rect(10, 10, 50, 50, 5, 5, { fill: 'blue' }),
            SVG.line(0, 0, 200, 200, { stroke: 'black', 'stroke-width': 2 })
        ],
    });

    EL.make('hr', { parent: document.body });

    // двигаем кружок
    setInterval(() => {
        circ.update({ attrs: { cx: Math.random() * 200, cy: Math.random() * 200 } })
    }, 300);
}