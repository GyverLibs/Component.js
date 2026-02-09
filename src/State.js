export class State {
    constructor(init = {}) {
        this._data = init;
        this._subs = new Set();

        for (const name in init) {
            if (name in this) continue;

            Object.defineProperty(this, name, {
                get: () => this._data[name],
                set: (value) => {
                    if (Object.is(this._data[name], value)) return;
                    this._data[name] = value;
                    this._subs.forEach(fn => fn(name, value));
                },
            });
        }
    }

    // подключить состояние
    bind(name, map = (e) => e.value) {
        return { _state: this, name, map };
    }

    // подписаться, функция вида fn(name, val)
    subscribe(fn) {
        this._subs.add(fn);
        return () => this._subs.delete(fn);
    }
}

export function useState(init) {
    return new State(init);
}