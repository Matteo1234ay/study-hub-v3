export function element(tag, options = {}, children = []) {
  const node = document.createElement(tag);
  if (options.className) node.className = options.className;
  if (options.text !== undefined) node.textContent = options.text;
  if (options.href) node.setAttribute("href", options.href);
  for (const [name, value] of Object.entries(options.attrs ?? {})) {
    node.setAttribute(name, value);
  }
  for (const child of Array.isArray(children) ? children : [children]) {
    if (child) node.append(child);
  }
  return node;
}

export function pageHeader(kicker, title, description) {
  return element("header", { className: "page-heading" }, [
    element("p", { className: "eyebrow", text: kicker }),
    element("h1", { text: title }),
    element("p", { className: "page-lead", text: description })
  ]);
}

export function emptyState(title = "Nessuna lezione disponibile") {
  return element("section", { className: "empty-state", attrs: { "aria-live": "polite" } }, [
    element("span", { className: "empty-mark", text: "∅", attrs: { "aria-hidden": "true" } }),
    element("h2", { text: title }),
    element("p", { text: "Quando la fonte ufficiale sarà pronta, comparirà qui automaticamente." })
  ]);
}
