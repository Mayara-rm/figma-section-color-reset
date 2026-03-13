// ─── ID do arquivo da biblioteca (extraído da URL do Figma) ──────────────────
// Formato da URL: figma.com/file/XXXXXXXXXXXXXX/nome-do-arquivo
// Substitua pela ID real do seu arquivo de biblioteca.

export const LIBRARY_FILE_KEY = "COLE_AQUI_O_ID_DA_BIBLIOTECA"

// ─── Chave de armazenamento local ────────────────────────────────────────────

export const STORAGE_KEY = "styleKeyMap"

// ─── Nomes dos styles (parte após a última "/") ───────────────────────────────

export const STYLE_NAMES = {
  PAGE:        "Página Inicial",

  LAYER_1:     "Primeira camada",
  LAYER_2:     "Segunda camada",
  LAYER_3:     "Terceira camada",
  LAYER_4:     "Quarta camada",
  LAYER_5:     "Quinta camada",
  LAYER_6:     "Sexta camada",

  UPDATE:      "Atualizações Recentes",
  NEW:         "Novas jornadas",
  ARCHIVED:    "Jornadas arquivadas",
  IN_PROGRESS: "Jornada em andamento",

  ICONS:       "Icones",
  SYSTEM:      "Sistema",
  COMPONENTS:  "Componentes",
}

// ─── Sections com nome exato que recebem a cor de Página Inicial ──────────────

export const PAGE_SECTION_NAMES = ["1 - Login", "2 - Home"]

// ─── Ordem de profundidade → style ───────────────────────────────────────────

export const DEPTH_STYLE_NAMES = [
  STYLE_NAMES.LAYER_1,
  STYLE_NAMES.LAYER_2,
  STYLE_NAMES.LAYER_3,
  STYLE_NAMES.LAYER_4,
  STYLE_NAMES.LAYER_5,
  STYLE_NAMES.LAYER_6, // fallback para profundidade 6+
]

// ─── Styles que o plugin nunca deve alterar ───────────────────────────────────

export const IMMUTABLE_STYLE_NAMES = [
  STYLE_NAMES.ICONS,
  STYLE_NAMES.SYSTEM,
  STYLE_NAMES.COMPONENTS,
]