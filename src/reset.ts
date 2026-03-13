import { LIBRARY_FILE_KEY, STYLE_NAMES } from "./constants"
import { getStyleMap } from "./styles"
import { getSections, isImmutable, resolveExpectedStyle } from "./utils"

// ─── Envia resultado do reset para a UI ──────────────────────────────────────

export function sendResetDone(
  success: boolean,
  text: string,
  stats?: { updated: number; ignored: number; skipped: number },
  detail?: string
): void {
  figma.ui.postMessage({ type: "reset-done", success, text, stats, detail })
}

// ─── Aplica os styles corretos em todas as sections da página ─────────────────
// Nota: A API do Figma não expõe "strokes" para SectionNode —
// não é possível remover strokes de sections até que o Figma implemente esse suporte.

export async function resetSectionColors(): Promise<void> {

  // Bloqueia reset no arquivo da biblioteca
  if (figma.fileKey === LIBRARY_FILE_KEY) {
    sendResetDone(
      false,
      "Reset bloqueado na biblioteca.",
      undefined,
      "O reset não pode ser executado no arquivo da biblioteca. Abra um arquivo de projeto."
    )
    figma.notify("⛔ Reset bloqueado — abra um arquivo de projeto.", { error: true })
    return
  }

  const styleMap = await getStyleMap()

  if (Object.keys(styleMap).length === 0) {
    sendResetDone(
      false,
      "Nenhum style encontrado.",
      undefined,
      "Rode o Setup no arquivo da biblioteca primeiro."
    )
    figma.notify("❌ Rode o Setup na biblioteca primeiro.", { error: true })
    return
  }

  const missing = Object.values(STYLE_NAMES).filter((n) => !styleMap[n])
  if (missing.length > 0) {
    console.warn("⚠️ Styles não encontrados:", missing.join(", "))
  }

  const sections = getSections()
  console.log("Total de sections:", sections.length)

  let updated = 0, ignored = 0, skipped = 0

  for (const section of sections) {
    if (isImmutable(section, styleMap)) {
      ignored++
      continue
    }

    const expected = resolveExpectedStyle(section, styleMap)

    if (!expected) {
      skipped++
      continue
    }

    if (section.fillStyleId !== expected.id) {
      await section.setFillStyleIdAsync(expected.id)
      updated++
      console.log(`✅ "${section.name}" → "${expected.name}"`)
    }
  }

  const stats = { updated, ignored, skipped }
  const detail = missing.length > 0
    ? `Styles não encontrados: ${missing.join(", ")}`
    : undefined

  sendResetDone(
    true,
    `${updated} atualizadas · ${ignored} ignoradas · ${skipped} sem style`,
    stats,
    detail
  )

  figma.notify(`✅ ${updated} atualizadas | 🔒 ${ignored} ignoradas`)
}