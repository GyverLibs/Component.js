import { Component, Sheet } from "@alexgyver/component";

// пример использования

// кнопка наследует, стили добавляются отдельно
class Button extends Component {
    constructor(text, handler) {

        super('button', {
            text: text,
            class: 'btn',
            events: {
                click: handler,
            },
            also(el) {
                // console.log('123');
            }
        });

        Sheet.addStyle([
            '.btn', [
                'background: red',
                'color: white'
            ]
        ], this);   // this превратится в Button
    }
}

// инпут сразу добавляет стили
class Input extends Component {
    constructor(text) {
        super('input',
            {
                type: 'text',
                value: text,
                class: 'inp',
            },
            [
                '.inp', [
                    'background: blue'
                ]
            ],
            'Input'
        );
    }
}

class Num {
    constructor(text) {
        return new Component('input',
            {
                type: 'number',
                value: text,
                class: 'num',
            },
            [
                '.num', [
                    'background: green',
                    'margin-left: 10px',
                ]
            ],
            'Num'
        );
    }
}

// функция вернёт элемент
function Checkbox(name) {
    return Component.make('div',
        {
            children: [
                {
                    tag: 'input',
                    type: 'checkbox'
                },
                {
                    tag: 'label',
                    text: name,
                    class: 'check'
                }
            ]
        },
        '.check {font-size: 20px}',
        'Checkbox'
    );
}

function Container(children) {
    return Component.make('div',
        {
            children: children,
        });
}

document.addEventListener("DOMContentLoaded", () => {
    let b = new Button('b1', () => console.log(123));

    let cont = Container([b, new Button('b2', () => console.log('hello')), new Input('hello'), new Num('123')]);
    document.body.appendChild(cont);

    document.body.appendChild(Checkbox('kek'));
    document.body.appendChild(Checkbox('pek'));

    // Sheet.removeStyle('Button');
    // Sheet.removeStyle('Checkbox');
});