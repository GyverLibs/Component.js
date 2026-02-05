import { EL, Sheet, StyledComponent } from "https://gyverlibs.github.io/Component.js/Component.min.js";
// import { EL, Sheet, StyledComponent } from "../Component.js";

// кнопка наследует, стили добавляются отдельно
class Button extends EL {
    constructor(text, handler) {

        super('button', {
            text: text,
            class: 'btn',
            style: 'border-radius: 5px',
            events: {
                click: handler,
            },
            also(el) {
                // console.log('123');
            }
        });

        Sheet.addStyle(`
.btn {
background: red;
}
.btn {
color: white
}
`,
            this, true);   // this превратится в Button
    }
}

// инпут сразу добавляет стили
class Input extends StyledComponent {
    constructor(text) {
        super('input',
            {
                type: 'text',
                value: text,
                class: 'inp',
            },
            '.inp {background: blue}',
            'Input'
        );
    }
}

class Num {
    constructor(text) {
        return new StyledComponent('input',
            {
                type: 'number',
                value: text,
                class: 'num',
            },
            '.num {background: green;margin-left: 10px}',
            'Num'
        );
    }
}

// функция вернёт элемент
function Checkbox(name) {
    return StyledComponent.make('div',
        {
            children: [
                {
                    tag: 'input',
                    type: 'checkbox'
                },
                `<label class=check>${name}</label>`,
            ]
        },
        '.check {font-size: 20px;}',
        'Checkbox'
    );
}

function Container(children) {
    return EL.make('div',
        {
            children: children,
        });
}

class ShadowComponent {
    constructor() {
        EL.makeShadow('div', {
            context: this,
            parent: document.body,
            events: {
                click: () => this.$div.dispatchEvent(new Event('kek', { bubbles: true, composed: true })),
            },
            children: [
                {
                    tag: 'div',
                    text: 'Hello!',
                    class: 'myclass',
                    var: 'div',
                }
            ]
        }, '.myclass{color:red;}'
        );

    }
}

document.addEventListener('kek', () => console.log('kek!'));

let context = { ctx: 'ctx' };

let d = EL.make('div', {
    context: context,
    parent: document.body,
    text: 'test',
    style: { width: '100px', height: '50px', background: 'red' },
    animate: { width: '200px', background: 'blue', duration: 500, onEnd: function (el) { console.log('anim', this, el) } },
    events: {
        mouseleave: function (e, el) { console.log('leave', this, e, el) },
    },
    click: (e, el, ctx) => console.log('click', this, e, el, ctx),
    also: function (el) { console.log('also', this, el) },
    onUpdate: (el, ctx) => console.log('update', this, el, ctx),
    onDestroy: (el, ctx) => console.log('destroy', this, el, ctx),
    // onMount: el => console.log('mount', this),
    onMount: function (el) { console.log('mount', this, el) },
});

// setTimeout(() => { document.body.appendChild(d) }, 2000);
setTimeout(() => { EL.config(d, { text: 123 }) }, 2000);
setTimeout(() => { EL.remove(d) }, 4000);

document.addEventListener("DOMContentLoaded", () => {
    EL.make('h1', {
        text: 'Hello!',
        parent: document.body,
    });

    let b = new Button('b1', () => console.log(123));

    let cont = Container([b, new Button('b2', () => console.log('hello')), new Input('hello'), new Num('123')]);
    document.body.appendChild(cont);

    document.body.appendChild(Checkbox('kek'));
    document.body.appendChild(Checkbox('pek'));

    // Sheet.removeStyle('Button');
    // Sheet.removeStyle('Checkbox');
});