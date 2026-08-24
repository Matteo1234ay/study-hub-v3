const KEY = "study-hub-v3:preferences";
const DEFAULTS = Object.freeze({ fontSize: "normal", width: "comfortable", focus: false });
const FONT_SIZES = new Set(["small", "normal", "large"]);
const WIDTHS = new Set(["comfortable", "narrow"]);

function sanitize(value = {}) {
  return {
    fontSize: FONT_SIZES.has(value.fontSize) ? value.fontSize : DEFAULTS.fontSize,
    width: WIDTHS.has(value.width) ? value.width : DEFAULTS.width,
    focus: typeof value.focus === "boolean" ? value.focus : DEFAULTS.focus
  };
}

export function createPreferencesStore(storage = localStorage) {
  function get() {
    try { return sanitize(JSON.parse(storage.getItem(KEY))); }
    catch { return { ...DEFAULTS }; }
  }
  function update(changes) {
    const value = sanitize({ ...get(), ...changes });
    storage.setItem(KEY, JSON.stringify(value));
    return value;
  }
  function applyTo(root) {
    const value = get();
    root.setAttribute("data-font-size", value.fontSize);
    root.setAttribute("data-reading-width", value.width);
    root.setAttribute("data-focus-mode", String(value.focus));
    return value;
  }
  return { get, update, applyTo };
}
