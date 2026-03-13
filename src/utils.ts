import {
  PAGE_SECTION_NAMES,
  DEPTH_STYLE_NAMES,
  IMMUTABLE_STYLE_NAMES,
  STYLE_NAMES,
} from "./constants"

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

export function resolveExpectedStyle(
  section: SectionNode,
  styleMap: Record<string, BaseStyle>
): BaseStyle | null {
  if (isPageSection(section)) {
    return styleMap[STYLE_NAMES.PAGE] ?? null
  }

  const depth = getSectionDepth(section)
  const index = Math.min(depth - 1, DEPTH_STYLE_NAMES.length - 1)
  return styleMap[DEPTH_STYLE_NAMES[index]] ?? null
}

// ─── Verifica se a section tem um style imutável aplicado ────────────────────

export function isImmutable(
  section: SectionNode,
  styleMap: Record<string, BaseStyle>
): boolean {
  const fillStyleId = section.fillStyleId
  if (typeof fillStyleId !== "string") return false

  const immutableIds = IMMUTABLE_STYLE_NAMES
    .map((name) => styleMap[name]?.id)
    .filter((id): id is string => Boolean(id))

  return immutableIds.includes(fillStyleId)
}