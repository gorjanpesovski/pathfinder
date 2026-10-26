export const ATVISE_SCRIPT = `<script atv:desc="" atv:name="" type="text/ecmascript"><![CDATA[
]]></script>`;

const NAMESPACES = [
  `xmlns="http://www.w3.org/2000/svg"`,
  `xmlns:atv="http://webmi.atvise.com/2007/svgext"`,
  `xmlns:cc="http://creativecommons.org/ns#"`,
  `xmlns:dc="http://purl.org/dc/elements/1.1/"`,
  `xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"`,
  `xmlns:ns1="http://sozi.baierouge.fr"`,
  `xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"`,
  `xmlns:sketch="http://www.bohemiancoding.com/sketch/ns"`,
  `xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"`,
  `xmlns:svg="http://www.w3.org/2000/svg"`,
  `xmlns:xlink="http://www.w3.org/1999/xlink"`
].join(" ");

export function escapeXml(text){
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function svgElement(tag, attributes, content = null){
  const pairs = Object.entries(attributes)
    .filter(([, value]) => value !== undefined && value !== null)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => `${key}="${escapeXml(value)}"`)
    .join(" ");
  return content === null ? `<${tag} ${pairs}/>` : `<${tag} ${pairs}>${content}</${tag}>`;
}

function indent(body){
  return body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ` ${line}`)
    .join("\n");
}

export function atviseDocument(width, height, body){
  const content = indent(body);
  return `<?xml version='1.0' encoding='UTF-8' standalone='no'?>
<svg height="${height}" version="1.2" width="${width}" ${NAMESPACES}>
 <defs/>
 <metadata>
  <atv:gridconfig enabled="false" gridstyle="lines" height="20" width="20"/>
  <atv:snapconfig enabled="false" height="10" width="10"/>
 </metadata>
${content ? `${content}\n` : ""} ${ATVISE_SCRIPT}
</svg>`;
}
