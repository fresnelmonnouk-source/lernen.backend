#!/usr/bin/env python3
"""
Génère verbs-data.js avec 60 verbes essentiels pré-conjugués.
Couvre Präsens, Präteritum, Perfekt — les 3 temps cruciaux A1-B1.
"""
import json

# Format : (infinitif, traduction_fr, type, auxiliaire, séparable, présent[6], prétérit[6], perfekt_er_form, niveau)
# Présent et prétérit dans l'ordre : ich, du, er, wir, ihr, sie
# type : "schwach" (régulier), "stark" (fort), "gemischt" (mixte), "modal"

VERBES = [
    # ========== AUXILIAIRES & MODAUX (les + importants) ==========
    ("sein", "être", "stark", "sein", False,
     ["bin","bist","ist","sind","seid","sind"],
     ["war","warst","war","waren","wart","waren"],
     "ist gewesen", "A1",
     "Le verbe le plus important. Totalement irrégulier."),
    
    ("haben", "avoir", "stark", "haben", False,
     ["habe","hast","hat","haben","habt","haben"],
     ["hatte","hattest","hatte","hatten","hattet","hatten"],
     "hat gehabt", "A1",
     "Auxiliaire essentiel. Notez le 'st'→'t' au présent (du hast, er hat)."),
    
    ("werden", "devenir", "stark", "sein", False,
     ["werde","wirst","wird","werden","werdet","werden"],
     ["wurde","wurdest","wurde","wurden","wurdet","wurden"],
     "ist geworden", "A1",
     "Verbe fort. Sert aussi à former le futur et le passif."),
    
    ("können", "pouvoir", "modal", "haben", False,
     ["kann","kannst","kann","können","könnt","können"],
     ["konnte","konntest","konnte","konnten","konntet","konnten"],
     "hat gekonnt", "A1",
     "Verbe modal. Pas de terminaison ich/er au présent."),
    
    ("müssen", "devoir", "modal", "haben", False,
     ["muss","musst","muss","müssen","müsst","müssen"],
     ["musste","musstest","musste","mussten","musstet","mussten"],
     "hat gemusst", "A1",
     "Verbe modal. Obligation forte."),
    
    ("wollen", "vouloir", "modal", "haben", False,
     ["will","willst","will","wollen","wollt","wollen"],
     ["wollte","wolltest","wollte","wollten","wolltet","wollten"],
     "hat gewollt", "A1",
     "Verbe modal. Volonté."),
    
    ("sollen", "devoir (moralement)", "modal", "haben", False,
     ["soll","sollst","soll","sollen","sollt","sollen"],
     ["sollte","solltest","sollte","sollten","solltet","sollten"],
     "hat gesollt", "A1",
     "Verbe modal. Obligation morale ou ordre indirect."),
    
    ("dürfen", "avoir le droit", "modal", "haben", False,
     ["darf","darfst","darf","dürfen","dürft","dürfen"],
     ["durfte","durftest","durfte","durften","durftet","durften"],
     "hat gedurft", "A2",
     "Verbe modal. Permission."),
    
    ("mögen", "aimer (modal)", "modal", "haben", False,
     ["mag","magst","mag","mögen","mögt","mögen"],
     ["mochte","mochtest","mochte","mochten","mochtet","mochten"],
     "hat gemocht", "A1",
     "Verbe modal. Souvent utilisé au Konjunktiv 'möchte' = aimerais."),
    
    # ========== VERBES DE MOUVEMENT ==========
    ("gehen", "aller (à pied)", "stark", "sein", False,
     ["gehe","gehst","geht","gehen","geht","gehen"],
     ["ging","gingst","ging","gingen","gingt","gingen"],
     "ist gegangen", "A1",
     "Verbe fort. Auxiliaire 'sein' (mouvement)."),
    
    ("kommen", "venir", "stark", "sein", False,
     ["komme","kommst","kommt","kommen","kommt","kommen"],
     ["kam","kamst","kam","kamen","kamt","kamen"],
     "ist gekommen", "A1",
     "Verbe fort. Très fréquent."),
    
    ("fahren", "aller (en véhicule)", "stark", "sein", False,
     ["fahre","fährst","fährt","fahren","fahrt","fahren"],
     ["fuhr","fuhrst","fuhr","fuhren","fuhrt","fuhren"],
     "ist gefahren", "A1",
     "Verbe fort. Umlaut au présent (du/er fährst/fährt)."),
    
    ("laufen", "courir", "stark", "sein", False,
     ["laufe","läufst","läuft","laufen","lauft","laufen"],
     ["lief","liefst","lief","liefen","lieft","liefen"],
     "ist gelaufen", "A1",
     "Verbe fort. Umlaut au présent + changement de voyelle au prétérit."),
    
    ("fliegen", "voler", "stark", "sein", False,
     ["fliege","fliegst","fliegt","fliegen","fliegt","fliegen"],
     ["flog","flogst","flog","flogen","flogt","flogen"],
     "ist geflogen", "A2",
     "Verbe fort. ie→o au passé."),
    
    ("bleiben", "rester", "stark", "sein", False,
     ["bleibe","bleibst","bleibt","bleiben","bleibt","bleiben"],
     ["blieb","bliebst","blieb","blieben","bliebt","blieben"],
     "ist geblieben", "A1",
     "Verbe fort. ei→ie au passé."),
    
    # ========== VERBES QUOTIDIENS ==========
    ("essen", "manger", "stark", "haben", False,
     ["esse","isst","isst","essen","esst","essen"],
     ["aß","aßt","aß","aßen","aßt","aßen"],
     "hat gegessen", "A1",
     "Verbe fort. e→i au présent. Notez le ß."),
    
    ("trinken", "boire", "stark", "haben", False,
     ["trinke","trinkst","trinkt","trinken","trinkt","trinken"],
     ["trank","trankst","trank","tranken","trankt","tranken"],
     "hat getrunken", "A1",
     "Verbe fort. i→a→u (changement classique)."),
    
    ("schlafen", "dormir", "stark", "haben", False,
     ["schlafe","schläfst","schläft","schlafen","schlaft","schlafen"],
     ["schlief","schliefst","schlief","schliefen","schlieft","schliefen"],
     "hat geschlafen", "A1",
     "Verbe fort. Umlaut au présent + a→ie au passé."),
    
    ("sehen", "voir", "stark", "haben", False,
     ["sehe","siehst","sieht","sehen","seht","sehen"],
     ["sah","sahst","sah","sahen","saht","sahen"],
     "hat gesehen", "A1",
     "Verbe fort. e→ie au présent."),
    
    ("lesen", "lire", "stark", "haben", False,
     ["lese","liest","liest","lesen","lest","lesen"],
     ["las","lasst","las","lasen","last","lasen"],
     "hat gelesen", "A1",
     "Verbe fort. e→ie au présent. 'du liest' (pas du liesst)."),
    
    ("sprechen", "parler", "stark", "haben", False,
     ["spreche","sprichst","spricht","sprechen","sprecht","sprechen"],
     ["sprach","sprachst","sprach","sprachen","spracht","sprachen"],
     "hat gesprochen", "A1",
     "Verbe fort. e→i au présent + e→a→o."),
    
    ("schreiben", "écrire", "stark", "haben", False,
     ["schreibe","schreibst","schreibt","schreiben","schreibt","schreiben"],
     ["schrieb","schriebst","schrieb","schrieben","schriebt","schrieben"],
     "hat geschrieben", "A1",
     "Verbe fort. ei→ie classique."),
    
    ("nehmen", "prendre", "stark", "haben", False,
     ["nehme","nimmst","nimmt","nehmen","nehmt","nehmen"],
     ["nahm","nahmst","nahm","nahmen","nahmt","nahmen"],
     "hat genommen", "A1",
     "Verbe fort. e→i + double consonne au présent (du nimmst)."),
    
    ("geben", "donner", "stark", "haben", False,
     ["gebe","gibst","gibt","geben","gebt","geben"],
     ["gab","gabst","gab","gaben","gabt","gaben"],
     "hat gegeben", "A1",
     "Verbe fort. e→i au présent. 'Es gibt' = il y a."),
    
    ("finden", "trouver", "stark", "haben", False,
     ["finde","findest","findet","finden","findet","finden"],
     ["fand","fandst","fand","fanden","fandet","fanden"],
     "hat gefunden", "A1",
     "Verbe fort. Notez le 'e' supplémentaire à 'du findest' (pour la prononciation)."),
    
    ("kennen", "connaître", "gemischt", "haben", False,
     ["kenne","kennst","kennt","kennen","kennt","kennen"],
     ["kannte","kanntest","kannte","kannten","kanntet","kannten"],
     "hat gekannt", "A1",
     "Verbe mixte ! Régulier au présent, irrégulier au passé (e→a)."),
    
    ("wissen", "savoir", "gemischt", "haben", False,
     ["weiß","weißt","weiß","wissen","wisst","wissen"],
     ["wusste","wusstest","wusste","wussten","wusstet","wussten"],
     "hat gewusst", "A1",
     "Verbe mixte. Irrégulier au présent (weiß) ET au passé (wusste)."),
    
    ("denken", "penser", "gemischt", "haben", False,
     ["denke","denkst","denkt","denken","denkt","denken"],
     ["dachte","dachtest","dachte","dachten","dachtet","dachten"],
     "hat gedacht", "A2",
     "Verbe mixte. Régulier au présent, fort au passé (e→a)."),
    
    ("bringen", "apporter", "gemischt", "haben", False,
     ["bringe","bringst","bringt","bringen","bringt","bringen"],
     ["brachte","brachtest","brachte","brachten","brachtet","brachten"],
     "hat gebracht", "A2",
     "Verbe mixte. i→a au passé."),
    
    # ========== VERBES RÉGULIERS COURANTS ==========
    ("machen", "faire", "schwach", "haben", False,
     ["mache","machst","macht","machen","macht","machen"],
     ["machte","machtest","machte","machten","machtet","machten"],
     "hat gemacht", "A1",
     "Verbe régulier modèle. Pas de changement."),
    
    ("sagen", "dire", "schwach", "haben", False,
     ["sage","sagst","sagt","sagen","sagt","sagen"],
     ["sagte","sagtest","sagte","sagten","sagtet","sagten"],
     "hat gesagt", "A1",
     "Verbe régulier."),
    
    ("fragen", "demander", "schwach", "haben", False,
     ["frage","fragst","fragt","fragen","fragt","fragen"],
     ["fragte","fragtest","fragte","fragten","fragtet","fragten"],
     "hat gefragt", "A1",
     "Verbe régulier."),
    
    ("hören", "entendre/écouter", "schwach", "haben", False,
     ["höre","hörst","hört","hören","hört","hören"],
     ["hörte","hörtest","hörte","hörten","hörtet","hörten"],
     "hat gehört", "A1",
     "Verbe régulier avec umlaut dans le radical."),
    
    ("kaufen", "acheter", "schwach", "haben", False,
     ["kaufe","kaufst","kauft","kaufen","kauft","kaufen"],
     ["kaufte","kauftest","kaufte","kauften","kauftet","kauften"],
     "hat gekauft", "A1",
     "Verbe régulier."),
    
    ("spielen", "jouer", "schwach", "haben", False,
     ["spiele","spielst","spielt","spielen","spielt","spielen"],
     ["spielte","spieltest","spielte","spielten","spieltet","spielten"],
     "hat gespielt", "A1",
     "Verbe régulier."),
    
    ("lernen", "apprendre", "schwach", "haben", False,
     ["lerne","lernst","lernt","lernen","lernt","lernen"],
     ["lernte","lerntest","lernte","lernten","lerntet","lernten"],
     "hat gelernt", "A1",
     "Verbe régulier."),
    
    ("arbeiten", "travailler", "schwach", "haben", False,
     ["arbeite","arbeitest","arbeitet","arbeiten","arbeitet","arbeiten"],
     ["arbeitete","arbeitetest","arbeitete","arbeiteten","arbeitetet","arbeiteten"],
     "hat gearbeitet", "A1",
     "Régulier mais 'e' supplémentaire après 't' (du arbeitest, er arbeitet)."),
    
    ("wohnen", "habiter", "schwach", "haben", False,
     ["wohne","wohnst","wohnt","wohnen","wohnt","wohnen"],
     ["wohnte","wohntest","wohnte","wohnten","wohntet","wohnten"],
     "hat gewohnt", "A1",
     "Verbe régulier."),
    
    ("lieben", "aimer", "schwach", "haben", False,
     ["liebe","liebst","liebt","lieben","liebt","lieben"],
     ["liebte","liebtest","liebte","liebten","liebtet","liebten"],
     "hat geliebt", "A1",
     "Verbe régulier."),
    
    ("warten", "attendre", "schwach", "haben", False,
     ["warte","wartest","wartet","warten","wartet","warten"],
     ["wartete","wartetest","wartete","warteten","wartetet","warteten"],
     "hat gewartet", "A1",
     "Régulier avec 'e' supplémentaire après 't'."),
    
    # ========== VERBES SÉPARABLES ==========
    ("aufstehen", "se lever", "stark", "sein", True,
     ["stehe auf","stehst auf","steht auf","stehen auf","steht auf","stehen auf"],
     ["stand auf","standst auf","stand auf","standen auf","standet auf","standen auf"],
     "ist aufgestanden", "A1",
     "SÉPARABLE. Le préfixe 'auf' va à la fin au présent et au prétérit."),
    
    ("anrufen", "appeler", "stark", "haben", True,
     ["rufe an","rufst an","ruft an","rufen an","ruft an","rufen an"],
     ["rief an","riefst an","rief an","riefen an","rieft an","riefen an"],
     "hat angerufen", "A1",
     "SÉPARABLE. Au participe : 'an' + 'ge' + 'rufen'."),
    
    ("einkaufen", "faire les courses", "schwach", "haben", True,
     ["kaufe ein","kaufst ein","kauft ein","kaufen ein","kauft ein","kaufen ein"],
     ["kaufte ein","kauftest ein","kaufte ein","kauften ein","kauftet ein","kauften ein"],
     "hat eingekauft", "A1",
     "SÉPARABLE et RÉGULIER."),
    
    ("ankommen", "arriver", "stark", "sein", True,
     ["komme an","kommst an","kommt an","kommen an","kommt an","kommen an"],
     ["kam an","kamst an","kam an","kamen an","kamt an","kamen an"],
     "ist angekommen", "A1",
     "SÉPARABLE + auxiliaire sein (mouvement)."),
    
    ("ausgehen", "sortir", "stark", "sein", True,
     ["gehe aus","gehst aus","geht aus","gehen aus","geht aus","gehen aus"],
     ["ging aus","gingst aus","ging aus","gingen aus","gingt aus","gingen aus"],
     "ist ausgegangen", "A2",
     "SÉPARABLE + mouvement."),
    
    # ========== VERBES INSÉPARABLES (préfixes be-, ver-, etc.) ==========
    ("verstehen", "comprendre", "stark", "haben", False,
     ["verstehe","verstehst","versteht","verstehen","versteht","verstehen"],
     ["verstand","verstandst","verstand","verstanden","verstandet","verstanden"],
     "hat verstanden", "A1",
     "INSÉPARABLE (ver- reste collé). Pas de 'ge-' au participe."),
    
    ("bekommen", "recevoir", "stark", "haben", False,
     ["bekomme","bekommst","bekommt","bekommen","bekommt","bekommen"],
     ["bekam","bekamst","bekam","bekamen","bekamt","bekamen"],
     "hat bekommen", "A1",
     "INSÉPARABLE. Attention : 'bekommen' ≠ 'become' (faux ami) !"),
    
    ("besuchen", "visiter", "schwach", "haben", False,
     ["besuche","besuchst","besucht","besuchen","besucht","besuchen"],
     ["besuchte","besuchtest","besuchte","besuchten","besuchtet","besuchten"],
     "hat besucht", "A2",
     "INSÉPARABLE + régulier. Pas de 'ge-' au participe."),
    
    ("erzählen", "raconter", "schwach", "haben", False,
     ["erzähle","erzählst","erzählt","erzählen","erzählt","erzählen"],
     ["erzählte","erzähltest","erzählte","erzählten","erzähltet","erzählten"],
     "hat erzählt", "A2",
     "INSÉPARABLE + régulier."),
    
    # ========== AUTRES VERBES IMPORTANTS ==========
    ("helfen", "aider", "stark", "haben", False,
     ["helfe","hilfst","hilft","helfen","helft","helfen"],
     ["half","halfst","half","halfen","halft","halfen"],
     "hat geholfen", "A1",
     "Verbe fort. e→i. Se construit avec datif (helfen + Dat)."),
    
    ("lassen", "laisser", "stark", "haben", False,
     ["lasse","lässt","lässt","lassen","lasst","lassen"],
     ["ließ","ließest","ließ","ließen","ließt","ließen"],
     "hat gelassen", "A2",
     "Verbe fort. Umlaut + ß partout."),
    
    ("tun", "faire (synonyme de machen)", "stark", "haben", False,
     ["tue","tust","tut","tun","tut","tun"],
     ["tat","tatest","tat","taten","tatet","taten"],
     "hat getan", "A2",
     "Verbe fort très court. Participe irrégulier 'getan'."),
    
    ("rufen", "crier/appeler", "stark", "haben", False,
     ["rufe","rufst","ruft","rufen","ruft","rufen"],
     ["rief","riefst","rief","riefen","rieft","riefen"],
     "hat gerufen", "A2",
     "Verbe fort. u→ie au passé."),
    
    ("treffen", "rencontrer", "stark", "haben", False,
     ["treffe","triffst","trifft","treffen","trefft","treffen"],
     ["traf","trafst","traf","trafen","traft","trafen"],
     "hat getroffen", "A1",
     "Verbe fort. e→i au présent + double f."),
    
    ("schwimmen", "nager", "stark", "sein", False,
     ["schwimme","schwimmst","schwimmt","schwimmen","schwimmt","schwimmen"],
     ["schwamm","schwammst","schwamm","schwammen","schwammt","schwammen"],
     "ist geschwommen", "A2",
     "Verbe fort. i→a→o. Auxiliaire 'sein' (mouvement)."),
    
    ("singen", "chanter", "stark", "haben", False,
     ["singe","singst","singt","singen","singt","singen"],
     ["sang","sangst","sang","sangen","sangt","sangen"],
     "hat gesungen", "A2",
     "Verbe fort. i→a→u."),
    
    ("schreien", "crier", "stark", "haben", False,
     ["schreie","schreist","schreit","schreien","schreit","schreien"],
     ["schrie","schriest","schrie","schrien","schriet","schrien"],
     "hat geschrien", "B1",
     "Verbe fort. ei→ie."),
    
    ("fallen", "tomber", "stark", "sein", False,
     ["falle","fällst","fällt","fallen","fallt","fallen"],
     ["fiel","fielst","fiel","fielen","fielt","fielen"],
     "ist gefallen", "A2",
     "Verbe fort. Umlaut au présent + a→ie au passé."),
    
    ("öffnen", "ouvrir", "schwach", "haben", False,
     ["öffne","öffnest","öffnet","öffnen","öffnet","öffnen"],
     ["öffnete","öffnetest","öffnete","öffneten","öffnetet","öffneten"],
     "hat geöffnet", "A1",
     "Régulier avec 'e' supplémentaire."),
    
    ("schließen", "fermer", "stark", "haben", False,
     ["schließe","schließt","schließt","schließen","schließt","schließen"],
     ["schloss","schlossest","schloss","schlossen","schlosst","schlossen"],
     "hat geschlossen", "A2",
     "Verbe fort. ie→o + double s/ss."),
    
    ("beginnen", "commencer", "stark", "haben", False,
     ["beginne","beginnst","beginnt","beginnen","beginnt","beginnen"],
     ["begann","begannst","begann","begannen","begannt","begannen"],
     "hat begonnen", "A1",
     "Verbe fort INSÉPARABLE. i→a→o."),
    
    ("vergessen", "oublier", "stark", "haben", False,
     ["vergesse","vergisst","vergisst","vergessen","vergesst","vergessen"],
     ["vergaß","vergaßt","vergaß","vergaßen","vergaßt","vergaßen"],
     "hat vergessen", "A2",
     "INSÉPARABLE + e→i + ß au passé."),
    
    ("verlieren", "perdre", "stark", "haben", False,
     ["verliere","verlierst","verliert","verlieren","verliert","verlieren"],
     ["verlor","verlorst","verlor","verloren","verlort","verloren"],
     "hat verloren", "A2",
     "INSÉPARABLE. ie→o au passé."),
    
    ("ziehen", "tirer/déménager", "stark", "haben", False,
     ["ziehe","ziehst","zieht","ziehen","zieht","ziehen"],
     ["zog","zogst","zog","zogen","zogt","zogen"],
     "hat gezogen", "B1",
     "Verbe fort. ie→o au passé."),
    
    ("waschen", "laver", "stark", "haben", False,
     ["wasche","wäschst","wäscht","waschen","wascht","waschen"],
     ["wusch","wuschst","wusch","wuschen","wuscht","wuschen"],
     "hat gewaschen", "A2",
     "Verbe fort. Umlaut au présent + a→u au passé."),
]

# Validation
print(f"Total : {len(VERBES)} verbes\n")
print("=== Répartition par type ===")
types = {}
for v in VERBES:
    types[v[2]] = types.get(v[2], 0) + 1
for t, n in sorted(types.items()):
    print(f"  {t:12} {n}")

print("\n=== Répartition par niveau ===")
levels = {}
for v in VERBES:
    levels[v[8]] = levels.get(v[8], 0) + 1
for l, n in sorted(levels.items()):
    print(f"  {l:5} {n}")

# Génération JSON
data = []
for v in VERBES:
    inf, fr, vtype, aux, sep, pres, pret, perf, lvl, note = v
    data.append({
        "v": inf,           # verbe (infinitif)
        "f": fr,            # français
        "t": vtype,         # type
        "x": aux,           # auxiliaire (haben/sein)
        "s": sep,           # séparable
        "P": pres,          # Präsens [6]
        "T": pret,          # Präteritum [6]
        "K": perf,          # Perfekt (er-form complète)
        "l": lvl,           # niveau
        "n": note           # note pédagogique
    })

# Écriture
js = "// Verbes pré-conjugués (Präsens + Präteritum + Perfekt)\n"
js += "// v=verbe, f=français, t=type, x=auxiliaire, s=séparable\n"
js += "// P=Präsens[6], T=Präteritum[6], K=Perfekt (er-form), l=niveau, n=note\n"
js += "// Ordre des 6 personnes : ich, du, er_sie_es, wir, ihr, sie_Sie\n\n"
js += "const VERBS = "
js += json.dumps(data, ensure_ascii=False, separators=(',', ':'))
js += ";\n\n"
js += "const VERB_PERSONS = ['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'sie/Sie'];\n"
js += "const VERB_TENSES = ['Präsens', 'Präteritum', 'Perfekt'];\n"

with open('/home/claude/lernen-v2/public/verbs-data.js', 'w', encoding='utf-8') as f:
    f.write(js)

print(f"\nverbs-data.js généré : {len(js)} caractères ({len(js)/1024:.1f} Ko)")
