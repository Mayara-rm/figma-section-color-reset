import { PAGE_SECTION_NAMES } from "./constants"
import { ResolvedStyleMap } from "./styles"

// ─── Retorna sections selecionadas ou todas da página ─────────────────────────

export function getSections(): SectionNode[] {
  const selected = figma.currentPage.selection.filter(
    (n) => n.type === "SECTION"
  ) as SectionNode[]
  if (selected.length > 0) return selected
  return figma.currentPage.findAll((n) => n.type === "SECTION") as SectionNode[]
}

// ─── Calcula profundidade da section na hierarquia ────────────────────────────

export function getSectionDepth(section: SectionNode): number {
  let depth = 1
  let parent = section.parent
  while (parent) {
    if (parent.type === "SECTION") depth++
    parent = parent.parent
  }
  return depth
}

// ─── Verifica se a section deve receber a cor de Página Inicial ───────────────

export function isPageSection(section: SectionNode): boolean {
  return PAGE_SECTION_NAMES.includes(section.name.trim())
}

// ─── Resolve qual style deve ser aplicado na section ─────────────────────────
// Lógica: nome exato → Página Inicial | profundidade → camada mais próxima

export function resolveExpectedStyle(
  section: SectionNode,
  styleMap: ResolvedStyleMap
): BaseStyle | null {
  if (isPageSection(section)) {
    return styleMap.page
  }

  const depth = getSectionDepth(section)
  const availableDepths = Object.keys(styleMap.layers).map(Number).sort((a, b) => a - b)

  if (availableDepths.length === 0) return null

  // Usa a camada exata ou a mais profunda disponível como fallback
  const targetDepth = availableDepths.includes(depth)
    ? depth
    : availableDepths[availableDepths.length - 1]

  return styleMap.layers[targetDepth] ?? null
}

// ─── Verifica se a section tem um style imutável aplicado ────────────────────

export function isImmutable(
  section: SectionNode,
  styleMap: ResolvedStyleMap
): boolean {
  const fillStyleId = section.fillStyleId
  if (typeof fillStyleId !== "string") return false

  const immutableIds = Object.values(styleMap.immutable)
    .map((s) => s.id)
    .filter(Boolean)

  return immutableIds.includes(fillStyleId)
}