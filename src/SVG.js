import { EL } from "./EL";

export class SVG {
    static svg = (attrs = {}, cfg = {}) => ({ tag: 'svg', ...cfg, attrs });
    static rect = (x, y, width, height, rx, ry, attrs = {}, cfg = {}) => ({ tag: 'rect', ...cfg, attrs: { ...attrs, x, y, width, height, rx, ry } });
    static circle = (cx, cy, r, attrs = {}, cfg = {}) => ({ tag: 'circle', ...cfg, attrs: { ...attrs, cx, cy, r } });
    static line = (x1, y1, x2, y2, attrs = {}, cfg = {}) => ({ tag: 'line', ...cfg, attrs: { ...attrs, x1, y1, x2, y2 } });
    static polyline = (points, attrs = {}, cfg = {}) => ({ tag: 'polyline', ...cfg, attrs: { ...attrs, points } });
    static polygon = (points, attrs = {}, cfg = {}) => ({ tag: 'polygon', ...cfg, attrs: { ...attrs, points } });
    static path = (d, attrs = {}, cfg = {}) => ({ tag: 'path', ...cfg, attrs: { ...attrs, d } });
    static text = (text, x, y, attrs = {}, cfg = {}) => ({ tag: 'text', ...cfg, text, attrs: { ...attrs, x, y } });

    static make = (tag, cfg) => EL.make(tag, cfg, true);
    static update = EL.update;
    static config = EL.update; // legacy
}

Object.getOwnPropertyNames(SVG).forEach(name => SVG['make_' + name] = (...args) => SVG.make(null, SVG[name](...args)));