export class State {
    constructor(init = {}) {
        this._data = {};
        this._subs = new Map();
        this.addStates(init);
    }

    // добавить состояния
    addStates(obj) {
        for (const name in obj) {
            if (name in this || name in this._data) continue;

            this._data[name] = obj[name];

            Object.defineProperty(this, name, {
                get: () => this._data[name],
                set: (value) => {
                    if (Object.is(this._data[name], value)) return;
                    this._data[name] = value;
                    const subs = this._subs.get(name);
                    if (subs) subs.forEach(fn => fn(name, value));
                }
            });
        }
    }

    // имеет состояние
    hasState(name) {
        return name in this._data;
    }

    // подключить состояние
    bind(name, map = (e) => e.value) {
        return { _state: this, name, map };
    }

    // подписаться, функция вида fn(name, val)
    subscribe(name, fn) {
        if (!this._subs.has(name)) this._subs.set(name, new Set());
        this._subs.get(name).add(fn);
        return () => this._subs.get(name).delete(fn);
    }
}

export function useState(init) {
    return new State(init);
}