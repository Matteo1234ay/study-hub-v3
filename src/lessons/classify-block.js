const PREFIXES = new Map([
  ["esempio", "example"],
  ["attenzione", "warning"],
  ["errore", "error"],
  ["punto chiave", "key-concept"],
  ["regola", "key-concept"],
  ["regola pratica", "key-concept"],
  ["che cosa non puoi concludere", "warning"],
  ["nota", "note"],
  ["domanda diagnostica", "diagnostic-question"],
  ["formula", "formula"],
  ["checklist", "checklist"],
  ["checkpoint", "checkpoint"]
]);

export function classifyBlock(block) {
  if (block.kind !== "paragraph") return { ...block, type: block.kind };
  const text = block.text.trim();
  const match = text.match(/^([^:.]{2,40})[.:]\s+(.*)$/s);
  if (!match) return { type: "paragraph", text };
  const key = match[1].trim().toLocaleLowerCase("it");
  const type = PREFIXES.get(key);
  return type
    ? { type, label: match[1].trim(), text: match[2].trim() }
    : { type: "paragraph", text };
}
