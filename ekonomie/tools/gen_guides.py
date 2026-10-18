"""Step-by-step Czech-Excel guides, goal boxes and workbook buttons for the seminar decks.
Adds keys to decks/s01.parts.json and decks/s02.parts.json (run after gen_s01.py / gen_s02.py)."""
import sys, json
sys.path.insert(0, '/home/user/vse-aed/ekonomie/tools')
from xlui import ribbon, menu, swatches, charts_gallery, dialog, chart_plus, pane, keys, step, guide, goal, wb_buttons
from xlviz import sheet

S = sys.argv[1]
p1, p2 = S + '/decks/s01.parts.json', S + '/decks/s02.parts.json'
P1, P2 = json.load(open(p1)), json.load(open(p2))
RNG = '#cfe8d8'  # selected range in the mock sheets

def sel(rows, r0, c0, r1, c1):
    return {(r, c): RNG for r in range(r0, r1 + 1) for c in range(c0, c1 + 1)}

# ---------- reusable ribbon pieces ----------
GR_CHARTS = ('Grafy', [('Doporučené\ngrafy', '📊'), ('Spojnicový\nnebo plošný', '📈'), ('Bodový (XY)\nnebo bublinový', '⁘')])
GR_TABLES = ('Tabulky', [('Kontingenční\ntabulka', '▦')])
GR_STYLES = ('Styly', [('Podmíněné\nformátování', '🎨'), ('Formátovat\njako tabulku', '▤')])
GR_NUMBER = ('Číslo', [('Styl\nprocent', '%'), ('Přidat\ndes. místo', '⁺⁰'), ('Odebrat\ndes. místo', '⁻⁰')])
GR_CLIP = ('Schránka', [('Vložit', '📋'), ('Kopírovat\nformát', '🖌')])
CHART_CTX = ('Návrh grafu', 'Formát')
GR_CDESIGN = ('Rozložení / Data', [('Přidat prvek\ngrafu', '➕'), ('Přepnout\nřádek/sloupec', '⇄'), ('Vybrat\ndata', '▥')])
LINE_GAL = [('2D spojnicový', [('Spojnicový', 'line'), ('Spojnicový se značkami', 'markers')]), ('2D plošný', [('Plošný', 'area')])]
SCAT_GAL = [('Bodový', [('Bodový', 'scatter'), ('Bodový s rovnými spojnicemi', 'line')])]
CF_MENU = [('🟥', 'Pravidla zvýraznění buněk'), ('🔟', 'Pravidla pro nejvyšší či nejnižší hodnoty'), ('▬', 'Datové pruhy'),
           ('🌈', 'Barevné škály'), ('⚑', 'Sady ikon'), ('—', ''), ('＋', 'Nové pravidlo…'), ('✖', 'Vymazat pravidla'), ('⚙', 'Spravovat pravidla…')]
SCALES = [('Barevná škála zelená – žlutá – červená', ['#63be7b', '#ffeb84', '#f8696b']),
          ('Barevná škála červená – žlutá – zelená', ['#f8696b', '#ffeb84', '#63be7b']),
          ('Barevná škála zelená – bílá – červená', ['#63be7b', '#fcfcff', '#f8696b']),
          ('Barevná škála červená – bílá – zelená', ['#f8696b', '#fcfcff', '#63be7b']),
          ('Barevná škála modrá – bílá – červená', ['#5a8ac6', '#fcfcff', '#f8696b']),
          ('Barevná škála bílá – červená', ['#fcfcff', '#f8696b'])]

def fill_handle_note():
    return ('<p>V pravém dolním rohu označené buňky je malý čtvereček – <b>úchyt pro vyplnění</b>. Najeď na něj (kurzor se změní na tenký černý křížek ✚) '
            'a <b>dvakrát klikni</b>. Excel vzorec sám zkopíruje dolů až k poslednímu řádku, kde má sousední sloupec data.</p>')

# ======================================================================================
# Cvičení 1 (s01)
# ======================================================================================
indpro_rows = [['date', 'INDPRO'], ['01.01.1960', '23,8129'], ['01.02.1960', '23,9473'], ['01.03.1960', '23,8935'], ['…', '…'], ['01.12.2024', '102,5835']]

P1['WB_INDPRO'] = wb_buttons(('s01', 'dta1_indpro', 'Celý soubor dta1_indpro.xlsx (zadání)'), ('s01', 'dta1_indpro_solved', 'Vyřešený soubor (řešení vyučujícího)'))
P1['GOAL_INDPRO'] = goal(
    'Seznámit se s daty dřív, než s nimi začneme cokoli dělat: co je v řádcích, co ve sloupcích, v jakých jednotkách a odkud kam data sahají.',
    'Zatím nic – jen čteme. Všimni si, že index je <b>relativní</b> (2017 = 100), takže dává smysl jen poměry a tempa růstu.',
    vysledek='Víš, že List1 má 780 měsíčních pozorování (A3:B782) a List2 má stejná data přeskládaná do tabulky rok × měsíc.')

P1['GOAL_LEVEL'] = goal(
    'Uvidět celý vývoj průmyslové výroby USA 1960–2024 najednou a najít, kde jsou velké propady.',
    'Nic nepočítáme – kreslíme surová data (úroveň indexu). Tím zjistíme dlouhodobý <b>trend</b> a zhruba, kde jsou <b>krize</b>.',
    '<b>Spojnicový graf</b>: data jsou časová řada se stejnými rozestupy (měsíce), čára zdůrazní plynulý vývoj a zlomy. Sloupcový graf by měl 780 sloupců a bodový by rozbil návaznost v čase.',
    'Jednu dlouhou rostoucí čáru s viditelnými zuby v letech 1974–75, 1980–82, 2008–09 a 2020.')
P1['GUIDE_LEVEL'] = guide('Spojnicový graf úrovně indexu (List1)', [
    step(1, 'Otevři List1', '<p>Dole pod tabulkou klikni na záložku <b>List1</b>. Data jsou ve sloupcích A (datum) a B (index), hlavička je v řádku 2.</p>' +
         sheet(indpro_rows, start_row=2, sheet_name='List1', colors=sel(indpro_rows, 0, 0, 0, 1)),
         'Hlavičku (řádek 2) označíme taky – Excel z ní vezme název řady „INDPRO“ do legendy.'),
    step(2, 'Označ A2:B782', '<p>Klikni do buňky <b>A2</b>, podrž ' + keys('Ctrl', 'Shift') + ' a stiskni ' + keys('→') + ' a pak ' + keys('↓') +
         '. Označí se celý blok až do posledního řádku 782.</p><p>Jiná cesta: do <b>Pole názvů</b> (bílé okénko vlevo nad sloupcem A) napiš <code>A2:B782</code> a dej ' + keys('Enter') + '.</p>' +
         sheet(indpro_rows, start_row=2, sheet_name='List1', colors=sel(indpro_rows, 0, 0, 5, 1)),
         'Tažení myší přes 780 řádků je pomalé a snadno se netrefíš; klávesová zkratka skočí přesně na konec dat.'),
    step(3, 'Karta Vložení → Spojnicový nebo plošný graf', '<p>Nahoře klikni na kartu <b>Vložení</b>, ve skupině <b>Grafy</b> klikni na ikonu se zalomenou čárou – popisek po najetí je <b>„Vložit spojnicový nebo plošný graf“</b>.</p>' +
         ribbon('Vložení', [GR_TABLES, GR_CHARTS], hi='Spojnicový nebo plošný')),
    step(4, 'Vyber „Spojnicový“', '<p>V rozbalené nabídce v části <b>2D spojnicový</b> klikni na první ikonu <b>Spojnicový</b>.</p>' + charts_gallery(LINE_GAL, hi='Spojnicový'),
         'Varianta se značkami by u 780 bodů udělala z čáry „housenku“; čistá čára je čitelnější.'),
    step(5, 'Pojmenuj graf', '<p>Klikni jednou na nadpis grafu (nahoře v grafu je „INDPRO“), pak do něj ještě jednou a přepiš ho na <b>U.S. Industrial Production, 1960–2024</b>.</p>'
         '<p>Pokud graf nemá nadpis: označ graf → karta <b>Návrh grafu</b> → <b>Přidat prvek grafu</b> → <b>Název grafu</b> → <b>Nad grafem</b>.</p>' +
         ribbon('Návrh grafu', [GR_CDESIGN], hi='Přidat prvek grafu', ctx=CHART_CTX)),
    step(6, 'Výsledek a kontrola', '<p>Takhle má graf vypadat (červené pruhy jsou recese – ty v Excelu nebudou, přidal jsem je pro orientaci):</p>' + P1['INDPRO_LEVEL'] +
         '<p><b>Kontrola:</b> čára začíná kolem 24, končí kolem 102 a nejhlubší krátký propad je v dubnu 2020. Pokud máš na vodorovné ose čísla 1, 2, 3… místo let, neoznačil(a) jsi sloupec A – oprav přes <b>Návrh grafu → Vybrat data</b>.</p>'),
])

yoy_rows = [['date', 'INDPRO', 'YoY growth'], ['01.01.1960', '23,8129', ''], ['…', '…', ''], ['01.12.1960', '21,6627', ''], ['01.01.1961', '21,5466', '-9,5 %'], ['01.02.1961', '21,6003', '-9,8 %']]
P1['GOAL_YOY'] = goal(
    'Převést úroveň indexu na <b>meziroční tempo růstu</b>, aby byly krize vidět jako poklesy pod nulu.',
    'Pro každý měsíc: <code>(nová − stará) / stará</code>, kde „stará“ je stejný měsíc o rok dřív. V Excelu kompaktně <code>=B15/B3-1</code>. '
    'Meziročně (a ne meziměsíčně) proto, že tím zmizí <b>sezónnost</b> – každý měsíc porovnáváme se stejným měsícem.',
    vysledek='Sloupec C s procenty od řádku 15 (leden 1961) do řádku 782; kontrola: duben 2020 (C726) ≈ −17,8 %.')
P1['GUIDE_YOY'] = guide('Meziroční růst ve sloupci C', [
    step(1, 'Hlavička sloupce C', '<p>Klikni do <b>C2</b> a napiš <code>YoY growth</code> (nebo česky „meziroční růst“), potvrď ' + keys('Enter') + '.</p>',
         'Hlavička se pak v grafu objeví jako název řady.'),
    step(2, 'První vzorec do C15', '<p>Klikni do <b>C15</b> (leden 1961) a napiš:</p><p><code>=B15/B3-1</code></p><p>Potvrď ' + keys('Enter') + '.</p>' +
         sheet(yoy_rows, start_row=2, sheet_name='List1', formula=('C15', '=B15/B3-1'), sel=(4, 2)),
         'B3 je leden 1960 – přesně o 12 řádků (12 měsíců) výš. Pro řádky 3–14 (rok 1960) žádný předchozí rok nemáme, proto začínáme až v řádku 15.'),
    step(3, 'Naformátuj jako procenta', '<p>Nech označenou C15 a na kartě <b>Domů</b> ve skupině <b>Číslo</b> klikni na <b>%</b> (Styl procent). Pak jednou na <b>Přidat desetinné místo</b>.</p>' +
         ribbon('Domů', [GR_CLIP, GR_NUMBER], hi='Styl procent'),
         'Vzorec vrací desetinné číslo (−0,095); procentní formát ho jen zobrazí jako −9,5 %. Hodnota se nemění.'),
    step(4, 'Zkopíruj vzorec dolů', fill_handle_note() + '<p>Klikni do <b>C16</b> – ve vzorcovém řádku musí být <code>=B16/B4-1</code>. Excel posunul oba odkazy o řádek dolů (<b>relativní odkazy</b>).</p>',
         'Kdyby ve vzorci byl znak $ (např. B$3), dělil(a) bys všechno pořád lednem 1960 – a dostal(a) bys růst od roku 1960, ne meziroční.'),
    step(5, 'Kontrola výsledku', '<p>Skoč do <b>C726</b> (duben 2020): přes Pole názvů napiš <code>C726</code> a ' + keys('Enter') + '. Má tam být zhruba <b>−17,8 %</b>.</p>'
         '<p>' + P1['APR2020'] + '</p>'),
])
P1['GOAL_YOYCHART'] = goal(
    'Nakreslit tempo růstu v čase, aby byly krize vidět jako ponory pod nulu a dalo se porovnat, jak byly hluboké.',
    'Nic nového nepočítáme – vykreslíme sloupec C proti datu ve sloupci A.',
    '<b>Spojnicový</b> – stále jde o časovou řadu. Nulová čára je teď důležitá: nad ní výroba roste, pod ní klesá.',
    'Čáru kmitající kolem 0 % s nejhlubšími ponory v roce 2009 a 2020.')
P1['GUIDE_YOYCHART'] = guide('Graf meziročního růstu', [
    step(1, 'Označ dva nesousedící sloupce', '<p>Označ <b>A2:A782</b> (klikni do A2, ' + keys('Ctrl', 'Shift', '↓') + '). Pak <b>podrž</b> ' + keys('Ctrl') +
         ' a myší označ <b>C2:C782</b> (nebo klikni do C2 a s držením Ctrl a Shift stiskni ↓).</p>',
         'Sloupec B (úroveň) do grafu nechceme – míchal by dvě úplně jiné škály (index ~100 a procenta ~0,1).'),
    step(2, 'Vložení → Spojnicový', '<p>Stejně jako u prvního grafu: <b>Vložení → Vložit spojnicový nebo plošný graf → Spojnicový</b>.</p>' + ribbon('Vložení', [GR_TABLES, GR_CHARTS], hi='Spojnicový nebo plošný')),
    step(3, 'Popisky osy x dolů', '<p>Popisky let se teď kreslí u nulové čáry doprostřed grafu. Klikni pravým tlačítkem na popisky vodorovné osy → <b>Formát osy…</b> → <b>Popisky</b> → <b>Pozice popisku</b>: <b>Nízká</b>.</p>' +
         pane('Formát osy', [('head', 'Popisky', None), ('field', 'Pozice popisku', 'Nízká')], hi='Pozice popisku'),
         'Při záporných hodnotách by popisky překrývaly čáru; „Nízká“ je posune ke spodnímu okraji grafu.'),
    step(4, 'Výsledek', P1['YOY_CHART'] + '<p>Pod nulou = výroba je nižší než před rokem. Nejhlubší: duben 2020 a jaro 2009.</p>'),
])

cf_rows = [['Year', 'Jan', 'Feb', 'Mar', '…', 'Dec'], ['1960', '23,8', '23,9', '23,9', '…', '21,7'], ['1961', '21,5', '21,6', '21,9', '…', '24,5'], ['…', '…', '…', '…', '…', '…'], ['2024', '101,7', '102,7', '102,7', '…', '102,6']]
P1['GOAL_CF'] = goal(
    'Uvidět strukturu celé tabulky (65 let × 12 měsíců) <b>barvami</b> ještě před kreslením grafu: kde je výroba nízko a kde vysoko.',
    'Nic nepočítáme. Podmíněné formátování obarví každou buňku podle toho, kde leží mezi minimem a maximem <b>označené oblasti</b> (min = červená, střed = žlutá, max = zelená).',
    vysledek='Tabulku, která je nahoře (60. léta) červená a dole (2010–2024) zelená – barvy ukazují dlouhodobý růst.')
P1['GUIDE_CF'] = guide('Barevná škála přes celou tabulku (List2)', [
    step(1, 'Označ jen hodnoty: B4:M68', '<p>Přepni na <b>List2</b>. Klikni do <b>B4</b> (leden 1960) a s ' + keys('Ctrl', 'Shift') + ' stiskni ' + keys('→') + ' a ' + keys('↓') + '. Označí se B4:M68.</p>' +
         sheet(cf_rows, start_row=3, sheet_name='List2', colors=sel(cf_rows, 1, 1, 4, 5)),
         'Sloupec A (roky 1960–2024) do výběru nepatří – čísla kolem 2000 by se stala „maximem“ a všechny hodnoty indexu by vyšly červeně.'),
    step(2, 'Domů → Podmíněné formátování', '<p>Na kartě <b>Domů</b> ve skupině <b>Styly</b> klikni na <b>Podmíněné formátování</b>.</p>' + ribbon('Domů', [GR_NUMBER, GR_STYLES], hi='Podmíněné formátování')),
    step(3, 'Barevné škály', '<p>V nabídce najeď na <b>Barevné škály</b>.</p>' + menu(CF_MENU, hi='Barevné škály')),
    step(4, 'Zelená – žlutá – červená', '<p>Klikni na <b>první</b> čtvereček: <b>zelená nahoře, červená dole</b>. Excel ho popisuje jako „Barevná škála zelená – žlutá – červená“: <b>nejvyšší hodnoty zeleně</b>, nejnižší červeně.</p>' +
         swatches(SCALES, hi=SCALES[0][0]),
         'Pro výrobu je „víc = lepší“, takže zelená pro vysoké hodnoty je intuitivní. U nezaměstnanosti bys volil(a) obrácenou škálu.'),
    step(5, 'Výsledek', P1['CF_ALL'] + '<p>Barva se mění hlavně shora dolů = dlouhodobý trend. Krize skoro nejsou vidět, protože se každý měsíc srovnává se všemi 65 lety.</p>'),
])
P1['GOAL_CFROW'] = goal(
    'Vidět průběh <b>uvnitř každého roku</b> – kdy v roce začal propad, kdy se výroba vrátila.',
    'Stejné barvy, ale každý řádek (rok) má <b>vlastní</b> minimum a maximum. Data se nemění, mění se jen pravidlo porovnání.',
    vysledek='V roce 2008 zelený začátek a červený konec, v roce 2009 červené jaro, v roce 2020 tmavě červený duben a květen. Ve vyřešeném souboru je to list „By rows“ s 66 samostatnými pravidly.')
P1['GUIDE_CFROW'] = guide('Barevná škála zvlášť pro každý řádek', [
    step(1, 'Pravidlo pro první řádek', '<p>Označ jen <b>B4:M4</b> (rok 1960) a nastav barevnou škálu přesně jako v minulém návodu: <b>Domů → Podmíněné formátování → Barevné škály → zelená – žlutá – červená</b>.</p>' +
         sheet(cf_rows, start_row=3, sheet_name='List2', colors=sel(cf_rows, 1, 1, 1, 5))),
    step(2, 'Kopírovat formát (štěteček)', '<p>Nech označené B4:M4 a na kartě <b>Domů</b> ve skupině <b>Schránka</b> <b>dvakrát</b> klikni na <b>Kopírovat formát</b> (štěteček).</p>' +
         ribbon('Domů', [GR_CLIP, GR_NUMBER], hi='Kopírovat formát'),
         'Dvojklik nechá štěteček zapnutý, takže můžeš „natírat“ řádek po řádku. Jednoduchý klik by se po prvním použití vypnul.'),
    step(3, 'Natři řádky jeden po druhém', '<p>Klikni do <b>B5</b>, pak do <b>B6</b>, <b>B7</b>… – každé kliknutí přenese formát na celý řádek o 12 buňkách. Až budeš hotov(a), stiskni ' + keys('Esc') + '.</p>',
         'Kdybys štětečkem přejel(a) celou oblast B5:M68 najednou, Excel by mohl vytvořit jednu společnou škálu – a byl(a) bys zpátky u celé tabulky.'),
    step(4, 'Ověř pravidla', '<p><b>Domů → Podmíněné formátování → Spravovat pravidla…</b>, nahoře zvol „Zobrazit pravidla formátování pro: <b>Tento list</b>“. Každé pravidlo má mít ve sloupci <b>Platí pro</b> jen jeden řádek, např. <code>=$B$5:$M$5</code>.</p>' +
         menu(CF_MENU, hi='Spravovat pravidla…')),
    step(5, 'Výsledek', P1['CF_ROW']),
])

q_rows = [['', 'wage', 'educ', 'phone'], ['', '5613,40', '18', '4798249090'], ['', '5543,30', '14', '4791552660'], ['', '…', '…', '…']]
P1['WB_QUEST'] = wb_buttons(('s01', 'dta2_quest', 'Celý soubor dta2_quest.xlsx'), ('s01', 'dta2_quest_hint', 'dta2_quest_hint.xlsx (s nápovědou)'))
P1['GOAL_CORREL'] = goal(
    'Změřit, jak těsně spolu souvisejí tři dvojice proměnných: mzda–vzdělání, vzdělání–telefon a mzda–telefon.',
    'Pearsonův korelační koeficient <code>=CORREL(oblast1;oblast2)</code>. Vrací číslo od −1 do 1: znaménko = směr, velikost = jak blízko jsou body přímce.',
    vysledek='Tři čísla: wage–educ +0,584, educ–phone −0,594, wage–phone −0,806 (nejsilnější – a to je ta záhada).')
P1['GUIDE_CORREL'] = guide('Korelace funkcí CORREL', [
    step(1, 'Kam psát', '<p>V souboru <b>dta2_quest.xlsx</b> jsou data ve sloupcích <b>B</b> (wage), <b>C</b> (educ) a <b>D</b> (phone), řádky 2–121. Klikni do prázdné buňky, např. <b>F2</b>.</p>' +
         sheet(q_rows, start_row=1, sheet_name='Sheet', colors=sel(q_rows, 1, 1, 3, 2))),
    step(2, 'Napiš vzorec', '<p><code>=CORREL(B2:B121;C2:C121)</code> a ' + keys('Enter') + '.</p><p>V české verzi Excelu se argumenty oddělují <b>středníkem</b> (ve slidu je čárka – to je anglická verze).</p>',
         'CORREL bere dvě stejně dlouhé oblasti a páruje řádky: 1. řádek s 1. řádkem atd. Kdyby jedna oblast začínala o řádek níž, spároval(a) bys čísla od různých lidí.'),
    step(3, 'Nebo přes průvodce funkcí', '<p>Karta <b>Vzorce → Vložit funkci</b> (fx) → kategorie <b>Statistické</b> → <b>CORREL</b> → OK. Do okének <b>Pole1</b> a <b>Pole2</b> označ myší oblasti.</p>' +
         dialog('Argumenty funkce', [('CORREL', None, 0), ('Pole1', 'B2:B121', 1), ('Pole2', 'C2:C121', 2)], hi='OK', n=3)),
    step(4, 'Další dvě dvojice', '<p>Do F3: <code>=CORREL(C2:C121;D2:D121)</code> (educ–phone)<br>Do F4: <code>=CORREL(B2:B121;D2:D121)</code> (wage–phone)</p>'
         '<p><b>Kontrola:</b> 0,584 · −0,594 · −0,806. V souboru <i>dta2_quest_hint.xlsx</i> jsou data o sloupec vpravo (C–E), proto tam vzorce mají C, D, E.</p>'),
])
P1['GOAL_SCPHONE'] = goal(
    'Podívat se na vztah mzda–telefon <b>očima</b>, ne jen jedním číslem.',
    'Nic nepočítáme; bodový graf ukáže každý z 120 lidí jako jeden bod (x = telefonní číslo, y = mzda).',
    '<b>Bodový (XY)</b> – obě proměnné jsou čísla a nejde o čas. Spojnicový graf by body pospojoval podle pořadí řádků, což nedává smysl.',
    'Tři oddělené shluky bodů – stopu skryté proměnné.')
P1['GUIDE_SCPHONE'] = guide('Bodový graf telefon × mzda', [
    step(1, 'Označ dva sloupce', '<p>Označ <b>B1:B121</b> (wage), podrž ' + keys('Ctrl') + ' a označ <b>D1:D121</b> (phone).</p>',
         'U bodového grafu Excel bere <b>levý</b> označený sloupec jako osu x. Tady by to byla mzda – v kroku 4 to otočíme.'),
    step(2, 'Vložení → Bodový graf', '<p><b>Vložení</b> → ikona <b>Vložit bodový (XY) nebo bublinový graf</b> → <b>Bodový</b> (první ikona).</p>' +
         ribbon('Vložení', [GR_TABLES, GR_CHARTS], hi='Bodový (XY) nebo bublinový') + charts_gallery(SCAT_GAL, hi='Bodový')),
    step(3, 'Vybrat data', '<p>S označeným grafem: karta <b>Návrh grafu → Vybrat data</b>. V seznamu řad označ řadu a klikni na <b>Upravit</b>.</p>' +
         ribbon('Návrh grafu', [GR_CDESIGN], hi='Vybrat data', ctx=CHART_CTX)),
    step(4, 'Prohoď osy', '<p>V okně <b>Upravit řadu</b> nastav: <b>Hodnoty X</b> = <code>=Sheet!$D$2:$D$121</code> (phone), <b>Hodnoty Y</b> = <code>=Sheet!$B$2:$B$121</code> (wage).</p>' +
         dialog('Upravit řadu', [('Název řady', 'wage', 0), ('Hodnoty X řady', '=Sheet!$D$2:$D$121', 1), ('Hodnoty Y řady', '=Sheet!$B$2:$B$121', 2)], hi='OK', n=3),
         'Vysvětlovaná proměnná (mzda) patří na svislou osu y, „vysvětlující“ (telefon) na vodorovnou x.'),
    step(5, 'Logaritmická osa x', '<p>Telefonní čísla mají 10, 12 a 13 číslic. Pravým tlačítkem na čísla vodorovné osy → <b>Formát osy…</b> → <b>Možnosti osy</b> → zaškrtni <b>Logaritmické měřítko</b> (základ 10).</p>' +
         pane('Formát osy', [('head', 'Možnosti osy', None), ('field', 'Minimum', 'Automaticky'), ('check', 'Logaritmické měřítko', True), ('field', 'Základ', '10')], hi='Logaritmické měřítko'),
         'Na běžné ose by se norská a česká čísla (≈ 4,8 mld. a 420 mld.) slila u levého okraje vedle bangladéšských (8,8 bil.).'),
    step(6, 'Výsledek', P1['SC_PHONE']),
])
P1['GOAL_SCCOUNTRY'] = goal(
    'Ověřit, zda shluky v grafu odpovídají zemím.',
    'Seřadíme data podle země a každou zemi vykreslíme jako samostatnou řadu s vlastní barvou.',
    '<b>Bodový</b> s více řadami – barva = třetí proměnná (země).',
    'Tři barevné mraky: Norsko vlevo nahoře (krátká čísla, vysoké mzdy), Česko uprostřed, Bangladéš vpravo dole.')
orig_rows = [['', 'country', 'wage', 'educ', 'phone'], ['', 'Norway', '5613,40', '18', '4798249090'], ['', '…', '…', '…', '…'], ['', 'Czechia', '2041,36', '13', '420777846473'], ['', '…', '…', '…', '…'], ['', 'Bangladesh', '…', '…', '8801712170983']]
P1['GUIDE_SCCOUNTRY'] = guide('Bodový graf obarvený podle země', [
    step(1, 'List Original a seřazení', '<p>V <i>dta2_quest_hint.xlsx</i> přepni na list <b>Original</b> (sloupce B country, C wage, D educ, E phone). Klikni kamkoli do dat → <b>Data → Seřadit</b> → Seřadit podle <b>country</b>.</p>' +
         sheet(orig_rows, start_row=1, sheet_name='Original'),
         'Seřazením dostaneš každou zemi do souvislého bloku řádků – a ten pak snadno přidáš jako jednu řadu grafu. V tomto souboru už seřazeno je: Norsko 2–41, Česko 42–81, Bangladéš 82–121.'),
    step(2, 'Graf pro první zemi', '<p>Udělej bodový graf jako v minulém návodu, ale jen pro řádky 2–41: Hodnoty X = <code>=Original!$E$2:$E$41</code>, Hodnoty Y = <code>=Original!$C$2:$C$41</code>, Název řady = <code>Norway</code>.</p>'),
    step(3, 'Přidej další řady', '<p><b>Návrh grafu → Vybrat data → Přidat</b>.</p>' +
         dialog('Upravit řadu', [('Název řady', 'Czechia', 0), ('Hodnoty X řady', '=Original!$E$42:$E$81', 1), ('Hodnoty Y řady', '=Original!$C$42:$C$81', 2)], hi='OK', n=3) +
         '<p>Totéž pro Bangladéš: E82:E121 a C82:C121. Každá řada dostane automaticky jinou barvu a vlastní položku v legendě.</p>'),
    step(4, 'Výsledek', '<p>Nezapomeň na logaritmickou osu x (Formát osy → Logaritmické měřítko).</p>' + P1['SC_PHONE_C']),
])
P1['GOAL_WITHIN'] = goal(
    'Zjistit, jestli vztah mzda–telefon platí i <b>uvnitř</b> jedné země, kde je předvolba pro všechny stejná.',
    'Stejná funkce CORREL, ale jen na řádcích jedné země. Pokud vztah uvnitř zemí zmizí, celková korelace −0,81 vznikla jen rozdíly <i>mezi</i> zeměmi (skrytá proměnná = země).',
    vysledek='Tabulku 3 země × 3 dvojice. Mzda–telefon uvnitř zemí malé a nekonzistentní, mzda–vzdělání naopak silnější.')
P1['GUIDE_WITHIN'] = guide('Korelace zvlášť pro každou zemi', [
    step(1, 'Vzorce s rozsahy jedné země', '<p>Na listu <b>Original</b> (seřazeném podle země):</p>'
         '<p>Norsko, mzda–telefon: <code>=CORREL(C2:C41;E2:E41)</code><br>Česko: <code>=CORREL(C42:C81;E42:E81)</code><br>Bangladéš: <code>=CORREL(C82:C121;E82:E121)</code></p>'
         '<p>Pro mzda–vzdělání zaměň E za D.</p>',
         'Rozsahy musí sedět přesně na blok jedné země – proto je seřazení v předchozím kroku nutné.'),
    step(2, 'Alternativa: Analýza dat', '<p><b>Data → Analýza dat → Korelace</b> → Vstupní oblast např. <code>$C$2:$E$41</code>, Sdružit: <b>Sloupce</b>. Excel vypíše celou korelační tabulku najednou.</p>'
         '<p>Pokud tlačítko <b>Analýza dat</b> nevidíš: <b>Soubor → Možnosti → Doplňky</b> → dole Spravovat: Doplňky Excelu → <b>Přejít…</b> → zaškrtni <b>Analytické nástroje</b>.</p>' +
         dialog('Korelace', [('Vstupní oblast', '$C$2:$E$41', 1), ('Sdružit', 'Sloupce', 0), ('Výstupní oblast', '$G$2', 2)], hi='OK', n=3)),
    step(3, 'Výsledek', P1['WITHIN']),
])

# ======================================================================================
# Cvičení 2 (s02)
# ======================================================================================
P2['WB_BEHAV'] = wb_buttons(('s02', 'dta3_behav', 'Celý soubor dta3_behav.xlsx'))
P2['GOAL_VARS'] = goal(
    'Pochopit, co v databázi je, dřív než začneš počítat: názvy proměnných, jednotky, zdroje a mezery v datech.',
    'Nic. List <b>Variables</b> je slovník – každý řádek popisuje jednu proměnnou.',
    vysledek='Víš, že HDP je ve dvou verzích (PPP a tržní kurz) a že prázdná buňka = chybějící údaj.')
P2['GOAL_PANEL'] = goal(
    'Pochopit tvar dat: <b>dlouhý</b> (Panel) vs. <b>široký</b> formát (listy 2000, 2010, 2020) – a umět z jednoho dostat druhý.',
    'Filtrem vybereme z Panelu jednu proměnnou; tím dostaneme sloupec, který můžeš porovnávat mezi zeměmi.',
    vysledek='Umíš z Panelu vytáhnout např. HDI všech zemí v jednom roce.')
P2['GUIDE_PANEL'] = guide('Filtr v dlouhém formátu (list Panel)', [
    step(1, 'Zapni filtr', '<p>Na listu <b>Panel</b> klikni do hlavičky (řádek 1) → karta <b>Data</b> → <b>Filtr</b>. V hlavičkách se objeví šipky ▾.</p>' +
         ribbon('Data', [('Seřadit a filtrovat', [('Seřadit\nA→Z', '⇅'), ('Seřadit', '↕'), ('Filtr', '⏷')])], hi='Filtr')),
    step(2, 'Vyber jen proměnnou hdi', '<p>Klikni na ▾ ve sloupci <b>Variable</b> → odškrtni <b>(Vybrat vše)</b> → zaškrtni jen <b>hdi</b> → OK.</p>' +
         menu([('↑', 'Seřadit od A do Z'), ('↓', 'Seřadit od Z do A'), ('—', ''), ('☐', '(Vybrat vše)'), ('☐', 'gdp_ppp'), ('☐', 'gdp_pc_usd'), ('☑', 'hdi'), ('☐', 'gini_disp')], hi='hdi', title='Variable')),
    step(3, 'Zkopíruj výsledek', '<p>Označ viditelné řádky (Country + sloupec roku, např. 2020), ' + keys('Ctrl', 'C') + ', nový list, ' + keys('Ctrl', 'V') + '. Excel zkopíruje jen viditelné (vyfiltrované) řádky.</p>',
         'Tím z dlouhého formátu vznikne průřez „země × jedna proměnná“ – stejný tvar jako listy 2000/2010/2020.'),
])
P2['WB_HDI'] = wb_buttons(('s02', 'dta3_solvedsmth', 'Celý soubor dta3_solvedsmth.xlsx (výpočet HDI)'))
P2['GOAL_HDIRAW'] = goal(
    'Spočítat HDI „ručně“ ze tří rozměrů – zdraví, vzdělání a příjmu – a pochopit, proč OSN počítá index právě takhle.',
    'Nejdřív pomocné sloupce: <code>H8 =PRŮMĚR(E8:F8)</code> spojí dva ukazatele vzdělání do jednoho, <code>I8 =LOG(G8)</code> zlogaritmuje příjem. '
    'Pod tabulku <code>D203 =MAX(D8:D200)</code> a <code>D204 =MIN(D8:D200)</code> – meze pro normalizaci.',
    vysledek='Sloupce H a I a řádky 203–205 (max, min, průměr) pro sloupce D až I.')
P2['GUIDE_HDIRAW'] = guide('Pomocné sloupce a meze (min, max)', [
    step(1, 'Průměr vzdělání', '<p>Klikni do <b>H8</b> a napiš <code>=PRŮMĚR(E8:F8)</code>, ' + keys('Enter') + '.</p><p>(V anglickém Excelu <code>AVERAGE</code> – v náhledu souboru uvidíš české názvy.)</p>',
         'Očekávaná a průměrná délka školní docházky jsou dva pohledy na jeden rozměr – vzdělání. Zprůměrováním dostanou dohromady stejnou váhu jako zdraví nebo příjem.'),
    step(2, 'Logaritmus příjmu', '<p>Do <b>I8</b>: <code>=LOG(G8)</code> (dekadický logaritmus).</p>',
         'Logaritmus „stlačí“ velké příjmy: z 1 000 $ na 2 000 $ je stejný skok jako z 50 000 $ na 100 000 $. Odpovídá to klesajícímu meznímu užitku z příjmu.'),
    step(3, 'Zkopíruj dolů', fill_handle_note() + '<p>Označ H8:I8 najednou a dvakrát klikni na úchyt – zkopírují se oba sloupce do řádku 200.</p>'),
    step(4, 'Maximum a minimum', '<p>Do <b>D203</b>: <code>=MAX(D8:D200)</code>, do <b>D204</b>: <code>=MIN(D8:D200)</code>. Označ D203:D204 a táhni úchytem <b>doprava</b> až do sloupce I.</p>',
         'Vzorec se při tažení doprava posouvá po sloupcích (E, F, G…), takže máš max a min pro každý ukazatel.'),
    step(5, 'Výsledek', P2['HDI_RAW']),
])
P2['GOAL_NORM'] = goal(
    'Převést ukazatele v různých jednotkách (roky, dolary) na společnou škálu 0–1, aby se daly sčítat a průměrovat.',
    'Min–max normalizace <code>(x − min) / (max − min)</code>. V Excelu <code>K8 =(D8-D$204)/(D$203-D$204)</code>. '
    'Znak <b>$ před číslem řádku</b> zamkne řádky 203 a 204 – při kopírování dolů se nemění, při kopírování doprava se posouvá sloupec.',
    vysledek='Sloupce K až P s čísly mezi 0 a 1 (nejlepší země = 1, nejhorší = 0).')
P2['GUIDE_NORM'] = guide('Normalizace se smíšenými odkazy', [
    step(1, 'První vzorec', '<p>Do <b>K8</b> napiš <code>=(D8-D$204)/(D$203-D$204)</code>.</p>' +
         sheet([['Life expect.', '…', 'Norm life expect'], ['82,691', '…', '0,9035'], ['…', '…', '…'], ['85,706', '', '← D203 max'], ['54,462', '', '← D204 min']],
               start_row=7, start_col=3, formula=('K8', '=(D8-D$204)/(D$203-D$204)'), sel=(1, 2)),
         'Čitatel = o kolik je země nad nejhorší, jmenovatel = celé rozpětí. Island: (82,691 − 54,462)/(85,706 − 54,462) = 0,9035.'),
    step(2, 'Kde přesně psát $', '<p>Klikni ve vzorci na <code>D204</code> a mačkej ' + keys('F4') + ': přepíná se <code>$D$204 → D$204 → $D204 → D204</code>. Chceš <b>D$204</b> (zamčený řádek).</p>',
         '$D$204 by při kopírování doprava pořád ukazoval na sloupec D – všechny ukazatele by se normalizovaly mezemi naděje dožití. D204 bez $ by se při kopírování dolů posunul na D205, D206… mimo meze.'),
    step(3, 'Doprava a dolů', '<p>Táhni K8 úchytem doprava do <b>P8</b> (vzorec se změní na E, F, G, H, I). Pak označ K8:P8 a dvakrát klikni na úchyt – zkopíruje se do řádku 200.</p>'),
    step(4, 'Výsledek', P2['HDI_NORM']),
])
P2['GOAL_HDIVAR'] = goal(
    'Složit z normalizovaných složek několik variant HDI a zjistit, jak moc výsledek závisí na zvolené metodě.',
    '<code>R8 =ODMOCNINA(N8)</code> (odmocnina normalizovaného příjmu), pak průměry: <code>U8 =PRŮMĚR(K8:N8)</code>, <code>V8 =PRŮMĚR(K8:M8;R8)</code>, '
    '<code>W8 =PRŮMĚR(K8;O8;R8)</code>, <code>X8 =PRŮMĚR(K8;O8;P8)</code>. Nakonec <code>=CORREL(T8:T200;X8:X200)</code> = shoda s oficiálním HDI.',
    'Bodový graf oficiální HDI × HDI 4: když body leží na přímce, metoda dává stejné pořadí zemí.',
    'Čtyři sloupce variant a korelace s oficiálním HDI přes 0,98 (HDI 4 ≈ 0,996).')
P2['GUIDE_HDIVAR'] = guide('Varianty HDI a jejich srovnání', [
    step(1, 'Odmocnina příjmu', '<p>Do <b>R8</b>: <code>=ODMOCNINA(N8)</code> (anglicky SQRT).</p>',
         'Odmocnina je „mírnější“ alternativa logaritmu – také zmenšuje rozdíly mezi bohatými zeměmi.'),
    step(2, 'Průměry s nesouvislými buňkami', '<p>U8 <code>=PRŮMĚR(K8:N8)</code> · V8 <code>=PRŮMĚR(K8:M8;R8)</code> · W8 <code>=PRŮMĚR(K8;O8;R8)</code> · X8 <code>=PRŮMĚR(K8;O8;P8)</code></p>'
         '<p>Středník odděluje jednotlivé buňky nebo oblasti, dvojtečka znamená „od–do“.</p>',
         'HDI 1 má dvě složky vzdělání (K8:N8 = zdraví, 2× vzdělání, příjem) → vzdělání má dvojnásobnou váhu. HDI 3 a 4 berou jednu složku za každý rozměr – stejné váhy jako OSN.'),
    step(3, 'Zkopíruj a obarvi', fill_handle_note() + '<p>Pro přehled označ <b>T8:T200</b> (oficiální HDI) a dej <b>Domů → Podmíněné formátování → Barevné škály → zelená – žlutá – červená</b>.</p>' +
         swatches(SCALES[:4], hi=SCALES[0][0])),
    step(4, 'Korelace s oficiálním HDI', '<p>Pod tabulku např. do U202: <code>=CORREL($T$8:$T$200;U8:U200)</code> a táhni doprava do X202.</p>',
         'Tady jsou $ u T naopak potřeba úplně – oficiální HDI chceš ve všech čtyřech vzorcích stejné, zatímco variantu (U, V, W, X) posouvat.'),
    step(5, 'Výsledek', P2['HDI_VAR'] + P2['SC_HDI4']),
])
P2['WB_MERGED'] = wb_buttons(('s02', 'dta3_mergedsmth', 'Celý soubor dta3_mergedsmth.xlsx'))
P2['GOAL_MERGED'] = goal(
    'Zjistit, jak silně HDI souvisí s HDP na obyvatele – a proč záleží na tom, jestli HDP logaritmujeme.',
    'Pomocný sloupec <code>D2 =LOG(C2)</code>, pak <code>=CORREL(B2:B184;C2:C184)</code> a <code>=CORREL(B2:B184;D2:D184)</code>. Korelace měří jen <b>přímkový</b> vztah, proto vyjde s logaritmem vyšší.',
    '<b>Bodový</b> graf HDI × HDP, jednou s běžnou a jednou s logaritmickou osou x – na logaritmické ose se zakřivený vztah narovná.',
    'r = %s s HDP a r = %s s log HDP; dva bodové grafy.' % (P2['R_LIN'], P2['R_LOG']))
P2['GUIDE_MERGED'] = guide('Korelace s logaritmem a logaritmická osa', [
    step(1, 'Pomocný sloupec', '<p>Do <b>D1</b> napiš <code>log GDP</code>, do <b>D2</b> <code>=LOG(C2)</code> a dvakrát klikni na úchyt pro vyplnění.</p>'),
    step(2, 'Dvě korelace', '<p>Do F2: <code>=CORREL(B2:B184;C2:C184)</code> (HDI × HDP)<br>Do F3: <code>=CORREL(B2:B184;D2:D184)</code> (HDI × log HDP)</p>'
         '<p>Bez pomocného sloupce (Excel 365): <code>=CORREL(B2:B184;LOG(C2:C184))</code>.</p>'),
    step(3, 'Bodový graf', '<p>Označ <b>B1:C184</b> → <b>Vložení → Bodový</b>. Excel dá na osu x levý sloupec, tedy HDI (B) – my ale chceme HDP na ose x. Proto <b>Návrh grafu → Vybrat data → Upravit</b>: Hodnoty X = <code>=merged!$C$2:$C$184</code>, Hodnoty Y = <code>=merged!$B$2:$B$184</code>.</p>' +
         dialog('Upravit řadu', [('Název řady', 'HDI', 0), ('Hodnoty X řady', '=merged!$C$2:$C$184', 1), ('Hodnoty Y řady', '=merged!$B$2:$B$184', 2)], hi='OK', n=3)),
    step(4, 'Logaritmická osa', '<p>Pravým tlačítkem na osu x → <b>Formát osy…</b> → <b>Logaritmické měřítko</b>.</p>' +
         pane('Formát osy', [('head', 'Možnosti osy', None), ('check', 'Logaritmické měřítko', True), ('field', 'Základ', '10')], hi='Logaritmické měřítko')),
    step(5, 'Spojnice trendu (volitelně)', '<p>Klikni na graf → tlačítko <b>+</b> vpravo nahoře → zaškrtni <b>Spojnice trendu</b>.</p>' +
         chart_plus([('Osy', True), ('Názvy os', False), ('Název grafu', True), ('Mřížka', True), ('Legenda', False), ('Spojnice trendu', True)], hi='Spojnice trendu'),
         'Přímka ukáže, kde by HDI „mělo být“ podle příjmu. Země hodně pod ní nebo nad ní jsou zajímavé výjimky.'),
    step(6, 'Výsledek', P2['SC_LIN'] + P2['SC_LOG']),
])
P2['GOAL_CORR20'] = goal(
    'Zjistit, s čím vším HDP souvisí: zdraví, nerovnost, duševní zdraví, emise.',
    'Na listu <b>2010</b> sérii <code>=CORREL(sloupec gdp_ppp; sloupec X)</code>. Prázdné buňky CORREL sám vynechá, takže každá korelace může být z jiného počtu zemí.',
    '<b>Bodový</b> graf pro nejzajímavější dvojici (naděje dožití × HDP).',
    'Tabulku korelací a graf naděje dožití × HDP.')
P2['GUIDE_CORR20'] = guide('Tabulka korelací s HDP (list 2010)', [
    step(1, 'Jedna korelace', '<p>HDP v PPP je ve sloupci <b>C</b> (gdp_ppp), naděje dožití ve sloupci <b>N</b> (life_expectancy), data v řádcích 2–142.</p><p><code>=CORREL($C$2:$C$142;N2:N142)</code></p>',
         '$ u sloupce C: HDP chceš ve všech vzorcích stejné, druhou proměnnou budeš měnit.'),
    step(2, 'Další proměnné', '<p>Vzorec zkopíruj a druhou oblast přepiš na sloupec, který tě zajímá: <code>O</code> child_mortality, <code>F</code> gini_disp, <code>P</code> depression, <code>Y</code> co2…</p>'),
    step(3, 'Výsledek', P2['CORR20'] + P2['SC_LE']),
])
P2['GOAL_GDPCMP'] = goal(
    'Porovnat průměrné a mediánové HDP na obyvatele zemí a pochopit, proč se tolik liší.',
    '<code>=PRŮMĚR(oblast)</code> a <code>=MEDIAN(oblast)</code> a jejich relativní rozdíl <code>(průměr − medián)/průměr</code>. Čím je číslo větší, tím víc pár bohatých zemí táhne průměr nahoru.',
    'Spojnicový graf průměru a mediánu v čase – dvě časové řady v jednom grafu.',
    'Poměr kolem 0,6–0,7: průměr je 2–3× vyšší než medián.')
P2['GUIDE_GDPCMP'] = guide('Průměr vs. medián', [
    step(1, 'Průměr a medián', '<p>Pro sloupec hodnot HDP (např. jeden rok, řádky 2–142): <code>=PRŮMĚR(C2:C142)</code> a <code>=MEDIAN(C2:C142)</code>.</p>',
         'Průměr = součet / počet, citlivý na extrémy. Medián = prostřední hodnota po seřazení, extrémy ho nezajímají.'),
    step(2, 'Relativní rozdíl', '<p><code>=(průměr−medián)/průměr</code>, např. <code>=(D2-E2)/D2</code>. Naformátuj na 2 desetinná místa.</p>'),
    step(3, 'Graf v čase', '<p>Označ sloupec <b>Year</b> a se ' + keys('Ctrl') + ' sloupce s průměrem a mediánem → <b>Vložení → Spojnicový</b>.</p>' +
         ribbon('Vložení', [GR_TABLES, GR_CHARTS], hi='Spojnicový nebo plošný'),
         'Pokud Excel vykreslí rok jako třetí čáru, klikni na <b>Návrh grafu → Vybrat data</b> a u <b>Popisky vodorovné osy (kategorie)</b> nastav sloupec Year.'),
    step(4, 'Výsledek', P2['GDPCMP']),
])

json.dump(P1, open(p1, 'w'), ensure_ascii=False)
json.dump(P2, open(p2, 'w'), ensure_ascii=False)
print('guides ok', len([k for k in P1 if k.startswith('GUIDE')]), len([k for k in P2 if k.startswith('GUIDE')]))
