# The Economy 2.0: Microeconomics — čtečka do mobilu

Webová aplikace (PWA) s kompletním textem učebnice CORE Econ
*The Economy 2.0: Microeconomics* (<https://books.core-econ.org/the-economy/microeconomics/0-3-contents.html>),
upravená pro pohodlné učení na telefonu.

- **Text 1:1** — stejné členění na kapitoly (Units) a podkapitoly, stejné obrázky, grafy s kroky (šipkami ‹ ›),
  definice, otázky (s kontrolou odpovědí), cvičení a rozšíření (Extensions) jako v originále.
- **Vlajky vpravo nahoře** — 🇬🇧 originál / 🇨🇿 český překlad téže stránky. Přepnutí tě nechá na stejném odstavci.
- **Pamatuje si, kde jsi skončil** — po zavření a novém otevření tě hodí přesně na ten odstavec.
- **🔍 Vyhledávání** v celé knize (anglicky i česky).
- **★ Navíc** — na konci každé kapitoly (před References) samostatná, barevně odlišená stránka
  s mými doplňky: látka vysvětlená jinými slovy, řešené příklady krok za krokem, tipy a časté chyby.
  Není to součást učebnice.
- Ťuknutí na **červený pojem** v textu ukáže jeho definici z glosáře.
- Funguje **offline** (tlačítko „Stáhnout vše pro offline“ na úvodní stránce).

## Instalace do iPhonu

1. Otevři v **Safari** `https://<uživatel>.github.io/vse-aed/ekonomie/`
2. Sdílet → **Přidat na plochu**.

## Licence a český překlad

Učebnice je © CORE Economics Education 2023 pod licencí
[CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/). Ta dovoluje nekomerčně šířit
**nezměněný** originál s uvedením zdroje (to dělá tato aplikace — anglický text je beze změn, obrázky se
načítají přímo ze serveru CORE), ale **nedovoluje veřejně šířit překlady**. Český překlad je proto v repozitáři
jen zašifrovaný (AES-GCM, `data/cs/`) a odemkne se heslem, které má jen majitel — slouží výhradně
k osobnímu studiu. Doplňky ★ Navíc jsou samostatný text, ne úprava učebnice.

Aplikace není oficiálním produktem CORE Econ a CORE ji neschválil.

## Struktura

| Soubor | Účel |
|---|---|
| `index.html`, `app.js`, `style.css` | aplikace |
| `sw.js`, `manifest.webmanifest`, `icon-*.png` | offline režim a instalace na plochu |
| `data/toc.json` | obsah |
| `data/en/uNN.json` | originální text po kapitolách |
| `data/cs/uNN.json` | šifrovaný český překlad (`meta.json` = sůl a kontrola hesla) |
| `data/extra/uNN.json` | doplňky ★ Navíc |
| `tools/extract.py` | převod stažených stránek učebnice do `data/en` |
| `tools/tr.py` | příprava segmentů k překladu a šifrování překladu |
