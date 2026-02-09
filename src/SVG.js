import { EL } from "./EL";

export class SVG {
    static make = (tag, cfg) => EL.make(tag, cfg, true);
    static update = (el, cfg) => EL.update(el, cfg);

    static svg = (attrs = {}, cfg = {}) => SVG._make('svg', attrs, cfg);
    static rect = (x, y, w, h, rx, ry, attrs = {}, cfg = {}) => SVG._make('rect', { ...attrs, x, y, width: w, height: h, rx, ry }, cfg);
    static circle = (x, y, r, attrs = {}, cfg = {}) => SVG._make('circle', { ...attrs, cx: x, cy: y, r }, cfg);
    static line = (x1, y1, x2, y2, attrs = {}, cfg = {}) => SVG._make('line', { ...attrs, x1, y1, x2, y2 }, cfg);
    static polyline = (points, attrs = {}, cfg = {}) => SVG._make('polyline', { ...attrs, points }, cfg);
    static polygon = (points, attrs = {}, cfg = {}) => SVG._make('polygon', { ...attrs, points }, cfg);
    static path = (d, attrs = {}, cfg = {}) => SVG._make('path', { ...attrs, d }, cfg);
    static text = (text, x, y, attrs = {}, cfg = {}) => SVG._make('text', { ...attrs, x, y }, { ...cfg, text });

    static _make = (tag, attrs = {}, cfg = {}) => SVG.make(tag, { attrs: { ...attrs }, ...cfg });
    static config = SVG.update; // legacy
}