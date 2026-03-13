import { STORAGE_KEY, STYLE_NAMES } from "./constants"

// ─── Carrega styles via keys salvas no clientStorage ─────────────────────────
// Funciona com team library pois usa importStyleByKeyAsync.

export async function loadStylesFromKeys(): Promise<Record<string, BaseStyle>> {
  const keyMap: Record<string, string> | null =
    await figma.clientStorage.getAsync(STORAGE_KEY)

  if (!keyMap || Object.keys(keyMap).length === 0) return {}

  const styleMap: Record<string, BaseStyle> = {}

  for (const [styleName, key] of Object.entries(keyMap)) {
    try {
      const style = await figma.importStyleByKeyAsync(key)
      if (style) {
        styleMap[styleName] = style
        console.log(`✅ Importado: "${styleName}"`)
      }
    } catch {
      console.warn(`⚠️ Falha ao importar "${styleName}" (key: ${key})`)
    }
  }

  return styleMap
}

// ─── Fallback: descobre styles via fills já aplicados nas sections ────────────
// Útil quando as keys não estão salvas mas os styles já foram usados no arquivo.

export async function discoverStylesFromFile(): Promise<Record<string, BaseStyle>> {
  const styleMap: Record<string, BaseStyle> = {}
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

        const parts = style.name.split("/")
        const lastName = parts[parts.length - 1].trim()

        for (const [, expected] of Object.entries(STYLE_NAMES)) {
          if (lastName.toLowerCase() === expected.toLowerCase()) {
            styleMap[expected] = style
          }
        }
      } catch {
        // ignorar erros de style não encontrado
      }
    }
  }

  return styleMap
}

// ─── Orquestra: tenta keys primeiro, fallback para descoberta ─────────────────

export async function getStyleMap(): Promise<Record<string, BaseStyle>> {
  const fromKeys = await loadStylesFromKeys()
  if (Object.keys(fromKeys).length > 0) return fromKeys

  console.warn("Nenhuma key salva. Tentando auto-descoberta...")
  return await discoverStylesFromFile()
}