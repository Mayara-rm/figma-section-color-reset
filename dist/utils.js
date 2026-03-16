import { PAGE_SECTION_NAMES } from "./constants";
// ─── Retorna sections selecionadas ou todas da página ─────────────────────────
export function getSections() {
    const selected = figma.currentPage.selection.filter((n) => n.type === "SECTION");
    if (selected.length > 0)
        return selected;
    return figma.currentPage.findAll((n) => n.type === "SECTION");
}
// ─── Calcula profundidade da section na hierarquia ────────────────────────────
export function getSectionDepth(section) {
    let depth = 1;
    let parent = section.parent;
    while (parent) {
        if (parent.type === "SECTION")
            depth++;
        parent = parent.parent;
    }
    return depth;
}
// ─── Verifica se a section deve receber a cor de Página Inicial ───────────────
export function isPageSection(section) {
    return PAGE_SECTION_NAMES.includes(section.name.trim());
}
// ─── Verifica se a section é de componentes pelo nome ────────────────────────
// Aceita: "componente", "componentes", "Componente", "Componentes" etc.
export function isComponentSection(section) {
    return /^componentes?$/i.test(section.name.trim());
}
// ─── Resolve qual style deve ser aplicado na section ─────────────────────────
export function resolveExpectedStyle(section, styleMap) {
    var _a, _b;
    // Nome exato → Página Inicial
    if (isPageSection(section)) {
        return styleMap.page;
    }
    // Nome de componente → style Componentes do folder Cores de Identificação
    if (isComponentSection(section)) {
        return (_a = styleMap.immutable["Componentes"]) !== null && _a !== void 0 ? _a : null;
    }
    // Demais → profundidade
    const depth = getSectionDepth(section);
    const availableDepths = Object.keys(styleMap.layers).map(Number).sort((a, b) => a - b);
    if (availableDepths.length === 0)
        return null;
    const targetDepth = availableDepths.includes(depth)
        ? depth
        : availableDepths[availableDepths.length - 1];
    return (_b = styleMap.layers[targetDepth]) !== null && _b !== void 0 ? _b : null;
}
// ─── Verifica se a section tem um style imutável aplicado ────────────────────
// Inclui sections de componentes que já têm o style correto aplicado.
export function isImmutable(section, styleMap) {
    const fillStyleId = section.fillStyleId;
    if (typeof fillStyleId !== "string")
        return false;
    const immutableIds = Object.values(styleMap.immutable)
        .map((s) => s.id)
        .filter(Boolean);
    // Se já tem o style imutável aplicado → ignorar
    if (immutableIds.includes(fillStyleId))
        return true;
    // Se é section de componentes e já tem o style Componentes → ignorar
    if (isComponentSection(section)) {
        const componentStyle = styleMap.immutable["Componentes"];
        if (componentStyle && fillStyleId === componentStyle.id)
            return true;
    }
    return false;
}
