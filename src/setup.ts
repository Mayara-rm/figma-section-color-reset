import { STORAGE_KEY, STYLE_NAMES } from "./constants"

// ─── Envia resultado do setup para a UI ──────────────────────────────────────

export function sendSetupDone(
  success: boolean,
  text: string,
  detail?: string,
  styleNames?: string[]
): void {
  figma.ui.postMessage({ type: "setup-done", success, text, detail, styleNames })
}

// ─── Salva as keys dos styles locais no clientStorage ────────────────────────
// Deve ser executado no arquivo da BIBLIOTECA onde os styles foram criados.

export async function saveStyleKeys(): Promise<void> {
  const styles = await figma.getLocalPaintStylesAsync()

  if (styles.length === 0) {
    sendSetupDone(
      false,
      "Nenhum style local encontrado.",
      "Abra o arquivo da biblioteca e rode o setup novamente."
    )
    return
  }

  const keyMap: Record<string, string> = {}

  for (const style of styles) {
    const parts = style.name.split("/")
    const lastName = parts[parts.length - 1].trim()

    for (const [key, expected] of Object.entries(STYLE_NAMES)) {
      if (lastName.toLowerCase() === expected.toLowerCase()) {
        keyMap[expected] = style.key
        console.log(`✅ [${key}] "${expected}" → ${style.key}`)
      }
    }
  }

  if (Object.keys(keyMap).length === 0) {
    sendSetupDone(
      false,
      "Nenhum style mapeado.",
      "Verifique se os nomes dos styles batem com o esperado."
    )
    return
  }

  await figma.clientStorage.setAsync(STORAGE_KEY, keyMap)

  const total = Object.keys(keyMap).length
  const expectedCount = Object.keys(STYLE_NAMES).length
  const missing = Object.values(STYLE_NAMES).filter((n) => !keyMap[n])
  const detail = missing.length > 0 ? `Não encontrados: ${missing.join(", ")}` : undefined

  sendSetupDone(
    missing.length === 0,
    `${total} de ${expectedCount} styles salvos com sucesso.`,
    detail,
    Object.keys(keyMap)
  )

  figma.notify(`✅ Setup: ${total} de ${expectedCount} styles salvos.`)
}