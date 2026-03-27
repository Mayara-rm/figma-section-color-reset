# ColorStack — Figma Plugin

> Automatize a aplicação de estilos de cor em sections do Figma com base em hierarquia e nomenclatura.

![Plugin](https://img.shields.io/badge/Figma-Plugin-764ba2?style=flat-square&logo=figma&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript&logoColor=white)
![esbuild](https://img.shields.io/badge/esbuild-bundler-ffcf00?style=flat-square)

---

## Sobre o projeto

**ColorStack** é um plugin para Figma desenvolvido para automatizar a aplicação de estilos de cor em sections, garantindo consistência visual em projetos que utilizam hierarquia de sections estruturada. Com ele, não é mais necessário aplicar cores manualmente — o plugin identifica cada section e aplica o estilo correto automaticamente com base nas regras definidas na biblioteca.

---

## Como funciona

O plugin funciona em duas etapas simples:

### ⚙️ Setup — uma vez por máquina

Abra o arquivo da biblioteca de cores e execute o setup. O plugin varre automaticamente todos os estilos locais, os classifica por tipo e salva as referências localmente. A partir daí, o plugin estará pronto para uso em qualquer projeto conectado à biblioteca.

### 🎨 Reset — uso diário

Em qualquer arquivo de projeto, clique em **"Resetar cores"** para que o plugin aplique automaticamente o estilo correto em cada section da página com base nas regras definidas.

---

## Regras de aplicação

| Condição | Comportamento |
|---|---|
| Section nomeada `"1 - Login"` ou `"2 - Home"` | Recebe a cor de **Página Inicial** |
| Section nomeada `"Componente"` ou `"Componentes"` | Recebe o estilo de **Componentes** |
| Demais sections | Recebe a cor da **camada correspondente à profundidade** na hierarquia |
| Sections com estilos imutáveis já aplicados | São **ignoradas** pelo reset |

> Sections com os estilos **Icones**, **Sistema** e **Componentes** aplicados são consideradas imutáveis e nunca são alteradas pelo plugin.

---

## Organização da biblioteca

O plugin identifica os estilos automaticamente com base na organização por folders na biblioteca:

```
Paleta - Organização por sessões/
├── Cores Base/
│   ├── Página Inicial
│   ├── Camada 1
│   ├── Camada 2
│   └── Camada N        ← novas camadas detectadas automaticamente
├── Cores de Identificação/
│   ├── Icones          ← imutável
│   ├── Sistema         ← imutável
│   └── Componentes     ← imutável
└── Cores de Estado/
    └── ...             ← uso futuro
```

---

## Retroalimentação automática

O plugin foi projetado para se adaptar automaticamente a mudanças na biblioteca. Ao adicionar uma nova camada de cor (ex: `Camada 7`) dentro do folder **Cores Base**, basta re-executar o setup para que o plugin passe a reconhecê-la e aplicá-la corretamente — **sem necessidade de alteração no código**.

---

## Interface

A interface foi desenvolvida com foco em clareza e minimalismo:

- 🌙 Tema escuro com acentos em roxo
- 📊 Barra de progresso em tempo real durante o processamento
- 📋 Histórico de ações executadas com timestamp
- ✅ Indicação de status do setup por máquina
- 📈 Contadores de sections atualizadas, ignoradas e sem style

---

## Estrutura do projeto

```
src/
├── code.ts          ← entry point do plugin
├── constants.ts     ← configurações e constantes
├── setup.ts         ← lógica de setup e salvamento de keys
├── reset.ts         ← lógica de reset de cores
├── styles.ts        ← carregamento de styles da biblioteca
├── utils.ts         ← funções utilitárias de section
└── ui.html          ← interface do plugin
```

---

## Como rodar localmente

```bash
# Instalar dependências
npm install

# Compilar o plugin
npm run build

# Modo watch (recompila automaticamente ao salvar)
npm run watch
```

Após compilar, importe o plugin no Figma via **Plugins → Development → Import plugin from manifest** apontando para o arquivo `manifest.json`.

---

## Tecnologias

- [TypeScript](https://www.typescriptlang.org/)
- [Figma Plugin API](https://www.figma.com/plugin-docs/)
- [esbuild](https://esbuild.github.io/)

---

Desenvolvido por **Mayara Moraes e Luiz D'urso · UOTZ**