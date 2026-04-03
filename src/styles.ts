import { STORAGE_KEY, PAGE_STYLE_NAME, FOLDER_BASE, FOLDER_IMMUTABLE } from "./constants"
import { StyleKeyMap } from "./setup"

// ─── Estrutura de styles resolvidos ──────────────────────────────────────────

export interface ResolvedStyleMap {
  page:      BaseStyle | null
  layers:    Record<number, BaseStyle>   // depth → style
  states:    Record<string, BaseStyle>   // nome → style
  immutable: Record<string, BaseStyle>   // nome → style
}

// ─── Carrega styles via keys salvas (suporta team library) ────────────────────

export async function loadStylesFromKeys(): Promise<ResolvedStyleMap | null> {
  const keyMap: StyleKeyMap | null = await figma.clientStorage.getAsync(STORAGE_KEY)
  if (!keyMap) return null

  const result: ResolvedStyleMap = { page: null, layers: {}, states: {}, immutable: {} }

  // Página Inicial
  if (keyMap.page) {
    try {
      result.page = await figma.importStyleByKeyAsync(keyMap.page)
    } catch {
      console.warn("⚠️ Falha ao importar Página Inicial")
    }
  }

  // Camadas
  for (const [depthStr, key] of Object.entries(keyMap.layers)) {
    try {
      const style = await figma.importStyleByKeyAsync(key)
      if (style) result.layers[Number(depthStr)] = style
    } catch {
      console.warn(`⚠️ Falha ao importar camada ${depthStr}`)
    }
  }

  // Estados
  for (const [name, key] of Object.entries(keyMap.states)) {
    try {
      const style = await figma.importStyleByKeyAsync(key)
      if (style) result.states[name] = style
    } catch {
      console.warn(`⚠️ Falha ao importar estado "${name}"`)
    }
  }

  // Imutáveis
  for (const [name, key] of Object.entries(keyMap.immutable)) {
    try {
      const style = await figma.importStyleByKeyAsync(key)
      if (style) result.immutable[name] = style
    } catch {
      console.warn(`⚠️ Falha ao importar imutável "${name}"`)
    }
  }

  return result
}

// ─── Fallback: descobre styles via fills já aplicados nas sections ────────────
// Descobre page, immutable E layers (por nome do style).

export async function discoverStylesFromFile(): Promise<ResolvedStyleMap> {
  const result: ResolvedStyleMap = { page: null, layers: {}, states: {}, immutable: {} }
  const seenIds = new Set<string>()

  for (const page of figma.root.children) {
    await page.loadAsync()
    const sections = page.findAll((n) => n.type === "SECTION") as SectionNode[]

    for (const section of sections) {
      const fillStyleId = section.fillStyleId
      if (typeof fillStyleId !== "string" || seenIds.has(fillStyleId)) continue
      seenIds.add(fillStyleId)

      try {
        const style = await figma.getStyleByIdAsync(fillStyleId)
        if (!style) continue

        const lastName = style.name.split("/").pop()?.trim() ?? ""
        const folder = style.name.split("/").slice(-2, -1)[0]?.trim() ?? ""

        if (lastName.toLowerCase() === PAGE_STYLE_NAME.toLowerCase()) {
          result.page = style
        } else if (folder === FOLDER_IMMUTABLE) {
          result.immutable[lastName] = style
        } else if (folder === FOLDER_BASE) {
          // Tenta extrair número da camada do nome do style
          const match = lastName.match(/camada\s*(\d+)/i)
          if (match) {
            const depth = parseInt(match[1], 10)
            if (!isNaN(depth)) {
              result.layers[depth] = style
            }
          }
        }
      } catch {
        // ignorar
      }
    }
  }

  return result
}

// ─── Orquestra: tenta keys primeiro, fallback para descoberta ─────────────────

export async function getStyleMap(): Promise<ResolvedStyleMap> {
  const fromKeys = await loadStylesFromKeys()
  if (fromKeys && (fromKeys.page || Object.keys(fromKeys.layers).length > 0)) {
    return fromKeys
  }

  console.warn("Nenhuma key salva. Tentando auto-descoberta...")
  return await discoverStylesFromFile()
}