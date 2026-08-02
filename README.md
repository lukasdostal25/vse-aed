# Studijní portál — VŠE, Analýza ekonomických dat, 1. ročník

Interaktivní příprava na všech šest povinných předmětů zimního semestru 2026/2027:
matematika (4MM110), Principles of Economics (4ES104), statistika (4ST102),
demografie (4DM201), programování v R (4ST110) a řešení problémů (44F102).

95 lekcí · 1214 testových otázek · blokové testy s časomírou · závěrečné zkoušky ·
taháky, studijní plány a přehledy nejčastějších chyb.

---

## Jak to zprovoznit na vlastní adrese (zdarma, přes GitHub Pages)

**1. Založ si účet na GitHubu**
Jdi na <https://github.com/signup> a zaregistruj se. Je to zdarma.

**2. Vytvoř repozitář**
Vpravo nahoře **+** → **New repository**.
- *Repository name*: `vse-aed`
- Zvol **Public** — GitHub Pages jsou zdarma jen pro veřejné repozitáře.
- Klikni **Create repository**.

**3. Nahraj soubory**
Na stránce repozitáře klikni na odkaz **uploading an existing file**
(nebo *Add file → Upload files*).
Otevři rozbalenou složku a přetáhni do prohlížeče **obsah** složky — tedy soubory
`index.html`, `sw.js`, `manifest.webmanifest`, `icon-*.png`, `README.md`
a **složku `data`**. Ne celou složku `web`, ale to, co je uvnitř.
Dole klikni **Commit changes**.

**4. Zapni Pages**
V repozitáři: **Settings** → v levém sloupci **Pages** →
*Source*: **Deploy from a branch** → *Branch*: `main`, složka `/ (root)` → **Save**.

**5. Počkej 1–2 minuty**
Stránka se objeví na adrese:

```
https://TVOJE-JMENO.github.io/vse-aed/
```

(`TVOJE-JMENO` = tvoje uživatelské jméno na GitHubu)

---

## Jak si to přidat na plochu iPhonu

1. Otevři adresu v **Safari** (musí to být Safari, ne Chrome).
2. Ťukni na ikonu **Sdílet** (čtvereček se šipkou nahoru).
3. Sjeď dolů a vyber **Přidat na plochu**.
4. Potvrď **Přidat**.

Na ploše se objeví ikona **VŠE AED**. Po ťuknutí se portál otevře na celou
obrazovku bez adresního řádku — chová se jako aplikace.

**Android:** otevři adresu v Chrome → menu (⋮) → *Přidat na plochu* / *Instalovat aplikaci*.

---

## Offline režim

Každý předmět se uloží do telefonu, jakmile ho poprvé otevřeš.
Na úvodní stránce je navíc tlačítko **⬇ Stáhnout vše pro offline** — stáhne
všech šest předmětů najednou (asi 6 MB) a od té chvíle portál funguje
i bez připojení, třeba v metru.

---

## Postup ve studiu

Zaškrtnuté lekce, výsledky testů a checklisty se ukládají **do prohlížeče na tom
zařízení, kde se učíš**. Mezi telefonem a notebookem se tedy nesynchronizují —
každé zařízení si vede vlastní postup. Tlačítko **↺ Reset** v levém dolním rohu
smaže postup ve všech předmětech.

---

## Aktualizace obsahu

Chceš-li něco změnit nebo přidat další předměty, nahraj nové soubory přes
*Add file → Upload files* (stejné názvy přepíšou staré). Změna se na webu
projeví do minuty. V telefonu můžeš potřebovat portál zavřít a znovu otevřít,
aby se stáhla nová verze.

---

## Co je uvnitř

| Soubor | K čemu je |
|---|---|
| `index.html` | celá aplikace — rozhraní, testovací engine, sazba matematiky (KaTeX i s písmy) |
| `data/*.json` | obsah jednotlivých předmětů, načítá se až když daný předmět otevřeš |
| `sw.js` | service worker — zajišťuje offline režim |
| `manifest.webmanifest` | údaje pro přidání na plochu (název, ikona, barvy) |
| `icon-*.png` | ikony aplikace |

Portál nepoužívá žádné externí služby ani knihovny ze sítě — všechno je
v nahraných souborech. Nic se nikam neodesílá.
