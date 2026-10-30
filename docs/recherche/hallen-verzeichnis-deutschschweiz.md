# Hallenverzeichnis Deutschschweiz

Stand 29.10.2026 · 88 Hallen in 19 Kantonen · für Tabelle `hallen_verzeichnis` (SPEC-053)

## Vorgehen

1. **Kandidaten sammeln** aus sechs Verzeichnissen: Mitgliederliste des Branchenverbands VSBK (kletteranlagen.ch, die vollständigste Quelle), kletterportal.ch, climbdirectory.com, freizeit.ch, myswitzerland.com, indoorclimbing.com, dazu Tourismus- und Gemeindeseiten und Zeitungsmeldungen zu Neueröffnungen.
2. **Details von der offiziellen Website** jeder Halle (Adresse, Art, Kontakt, Öffnungszeiten, Eintritt). Wo die Website nicht lesbar war, aus Tourismus-/Gemeindeseiten; das steht in `notiz`.
3. **Koordinaten** aus dem amtlichen Gebäudeadressverzeichnis (swisstopo, api3.geo.admin.ch). Eine Adresse, die dort nicht existiert, bekommt keinen Pin.
4. **Unabhängige Zweitprüfung** (statt Gemini, Kontingent verbraucht): ein zweiter Durchlauf hat jede Halle ohne meine Daten neu im Web gesucht und Betrieb, Adresse, Art und Website bestätigt oder korrigiert. Ergebnis je Halle in `pruef_status` (ok / korrigiert / unsicher) und `notiz`.

**Rechte und Datenschutz:** Übernommen werden nur Fakten (Name, Adresse, Website, Zeiten, Preise), keine Texte, Logos oder Fotos. Keine Personennamen und keine privaten Nummern, nur allgemeine Hallenkontakte. OpenStreetMap war aus der Cloud nicht erreichbar und ist nicht verwendet (also keine ODbL-Pflichten). swisstopo-Geodaten sind frei nutzbar (Quelle nennen: «© swisstopo»).

**Abgrenzung Deutschschweiz:** deutschsprachige Kantone, Biel/Bienne, Oberwallis, Graubünden ohne Italienischbünden. Nicht aufgenommen: Romandie, Tessin, reine Seilparks/Kletterwälder, Fun-Parks (Clip 'n Climb), Hochschul- und Armeeanlagen (ASVZ, Andermatt).

## Was die App zeigt

Die Karte zeigt nur Zeilen mit Koordinaten, nicht ausgeblendet und nicht `unsicher`: **75 Hallen**. Die 9 unsicheren Einträge liegen in der DB, bleiben aber unsichtbar, bis jemand sie bestätigt.

## Unsicher (nicht auf der Karte)

- **Kletterhalle K44 Interlaken**, Interlaken: k44.ch nicht ladbar. Adresse Jungfraustrasse 44 nur auf theCrag; letzte Betriebsmeldung 2020 (Weiterführung durch Paragliding Interlaken GmbH). Aktueller Betrieb 2026 nicht belegt.
- **Sporttreff Zihl Boulderhalle**, Nidau: Adresse Zihlstrasse 74, 2560 Nidau nur in Verzeichnissen; Firma als 'Sporttreff Zihl AG in Liquidation' gelistet. climber.ch ist keine Hallenseite (erwähnt Zihl nicht). Vermutlich geschlossen.
- **Birsmill Boulder**, Laufen: Existiert (kleiner Boulderverein in Laufen BL); keine Strassenadresse auf der Seite, Delsbergerstrasse nicht bestätigt. Öffentlich nur So 13–17 Uhr, Mitglieder 24/7.
- **Kletterhalle Rätikon (SAC Prättigau)**, Küblis: Halle nach Sanierung seit Ende Jan. 2026 wieder offen (7 Tage). Hausnummer widersprüchlich: offizielle Seite 'Hauptstrasse 28', Google-Link dort 'Hauptstrasse 6', praettigau.info '6e', davos.ch '6 c'.
- **Kletterhalle Academia Engiadina**, Samedan: Schul-Website erwähnt keine Kletterhalle; Schuladresse ist Quadratscha 18 (nicht 8). Existenz nur via theCrag/kletterszene; Schulanlage, öffentlicher Zugang nicht belegt.
- **Kletterhalle Sportcenter Olympica**, Brig-Glis: Offizielle Olympica-Seite erwähnt kein Klettern (Adresse dort Industriestrasse 94, 3902 Brig-Glis). 'Im Biel' nur in altem Verzeichnis. Betrieb nicht belegt.
- **Boulderhalle Sport Resort Fiesch**, Fiesch: Sport Resort Fiesch, Feriendorf 1. Aletsch Arena: wegen Bauarbeiten 'bis auf Weiteres geschlossen'. Offizielle Seite Serverfehler.
- **Kletterdome Saas-Fee**, Saas-Fee: Kletterdome im Kreisel des Parkhauses Saas-Fee (Ice and Sound); nur Sekundärquellen, nur ca. 3 Sportkletterrouten, im Winter Eisklettern. Offizielle Seite nicht ladbar; Betrieb 2026 nicht bestätigt.
- **Die Boulderhalle Dübendorf**, Dübendorf: Adresse Stettbachstrasse 4 in Verzeichnissen bestätigt, ABER Betreiberin DIEBOULDERHALLE Dübendorf AG seit 13.09.2023 im Konkurs (SHAB 19.09.2023). Offizielle Seite nicht ladbar (robots). Vermutlich geschlossen, Betrieb 2026 nicht belegt.

## Nicht aufgenommen (geschlossen oder keine Halle)

- **Blockfeld Eschenz**, Eschenz: Offizielle Blockfeld-Seite kennt nur Winterthur; Eschenz/Hauptstrasse 98 nur in Aggregatoren (maps4fun, kletterportal), keine Primärquelle. Wahrscheinlich veraltet/fehlerhaft – eher streichen.
- **Boulder Buchlern (Sportzentrum Buchlern)**, Zürich: Existiert als 'Boulderwürfel' beim Rasenfeld 8 im Sportzentrum Buchlern (Altstetten) – offenbar Outdoor-Anlage mit Holzschnitzel-Fallzone, keine Halle. Eher streichen.
- **Zäziboulder**, Zäziwil: Plattform J (März 2023): Halle in Zäziwil schloss rund fünf Jahre zuvor; BoulderWorb entstand als Nachfolge. kletterkurs.ch nicht ladbar.
- **boulder-gade Arth**, Arth: Betreiberin boulder-gade GmbH (Luzernerstrasse 91, Arth) 2024 aufgelöst, am 30.05.2025 im HR gelöscht. Offizielle Seite nicht ladbar; kein Hinweis auf Weiterbetrieb gefunden.
- **Sportkletterhalle Sargans**, Sargans: Offizielle Seite: Halle bleibt geschlossen, bis ein Betreiber gefunden ist (Kontakt 079 407 43 30).
- **Boulderanlage Sportpark Bergholz**, Wil SG: Existiert als frei zugänglicher Outdoor-Boulderblock südlich des Sportparks Bergholz (seit 2018), keine Halle. Eher streichen.

## Alle Hallen

| Kanton | Ort | Halle | Art | Prüfung | Pin |
|---|---|---|---|---|---|
| AG | Aarau | [Kraftreaktor Aarau](https://kraftreaktor-aarau.ch) | Bouldern | ok | ja |
| AG | Aarburg | [Kletterhalle ISATIS Aarburg](https://isatis.ag) | Seil + Bouldern | korrigiert | ja |
| AG | Baden | [BOUBA Boulder Baden](https://www.boulder-baden.ch) | Bouldern | ok | ja |
| AG | Lenzburg | [Kraftreaktor Lenzburg](https://kraftreaktor.ch) | Seil + Bouldern | ok | ja |
| AG | Windisch | [Blockchäfer Kletter- & Boulderhalle](https://www.blockchaefer.ch) | Seil + Bouldern | ok | ja |
| AI | Appenzell | [chletterai Boulderhalle Appenzell](https://www.chletterai.ch) | Bouldern | ok | ja |
| AR | Herisau | [Kletterhalle Appenzeller Park](https://appenzellerpark.ch/kletterhalle/) | Seil + Bouldern | ok | ja |
| BE | Bern | [BoulderBad Muubeeri](https://www.muubeeri.ch) | Bouldern | ok | ja |
| BE | Bern | [bimano Bern](https://bimano.ch) | Bouldern | ok | ja |
| BE | Biel/Bienne | [Crux Bouldering](https://crux-bouldering.ch) | Bouldern | korrigiert | ja |
| BE | Biel/Bienne | [GRIP Climbing Biel/Bienne](https://gripclimbing.ch) | Seil + Bouldern | ok | ja |
| BE | Burgdorf | [BoulderBurg](https://www.boulderburg.ch) | Bouldern | ok | ja |
| BE | Grindelwald | [Boulderraum Sportzentrum Grindelwald](http://www.sportzentrum-grindelwald.ch/de/boulderraum.html) | Bouldern | ok | ja |
| BE | Gstaad | [Kletterhalle Vertical Gstaad](https://www.gstaad.ch/planen-buchen/poi/detail/kletterhalle-vertical-9) | Seil + Bouldern | ok | ja |
| BE | Gwatt (Thun) | [Klettertreff Thun](https://www.klettertreff.ch) | Seil | ok | ja |
| BE | Horboden | [Kletterwand Sporthalle Wiriehorn](http://www.diemtigtal.ch/poi/kletterwand-sporthalle-wiriehorn) | Seil + Bouldern | korrigiert | ja |
| BE | Interlaken | [Kletterhalle K44 Interlaken](http://www.k44.ch) | Seil + Bouldern | unsicher | ja |
| BE | Langenthal | [manola Boulder](https://www.manola-boulder.ch) | Bouldern | ok | ja |
| BE | Langnau im Emmental | [Climbox Langnau](https://www.climbox.ch) | Seil | korrigiert | – |
| BE | Lenk im Simmental | [BoulderSchüür Lenk]() | Bouldern | ok | – |
| BE | Lenk im Simmental | [Kletterhalle Reit- und Sportzentrum Lenk](http://www.lenksportundevents.ch) | Seil | korrigiert | – |
| BE | Meiringen | [Kletterhalle Haslital](https://www.kletterhalle-haslital.ch) | Seil + Bouldern | ok | ja |
| BE | Nidau | [Sporttreff Zihl Boulderhalle](http://www.climber.ch) | Bouldern | unsicher | ja |
| BE | Niederwangen | [MAGNET Trainingszentrum](https://www.klettern-bern.ch) | Seil + Bouldern | ok | ja |
| BE | Ostermundigen | [O'BLOC Bouldern und Klettern](https://obloc.ch) | Seil + Bouldern | ok | ja |
| BE | Steffisburg | [griffbar Boulderwand Thun](https://griffbar.ch) | Bouldern | ok | ja |
| BE | Sumiswald | [Kletterhalle Forum Sumiswald](https://www.forum-sumiswald.ch/infos/kletterhalle/) | Seil + Bouldern | ok | ja |
| BE | Wilderswil | [Orbit Interlaken](https://orbit-interlaken.ch) | Seil + Bouldern | ok | ja |
| BE | Worb | [BoulderWorb]() | Bouldern | ok | ja |
| BL | Laufen | [Birsmill Boulder](https://www.birsmillboulder.ch) | Bouldern | unsicher | – |
| BL | Laufen | [Kletterhalle Laufen](https://www.sac-hohewinde.ch/kletterhalle/) | Seil + Bouldern | korrigiert | ja |
| BL | Liestal | [hebdi Boulderhalle & Klettersilo](https://www.hebdi.rocks) | Seil + Bouldern | ok | ja |
| BL | Pratteln | [B2 Boulders & Bar](https://bzwei.ch) | Bouldern | ok | ja |
| BS | Basel | [ELYS Boulderloft](https://www.boulderloft.ch) | Bouldern | ok | ja |
| BS | Basel | [Kletterhalle 7 (K7)](https://www.kletterhalle7.ch) | Seil + Bouldern | ok | ja |
| GL | Näfels | [lintharena Kletterhallen & GLKB Boulderhalle](https://www.lintharena.ch/Sport-Wellness/Klettern-Bouldern/Kletterhallen) | Seil + Bouldern | ok | ja |
| GR | Chur | [Kletterzentrum Ap 'n Daun](https://www.kletterzentrumchur.ch) | Seil + Bouldern | ok | ja |
| GR | Davos Platz | [Kletterwand Sporthalle Färbi Davos](https://faerbidavos.ch/sport/#klettern) | Seil + Bouldern | korrigiert | ja |
| GR | Disentis/Mustér | [Kletterhalle Center Fontauna](https://www.centerfontauna.ch) | Seil + Bouldern | ok | ja |
| GR | Domat/Ems | [Quadrel Boulderhalle](https://www.quadrel.ch) | Bouldern | ok | ja |
| GR | Küblis | [Kletterhalle Rätikon (SAC Prättigau)](https://kletterhalle-raetikon.ch) | Seil + Bouldern | unsicher | ja |
| GR | S-chanf | [Serlas Climb Kletter- und Boulderhalle](https://www.serlas.ch/climb/) | Seil + Bouldern | ok | ja |
| GR | Samedan | [Kletterhalle Academia Engiadina](https://www.academia-engiadina.ch) | ? | unsicher | – |
| GR | Scuol | [Mountain Gecko Boulderhalle](https://www.mountain-gecko.ch) | Bouldern | ok | ja |
| LU | Ettiswil | [Bouldergate Ettiswil](https://www.bouldergate.ch) | Bouldern | ok | ja |
| LU | Kriens | [Cityboulder Kriens](https://www.cityboulder.ch) | Bouldern | ok | ja |
| LU | Root D4 | [Pilatus Indoor](https://www.pilatusindoor.ch) | Seil + Bouldern | korrigiert | ja |
| LU | Sursee | [Boulder Arena Sursee](http://boulder-arena.ch) | Bouldern | ok | ja |
| LU | Wolhusen | [Kletterhalle Wolhusen](https://www.sac-entlebuch.ch/kletterhalle/) | Seil + Bouldern | ok | ja |
| OW | Engelberg | [Boulderhalle Südwand Engelberg](https://www.engelberg.ch) | Bouldern | ok | ja |
| OW | Engelberg | [Kletterhalle Sporting Park Engelberg](https://de.sportingpark.ch/sports/klettern/) | Seil | ok | ja |
| SG | Buchs SG | [Sparta Bouldering](https://sparta-bouldering.com) | Bouldern | ok | ja |
| SG | Flums | [Boulderei Flums](http://www.boulderei.ch) | Bouldern | ok | ja |
| SG | Lichtensteig | [Kletterwand Lichtensteig (Freudeghalle)](https://sac-toggenburg.ch/kletterwand) | Seil | korrigiert | ja |
| SG | Rapperswil-Jona | [Quergang Boulderhalle](https://www.quergang.ch) | Bouldern | ok | ja |
| SG | St. Gallen | [Boulderlounge St. Gallen](https://www.boulderlounge.ch) | Bouldern | ok | ja |
| SG | St. Gallen | [Kletterzentrum St. Gallen](https://kletterzentrum-sg.ch) | Seil + Bouldern | ok | ja |
| SG | Unterwasser (Wildhaus-Alt St. Johann) | [Boulderbox Unterwasser](https://www.boulderbox.ch) | Bouldern | ok | ja |
| SH | Schaffhausen | [Aranea+ Kletter- und Badmintonzentrum](https://www.aranea.ch) | Seil + Bouldern | ok | ja |
| SO | Olten | [Momentum Skate- und Kletterhalle](https://www.momentumolten.ch) | Seil + Bouldern | ok | ja |
| SO | Solothurn | [bimano Solothurn](https://bimanosolothurn.ch) | Bouldern | korrigiert | ja |
| SZ | Ibach | [Spinnerei Indoor](https://www.spinnerei-indoor.ch) | Bouldern | ok | ja |
| TG | Kreuzlingen | [Kletterhalle SAC Bodan](https://sac-bodan.ch/kletterhalle/) | Seil + Bouldern | ok | ja |
| TG | Tägerwilen | [Kletterzentrum Thurgau](https://www.kletterzentrum-tg.ch) | Seil + Bouldern | ok | ja |
| TG | Weinfelden | [thurclimb Kletterhalle](https://www.thurclimb.ch) | Seil + Bouldern | ok | – |
| UR | Schattdorf | [Granit Indoor](http://www.granitindoor.ch) | Bouldern | korrigiert | ja |
| VS | Baltschieder | [Vertic-Halle Baltschieder](https://www.vertic-halle.ch) | Seil + Bouldern | ok | ja |
| VS | Brig-Glis | [Kletterhalle Sportcenter Olympica](https://www.olympica.ch) | ? | unsicher | – |
| VS | Fiesch | [Boulderhalle Sport Resort Fiesch](https://www.sport-resort.ch/erleben-bewegen/indoor/boulderhalle) | Bouldern | unsicher | – |
| VS | Randa | [Randaboulder](https://www.randaboulder.ch) | Bouldern | korrigiert | ja |
| VS | Saas-Fee | [Kletterdome Saas-Fee](https://www.iceandsound.com/kletterdome) | Seil | unsicher | – |
| VS | Zermatt | [Triftbachhalle Zermatt](https://sac.zermatt.ch/verein/kletterwand/) | Seil | korrigiert | ja |
| ZG | Baar | [BoulderBaar](https://boulderbaar.ch) | Bouldern | ok | ja |
| ZH | Adliswil | [Boulderhalle Adliswil (climbing.ch)](https://www.climbing.ch) | Bouldern | ok | ja |
| ZH | Bassersdorf | [Grindelboulder](https://grindelboulder.ch) | Bouldern | ok | ja |
| ZH | Bülach | [Kletter- und Boulderhalle Hirslen](https://www.buelach.ch/dienstleistungen/100666) | Seil + Bouldern | ok | ja |
| ZH | Dübendorf | [Die Boulderhalle Dübendorf](https://dieboulderhalle.ch) | Bouldern | unsicher | ja |
| ZH | Greifensee | [Kletterzentrum Gaswerk Greifensee (Milandia)](https://www.kletterzentrum.com/standorte/greifensee/) | Seil + Bouldern | ok | ja |
| ZH | Schlieren | [Boulderlounge Schlieren](https://www.boulderlounge.ch/schlieren/) | Bouldern | korrigiert | ja |
| ZH | Schlieren | [Kletterzentrum Gaswerk Schlieren](https://www.kletterzentrum.com/standorte/schlieren/) | Seil + Bouldern | ok | ja |
| ZH | Thalwil | [9grad Boulderpark Thalwil](https://www.boulderpark-thalwil.ch) | Bouldern | ok | ja |
| ZH | Uster | [Griffig Kletterhalle Uster](https://www.griffig.com) | Seil + Bouldern | ok | ja |
| ZH | Winterthur | [6a plus Kletterhalle Winterthur](https://www.sechsaplus.ch) | Seil + Bouldern | ok | ja |
| ZH | Winterthur | [Blockfeld Boulderpark Winterthur](https://blockfeld.ch) | Bouldern | ok | ja |
| ZH | Wädenswil | [Kletterzentrum Gaswerk Wädenswil](https://www.kletterzentrum.com/standorte/waedenswil/) | Seil + Bouldern | ok | ja |
| ZH | Wädenswil | [rüümli94 Boulderhalle](https://rüümli.ch) | Bouldern | ok | ja |
| ZH | Zürich | [Minimum Flüela](https://minimum.ch) | Bouldern | ok | ja |
| ZH | Zürich | [Minimum Leutsch](https://minimum.ch) | Bouldern | ok | ja |

## Pflege

Öffnungszeiten und Preise sind eine Momentaufnahme vom 29.10.2026. Das Seed-Skript ist wiederholbar (gleicher Name + PLZ wird aktualisiert, `gym_id` und `ausgeblendet` bleiben). BoulderBad Muubeeri Bern schliesst am 31.12.2026 und sollte dann ausgeblendet werden.
