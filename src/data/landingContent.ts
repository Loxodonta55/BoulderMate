export interface LandingFeature {
  id: string;
  title: string;
  badge: string;
  tagline: string;
  description: string;
  bullets: string[];
  mockupImage: string;
  previewType: 'wall' | 'profile' | 'logging' | 'discussion' | 'community' | 'setter_studio' | 'setter_feedback';
}

export const CLIMBER_FEATURES: LandingFeature[] = [
  {
    id: 'cool-boulders',
    title: 'Welche Boulder sind cool?',
    badge: 'Perlen-Finder',
    tagline: 'Die absoluten Highlights und Spaßgaranten deiner Halle sofort an der Wand entdecken',
    description:
      'Deine Haut und Energie an der Wand sind kostbar. Niemand will Zeit an langweiligen Zügen verschwenden: Sieh auf echten Wandfotos sofort, welche Linien die unbestrittenen Perlen des Schraubzyklus sind, welche Routen der Community am meisten Spaß machen und wo echter Bewegungsfluss wartet.',
    bullets: [
      'Community-Favoriten & Sterne-Highlights auf einen Blick',
      'Echte Wandfotos mit farbcodierten Pins für jede Grifffarbe',
      'Nie wieder Kraft an uninspirierten Linien verschwenden'
    ],
    mockupImage: '/images/walls/six-a-comp.jpg',
    previewType: 'wall'
  },
  {
    id: 'style-match',
    title: 'Welche passen zu mir?',
    badge: 'Style-Match',
    tagline: 'Finde Routen, die genau zu deinen Stärken, Vorlieben und Zielen passen',
    description:
      'Liebst du filigrane Platten-Balance, steile Dach-Power oder dynamische Sprünge? Das 5-Achsen-Radar (Maximalkraft, Kraft-Ausdauer, Technik, Balance, Koordination, Flexibilität) matcht Boulder mit deinem Style und zeigt dir genau die Linien, an denen du wächst oder dein nächstes Level knackst.',
    bullets: [
      '5-Achsen-Radar für Maximalkraft, Balance, Dynamik & Technik',
      'Stärken & Baustellen objektiv gegen den Hallenschnitt abgleichen',
      'Finde zielsicher die Projekte, die dich weiterbringen'
    ],
    mockupImage: '/images/walls/six-a-slab.jpg',
    previewType: 'profile'
  },
  {
    id: 'chalk-proof-logging',
    title: 'Tracken ohne Frust',
    badge: '2-Tap Flow',
    tagline: 'Erfolge mit kreidigen Fingern direkt auf der Matte in zwei Sekunden festhalten',
    description:
      'Du stehst auf der Matte, das Adrenalin pumpt, die Hände voll Chalk: Kein langes Tippen, kein Formular-Wahnsinn. Ein Fingertipp auf den Pin der Route, ein zweiter auf Flash ⚡, Top ✅ oder Projekt 🎯 – in zwei Sekunden geloggt. Deine Historie wächst automatisch über alle Hallenbesuche mit.',
    bullets: [
      'Große, kontraststarke Tasten – speziell für kreidige Finger',
      'Flash, Top & Projekt in unter 2 Sekunden erfassen',
      'Automatische Historie & persönliche Boulderpyramide'
    ],
    mockupImage: '/images/walls/overhang.jpg',
    previewType: 'logging'
  },
  {
    id: 'beta-talk',
    title: 'Diskutieren & Beta-Talk',
    badge: 'Zusammen knacken',
    tagline: 'Die klassische Matten-Diskussion zieht digital direkt an den Boulder',
    description:
      'Wo liegt der versteckte Heelhook? Welcher Micro-Tritt macht die Crux leicht? Tausche Beta direkt am Pin der Route aus, diskutiere knifflige Schlüsselstellen mit der Community und knackt schwere Projekte gemeinsam.',
    bullets: [
      'Beta-Tipps & Crux-Tricks direkt am Pin angeheftet',
      'Echtzeit-Austausch ohne externe Messenger-Gruppen',
      'Gemeinsam tüfteln und Matten-Erfolge feiern'
    ],
    mockupImage: '/images/walls/six-a-roof.jpg',
    previewType: 'discussion'
  },
  {
    id: 'community-barometer',
    title: 'Faire Grade im Barometer',
    badge: 'Kein Sandbagging',
    tagline: 'Demokratische Grade-Findung statt subjektiver Schrauber-Willkür',
    description:
      'Wie schwer klettert sich die Route in Wirklichkeit? Das Community-Barometer (Soft / Fair / Stiff) und 5-Sterne-Qualitätsratings decken ehrlich auf, wie sich die Route anfühlt – für eine ehrliche, transparente Hallen-Schwierigkeit getragen von allen Kletterern.',
    bullets: [
      'Mit einem Tap im Barometer abstimmen (Soft / Fair / Stiff)',
      '5-Sterne-Bewertung für Routenbau-Qualität & Spaßfaktor',
      'Demokratischer Konsens-Grad aus hunderten Begehungen'
    ],
    mockupImage: '/images/walls/roof.jpg',
    previewType: 'community'
  }
];

export const SETTER_FEATURES: LandingFeature[] = [
  {
    id: 'batch-workflow',
    title: 'Batch-Foto-Erfassung in unter 3 Minuten',
    badge: 'Schrauber-Studio',
    tagline: 'Nach dem Schraubtag eine Wand mit ~8 Bouldern in unter 3 Minuten erfassen',
    description:
      'Keine Zettel, keine Whiteboards, keine lästigen Kladde-Listen: Wand mit dem Smartphone fotografieren, Start- und Top-Positionen jedes neuen Boulders per Fingertipp markieren, Grifffarbe und Anfangsgrad wählen – fertig. Vom Akkuschrauber in Rekordzeit direkt ins digitale Topo.',
    bullets: [
      'Wandfoto schießen und Griffe direkt per Fingertipp platzieren',
      'Schnell-Zuweisung von Grifffarbe, Hallengrad & 5-Achsen-Radar',
      'Kompletter Sektor mit 8–10 Routen in unter 3 Minuten online'
    ],
    mockupImage: '/images/walls/six-a-roof.jpg',
    previewType: 'setter_studio'
  },
  {
    id: 'setter-feedback',
    title: 'Echtzeit-Feedback & Community-Resonanz',
    badge: 'Resonanz',
    tagline: 'Echtes Feedback von der Matte statt Schrauber-Tunnelblick',
    description:
      'Erhalte transparente Einblicke von den Kletterern: Welche Linien werden am meisten geflasht? Wo empfindet die Community den Grad als zu soft oder zu stiff? Welcher Boulder ist die Perle des Sektors? Archivierung alter Linien gelingt bei jedem neuen Schraubzyklus per Knopfdruck.',
    bullets: [
      'Echtzeit-Barometer: Wurde die Route zu hart oder zu weich geschraubt?',
      'Qualitäts-Sterne & Beliebtheitsquoten deiner Routen',
      'Archivierung alter Linien bei Neuschrauben auf Knopfdruck'
    ],
    mockupImage: '/images/walls/six-a-comp.jpg',
    previewType: 'setter_feedback'
  }
];
