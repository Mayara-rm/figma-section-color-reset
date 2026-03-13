"use strict";
(() => {
  // src/constants.ts
  var LIBRARY_FILE_KEY = "COLE_AQUI_O_ID_DA_BIBLIOTECA";
  var STORAGE_KEY = "styleKeyMap";
  var STYLE_NAMES = {
    PAGE: "P\xE1gina Inicial",
    LAYER_1: "Primeira camada",
    LAYER_2: "Segunda camada",
    LAYER_3: "Terceira camada",
    LAYER_4: "Quarta camada",
    LAYER_5: "Quinta camada",
    LAYER_6: "Sexta camada",
    UPDATE: "Atualiza\xE7\xF5es Recentes",
    NEW: "Novas jornadas",
    ARCHIVED: "Jornadas arquivadas",
    IN_PROGRESS: "Jornada em andamento",
    ICONS: "Icones",
    SYSTEM: "Sistema",
    COMPONENTS: "Componentes"
  };
  var PAGE_SECTION_NAMES = ["1 - Login", "2 - Home"];
  var DEPTH_STYLE_NAMES = [
    STYLE_NAMES.LAYER_1,
    STYLE_NAMES.LAYER_2,
    STYLE_NAMES.LAYER_3,
    STYLE_NAMES.LAYER_4,
    STYLE_NAMES.LAYER_5,
    STYLE_NAMES.LAYER_6
    // fallback para profundidade 6+
  ];
  var IMMUTABLE_STYLE_NAMES = [
    STYLE_NAMES.ICONS,
    STYLE_NAMES.SYSTEM,
    STYLE_NAMES.COMPONENTS
  ];

  // src/setup.ts
  function sendSetupDone(success, text, detail, styleNames) {
    figma.ui.postMessage({ type: "setup-done", success, text, detail, styleNames });
  }
  async function saveStyleKeys() {
    const styles = await figma.getLocalPaintStylesAsync();
    if (styles.length === 0) {
      sendSetupDone(
        false,
        "Nenhum style local encontrado.",
        "Abra o arquivo da biblioteca e rode o setup novamente."
      );
      return;
    }
    const keyMap = {};
    for (const style of styles) {
      const parts = style.name.split("/");
      const lastName = parts[parts.length - 1].trim();
      for (const [key, expected] of Object.entries(STYLE_NAMES)) {
        if (lastName.toLowerCase() === expected.toLowerCase()) {
          keyMap[expected] = style.key;
          console.log(`\u2705 [${key}] "${expected}" \u2192 ${style.key}`);
        }
      }
    }
    if (Object.keys(keyMap).length === 0) {
      sendSetupDone(
        false,
        "Nenhum style mapeado.",
        "Verifique se os nomes dos styles batem com o esperado."
      );
      return;
    }
    await figma.clientStorage.setAsync(STORAGE_KEY, keyMap);
    const total = Object.keys(keyMap).length;
    const expectedCount = Object.keys(STYLE_NAMES).length;
    const missing = Object.values(STYLE_NAMES).filter((n) => !keyMap[n]);
    const detail = missing.length > 0 ? `N\xE3o encontrados: ${missing.join(", ")}` : void 0;
    sendSetupDone(
      missing.length === 0,
      `${total} de ${expectedCount} styles salvos com sucesso.`,
      detail,
      Object.keys(keyMap)
    );
    figma.notify(`\u2705 Setup: ${total} de ${expectedCount} styles salvos.`);
  }

  // src/styles.ts
  async function loadStylesFromKeys() {
    const keyMap = await figma.clientStorage.getAsync(STORAGE_KEY);
    if (!keyMap || Object.keys(keyMap).length === 0) return {};
    const styleMap = {};
    for (const [styleName, key] of Object.entries(keyMap)) {
      try {
        const style = await figma.importStyleByKeyAsync(key);
        if (style) {
          styleMap[styleName] = style;
          console.log(`\u2705 Importado: "${styleName}"`);
        }
      } catch (e) {
        console.warn(`\u26A0\uFE0F Falha ao importar "${styleName}" (key: ${key})`);
      }
    }
    return styleMap;
  }
  async function discoverStylesFromFile() {
    const styleMap = {};
    const seenIds = /* @__PURE__ */ new Set();
    for (const page of figma.root.children) {
      await page.loadAsync();
      const sections = page.findAll((n) => n.type === "SECTION");
      for (const section of sections) {
        const fillStyleId = section.fillStyleId;
        if (typeof fillStyleId !== "string" || seenIds.has(fillStyleId)) continue;
        seenIds.add(fillStyleId);
        try {
          const style = await figma.getStyleByIdAsync(fillStyleId);
          if (!style) continue;
          const parts = style.name.split("/");
          const lastName = parts[parts.length - 1].trim();
          for (const [, expected] of Object.entries(STYLE_NAMES)) {
            if (lastName.toLowerCase() === expected.toLowerCase()) {
              styleMap[expected] = style;
            }
          }
        } catch (e) {
        }
      }
    }
    return styleMap;
  }
  async function getStyleMap() {
    const fromKeys = await loadStylesFromKeys();
    if (Object.keys(fromKeys).length > 0) return fromKeys;
    console.warn("Nenhuma key salva. Tentando auto-descoberta...");
    return await discoverStylesFromFile();
  }

  // src/utils.ts
  function getSections() {
    const selected = figma.currentPage.selection.filter(
      (n) => n.type === "SECTION"
    );
    if (selected.length > 0) return selected;
    return figma.currentPage.findAll((n) => n.type === "SECTION");
  }
  function getSectionDepth(section) {
    let depth = 1;
    let parent = section.parent;
    while (parent) {
      if (parent.type === "SECTION") depth++;
      parent = parent.parent;
    }
    return depth;
  }
  function isPageSection(section) {
    return PAGE_SECTION_NAMES.includes(section.name.trim());
  }
  function resolveExpectedStyle(section, styleMap) {
    var _a, _b;
    if (isPageSection(section)) {
      return (_a = styleMap[STYLE_NAMES.PAGE]) != null ? _a : null;
    }
    const depth = getSectionDepth(section);
    const index = Math.min(depth - 1, DEPTH_STYLE_NAMES.length - 1);
    return (_b = styleMap[DEPTH_STYLE_NAMES[index]]) != null ? _b : null;
  }
  function isImmutable(section, styleMap) {
    const fillStyleId = section.fillStyleId;
    if (typeof fillStyleId !== "string") return false;
    const immutableIds = IMMUTABLE_STYLE_NAMES.map((name) => {
      var _a;
      return (_a = styleMap[name]) == null ? void 0 : _a.id;
    }).filter((id) => Boolean(id));
    return immutableIds.includes(fillStyleId);
  }

  // src/reset.ts
  function sendResetDone(success, text, stats, detail) {
    figma.ui.postMessage({ type: "reset-done", success, text, stats, detail });
  }
  async function resetSectionColors() {
    if (figma.fileKey === LIBRARY_FILE_KEY) {
      sendResetDone(
        false,
        "Reset bloqueado na biblioteca.",
        void 0,
        "O reset n\xE3o pode ser executado no arquivo da biblioteca. Abra um arquivo de projeto."
      );
      figma.notify("\u26D4 Reset bloqueado \u2014 abra um arquivo de projeto.", { error: true });
      return;
    }
    const styleMap = await getStyleMap();
    if (Object.keys(styleMap).length === 0) {
      sendResetDone(
        false,
        "Nenhum style encontrado.",
        void 0,
        "Rode o Setup no arquivo da biblioteca primeiro."
      );
      figma.notify("\u274C Rode o Setup na biblioteca primeiro.", { error: true });
      return;
    }
    const missing = Object.values(STYLE_NAMES).filter((n) => !styleMap[n]);
    if (missing.length > 0) {
      console.warn("\u26A0\uFE0F Styles n\xE3o encontrados:", missing.join(", "));
    }
    const sections = getSections();
    console.log("Total de sections:", sections.length);
    let updated = 0, ignored = 0, skipped = 0;
    for (const section of sections) {
      if (isImmutable(section, styleMap)) {
        ignored++;
        continue;
      }
      const expected = resolveExpectedStyle(section, styleMap);
      if (!expected) {
        skipped++;
        continue;
      }
      if (section.fillStyleId !== expected.id) {
        await section.setFillStyleIdAsync(expected.id);
        updated++;
        console.log(`\u2705 "${section.name}" \u2192 "${expected.name}"`);
      }
    }
    const stats = { updated, ignored, skipped };
    const detail = missing.length > 0 ? `Styles n\xE3o encontrados: ${missing.join(", ")}` : void 0;
    sendResetDone(
      true,
      `${updated} atualizadas \xB7 ${ignored} ignoradas \xB7 ${skipped} sem style`,
      stats,
      detail
    );
    figma.notify(`\u2705 ${updated} atualizadas | \u{1F512} ${ignored} ignoradas`);
  }

  // src/code.ts
  figma.showUI(__html__, {
    width: 280,
    height: 620,
    title: "Section Color Reset",
    themeColors: true
  });
  figma.ui.onmessage = async (msg) => {
    try {
      if (msg.type === "check-setup") {
        const keyMap = await figma.clientStorage.getAsync(STORAGE_KEY);
        const done = keyMap && Object.keys(keyMap).length > 0;
        figma.ui.postMessage({ type: "setup-status", done: !!done });
        return;
      }
      if (msg.type === "resize" && msg.height) {
        figma.ui.resize(280, Math.min(Math.max(msg.height, 300), 900));
        return;
      }
      if (msg.type === "setup") {
        await saveStyleKeys();
        return;
      }
      if (msg.type === "reset") {
        await resetSectionColors();
        return;
      }
    } catch (error) {
      console.error(error);
      figma.ui.postMessage({
        type: msg.type === "setup" ? "setup-done" : "reset-done",
        success: false,
        text: "Erro inesperado. Veja o console para detalhes."
      });
      figma.notify("\u274C Erro ao executar plugin", { error: true });
    }
  };
})();
