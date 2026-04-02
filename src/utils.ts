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
// Reconhece qualquer nome que contenha "login" ou "home" (case-insensitive)

export function isPageSection(section: SectionNode): boolean {
  const name = section.name.trim().toLowerCase()
  return name.includes("login") || name.includes("home")
}

// ─── Verifica se a section é de componentes pelo nome ────────────────────────
// Aceita: "componente", "componentes", "Componente", "Componentes" etc.

export function isComponentSection(section: SectionNode): boolean {
  return /^componentes?$/i.test(section.name.trim())
}

// ─── Busca um style no mapa de imutáveis por nome (case-insensitive) ─────────

function findImmutableStyle(styleMap: ResolvedStyleMap, name: string): BaseStyle | null {
  const lower = name.toLowerCase()
  const found = Object.entries(styleMap.immutable).find(([k]) => k.toLowerCase() === lower)
  return found ? found[1] : null
}

// ─── Resolve qual style deve ser aplicado na section ─────────────────────────

export function resolveExpectedStyle(
  section: SectionNode,
  styleMap: ResolvedStyleMap
): BaseStyle | null {

  // Nome contém "login" ou "home" → Página Inicial
  if (isPageSection(section)) {
    return styleMap.page
  }

  // Nome de componente → style Componentes do folder Cores de Identificação
  if (isComponentSection(section)) {
    return findImmutableStyle(styleMap, "Componentes")
  }

  // Demais → profundidade
  const depth = getSectionDepth(section)
  const availableDepths = Object.keys(styleMap.layers).map(Number).sort((a, b) => a - b)
  if (availableDepths.length === 0) return null

  const targetDepth = availableDepths.includes(depth)
    ? depth
    : availableDepths[availableDepths.length - 1]

  return styleMap.layers[targetDepth] ?? null
}

// ─── Verifica se a section tem um style imutável aplicado ────────────────────
// Inclui sections de componentes que já têm o style correto aplicado.

export function isImmutable(
  section: SectionNode,
  styleMap: ResolvedStyleMap
): boolean {
  const fillStyleId = section.fillStyleId
  if (typeof fillStyleId !== "string") return false

  // Compara apenas a parte base do ID (antes da vírgula)
  // Ex: "S:abc123,1:24" e "S:abc123,297:18" são o mesmo style
  const baseId = (id: string) => id.split(",")[0]
  const sectionBaseId = baseId(fillStyleId)

  const immutableBaseIds = Object.values(styleMap.immutable)
    .map((s) => baseId(s.id))
    .filter(Boolean)

  if (immutableBaseIds.includes(sectionBaseId)) return true

  // Se é section de componentes e já tem o style Componentes → ignorar
  if (isComponentSection(section)) {
    const componentStyle = findImmutableStyle(styleMap, "Componentes")
    if (componentStyle && sectionBaseId === baseId(componentStyle.id)) return true
  }

  return false
}