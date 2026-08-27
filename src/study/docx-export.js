function xml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}
function paragraph(text, { bold = false, size = null } = {}) {
  const props = bold || size ? `<w:rPr>${bold ? "<w:b/>" : ""}${size ? `<w:sz w:val="${size}"/><w:szCs w:val="${size}"/>` : ""}</w:rPr>` : "";
  return `<w:p><w:r>${props}<w:t xml:space="preserve">${xml(text)}</w:t></w:r></w:p>`;
}
export function buildNotesDocxParts({ title, notes = [], exportedAt = new Date().toLocaleString("it-IT") }) {
  const body = [paragraph(title, { bold: true, size: 32 }), paragraph(`Esportato: ${exportedAt}`), paragraph("")];
  let current = "";
  for (const note of notes) {
    const heading = `${note.chapterId}${note.sectionId ? ` · ${note.sectionId}` : ""}`;
    if (heading !== current) { body.push(paragraph(heading, { bold: true, size: 24 })); current = heading; }
    body.push(paragraph(`• ${note.text}`));
  }
  return {
    "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`,
    "_rels/.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`,
    "word/document.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body.join("")}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body></w:document>`
  };
}

function crc32(bytes) {
  let crc = -1;
  for (const byte of bytes) { crc ^= byte; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1)); }
  return (crc ^ -1) >>> 0;
}
function u16(value) { return [value & 255, value >>> 8 & 255]; }
function u32(value) { return [value & 255, value >>> 8 & 255, value >>> 16 & 255, value >>> 24 & 255]; }
export function zipStored(parts) {
  const encoder = new TextEncoder(), chunks = [], central = []; let offset = 0;
  for (const [name, content] of Object.entries(parts)) {
    const nameBytes = encoder.encode(name), data = encoder.encode(content), crc = crc32(data);
    const local = new Uint8Array([80,75,3,4,20,0,0,0,0,0,0,0,0,0,...u32(crc),...u32(data.length),...u32(data.length),...u16(nameBytes.length),0,0,...nameBytes,...data]);
    chunks.push(local);
    central.push(new Uint8Array([80,75,1,2,20,0,20,0,0,0,0,0,0,0,0,0,...u32(crc),...u32(data.length),...u32(data.length),...u16(nameBytes.length),0,0,0,0,0,0,0,0,0,0,0,0,...u32(offset),...nameBytes]));
    offset += local.length;
  }
  const centralSize = central.reduce((n, part) => n + part.length, 0), end = new Uint8Array([80,75,5,6,0,0,0,0,...u16(central.length),...u16(central.length),...u32(centralSize),...u32(offset),0,0]);
  const output = new Uint8Array(offset + centralSize + end.length); let cursor = 0;
  for (const chunk of [...chunks, ...central, end]) { output.set(chunk, cursor); cursor += chunk.length; }
  return output;
}
export function createNotesDocxBlob(options) { return new Blob([zipStored(buildNotesDocxParts(options))], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }); }
export function downloadNotesDocx(options, filename = "note-studio.docx") {
  const url = URL.createObjectURL(createNotesDocxBlob(options)), anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename; document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
