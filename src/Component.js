import { EL } from "./EL";
import { SVG } from "./SVG";
import { addCSS, removeCSS, watchMount, watchResize } from "./utils";

export { addCSS, removeCSS, watchMount, watchResize, SVG, EL };

/// #if !TINY_COMPONENT
import { State, useState } from "./State";
export { State, useState };
/// #endif

// legacy
export const Component = EL;