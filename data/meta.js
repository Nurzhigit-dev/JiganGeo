/*
 * meta.js — the "GeoGuessr school" content: how to read a street scene.
 *
 * Hand-written, not generated. Structured as:
 *   funnel    — the order you should look at things, with what each step rules out
 *   countries — a profile per country in the starter set
 *   clues     — drillable items, each with an original SVG diagram
 *   confusions— the pairs people actually mix up, and the tiebreaker
 *
 * Every SVG uses currentColor / CSS custom properties so the diagrams work in
 * both themes. Sources for the underlying facts are listed in README.md.
 */
window.DATA_META = {

  /* ---------------------------------------------------------------- FUNNEL */
  // The single most useful idea in the whole module: look at things in the
  // order of how much of the world they eliminate, not in the order you notice
  // them. Bollards are famous, but they are a *confirmation* tool — you should
  // already have a shortlist before you look at one.
  funnel: [
    {
      id: 'driving',
      seconds: '0–2s',
      title: 'Which side of the road?',
      eliminates: 'Splits the world roughly 65 / 35.',
      how: 'Look at parked cars, the position of the Google car in its lane, and which side road signs face. Do not trust a single car — look at the lane the camera is driving in.',
      note: 'Left-hand traffic is mostly the UK and its former empire plus Japan, Indonesia and Thailand. In this starter set: Japan and South Africa drive on the left; France, Brazil, Russia and the USA drive on the right.',
    },
    {
      id: 'script',
      seconds: '0–2s',
      title: 'What script is the writing in?',
      eliminates: 'A non-Latin script usually gets you to a handful of countries instantly.',
      how: 'Any sign will do — shop fronts, road signs, a van door. You are not reading it, just identifying the alphabet.',
      note: 'Cyrillic → Russia and its neighbours. Kanji + kana → Japan. Latin covers most of the rest, so you then need the *language*: Portuguese (ã, ç, "PARE") vs Spanish, French accents (é, è, ç), Afrikaans (double vowels, "straat").',
    },
    {
      id: 'landscape',
      seconds: '2–5s',
      title: 'Climate, soil and vegetation',
      eliminates: 'Cuts the shortlist to a band of latitude.',
      how: 'Look at soil colour, tree species, whether the ground is irrigated or dry, and the angle of the sun.',
      note: 'Red laterite soil → tropics (Brazil, parts of Africa). Birch and pine → Russia and the north. Eucalyptus → Brazil, Australia, South Africa, Iberia. Terraced rice → East and Southeast Asia.',
    },
    {
      id: 'sun',
      seconds: '2–5s',
      title: 'Which hemisphere?',
      eliminates: 'Halves whatever is left.',
      how: 'Find the shadows. At midday in the northern hemisphere the sun sits in the south, so shadows point north; south of the equator it is the reverse.',
      note: 'This is most reliable when the sun is high and the shadow is short. Near the equator it tells you nothing.',
    },
    {
      id: 'lines',
      seconds: '2–5s',
      title: 'Road markings',
      eliminates: 'Cleanly separates Europe from the Americas.',
      how: 'Look at the centre line colour first, then the edge lines.',
      note: 'Yellow centre lines → the Americas (USA, Canada, Mexico, Brazil). White centre lines → almost all of Europe, with Norway and Finland the notable exceptions. A yellow *edge* line is a strong southern-Africa marker.',
    },
    {
      id: 'infra',
      seconds: '5–15s',
      title: 'Bollards, poles and guardrails',
      eliminates: 'Confirms one country out of a shortlist of three or four.',
      how: 'Bollards are nationally standardised, so the shape, cap colour and reflector pattern are close to a fingerprint. Utility poles vary in material and cross-section.',
      note: 'Use this to *confirm*, not to search. Trying to identify a country from a bollard alone means recalling 100+ designs; confirming one out of three is easy.',
    },
    {
      id: 'plates',
      seconds: '15–30s',
      title: 'Plates, signage and businesses',
      eliminates: 'Often gets you to the region, not just the country.',
      how: 'Zoom into a parked car\'s plate, read shop names, look for phone numbers and web domains on vans.',
      note: 'Phone country codes and .xx domains on a signwritten van are the most under-used clue in the game. A domain is unambiguous in a way a tree never is.',
    },
    {
      id: 'car',
      seconds: 'anytime',
      title: 'The Google car and camera generation',
      eliminates: 'Sometimes pins a country outright.',
      how: 'Look down at the car, and at the quality and colour cast of the image itself.',
      note: 'Blurry, low-resolution imagery points at old Generation 1 or 2 coverage. Crisp, near-photographic imagery is Generation 4. Some countries have a distinctive car: Russia is often a black car with long antennae, Brazil and Colombia frequently show a short black roof antenna, and a black SUV with a snorkel on the front-right fender is the famous Kenya tell.',
    },
  ],

  /* ------------------------------------------------------------- COUNTRIES */
  countries: {
    JP: {
      name: 'Japan', flag: '🇯🇵', drivingSide: 'left', domain: '.jp', phone: '+81',
      script: 'Kanji, hiragana and katakana mixed together in the same sentence.',
      summary: 'Dense overhead wiring, immaculate road surfaces, vending machines everywhere, and left-hand traffic. Once you have seen Japanese kana you are done — the difficulty is region, not country.',
      lines: 'White centre lines. A **yellow** centre line means overtaking is prohibited, not a change of country. Edge lines white.',
      bollards: 'European-style bollards are rare. What you get instead in the north is snow poles — red-and-white striped poles hanging over the verge with a downward arrow, marking the road edge under snow.',
      poles: 'Slim concrete or steel poles carrying an extremely dense tangle of wires, usually with a small numbered identification plate bolted at eye height.',
      plates: 'Small, tall-ish plates. White with green characters for private cars, **yellow with black for kei cars** (the tiny 660cc class — a very reliable Japan tell), and green with white for commercial vehicles. The issuing office name is printed in kanji at the top, which narrows the region.',
      signage: 'The stop sign is a **red downward-pointing triangle** reading 止まれ — not an octagon. Blue-and-white direction signs carry romaji under the kanji.',
      architecture: 'Grey or blue glazed ceramic roof tiles (kawara), narrow houses built to the plot line, and near-universal overhead power.',
      camera: 'Mostly Generation 3 and 4, often with no car visible at all.',
      regions: [
        { name: 'Hokkaido', tell: 'Wide, straight, grid-planned roads, snow poles everywhere, birch and larch rather than cedar, and no rice terracing. Feels more like Canada than Japan.' },
        { name: 'Okinawa', tell: 'Subtropical: red barrel tiles, concrete flat-roofed houses built for typhoons, shisa lion statues on the roofs, sugarcane, and English on US base signage.' },
        { name: 'Tohoku / Hokuriku', tell: 'Snow country. Snow poles, steep dark roofs, and sprinkler nozzles set into the road surface to melt snow.' },
        { name: 'Kanto / Kansai', tell: 'Continuous dense urban sprawl, elevated expressways, and the highest density of overhead wiring.' },
      ],
    },
    FR: {
      name: 'France', flag: '🇫🇷', drivingSide: 'right', domain: '.fr', phone: '+33',
      script: 'Latin, French. Look for é, è, ê, ç and words like "rue", "chemin", "sortie".',
      summary: 'White road lines, red-topped bollards, plane trees in the south, and a green neon pharmacy cross in every town. The hard part is the département, not the country.',
      lines: 'White centre lines like the rest of continental Europe. Rural roads often have dashed white edge lines.',
      bollards: 'A white or light-grey post with a **red band wrapped right around the top** and a red reflector on the face. This is the single most useful French confirmation clue.',
      poles: 'Concrete poles in most of the country, wooden in rural areas. Wiring is far less dense than Japan and often buried in towns.',
      plates: 'EU format: a blue strip with the EU stars and **F** on the left, black characters on white, and a second blue strip on the right carrying a regional logo above a **département number**. Careful: since the 2009 SIV system the owner may pick *any* département number, so treat it as a strong hint rather than proof.',
      signage: 'Town entry signs are white with a **red border**. Diversions and temporary works are yellow. A tabac is marked by a red diamond or "carotte".',
      architecture: 'Slate roofs and brick in the north, half-timbering in Normandy and Alsace, terracotta barrel tiles and pale stone in the south.',
      camera: 'Predominantly Generation 3 and 4.',
      regions: [
        { name: 'Provence-Alpes-Côte d\'Azur', tell: 'Plane trees planted in rows along the road, dry limestone hills, terracotta roofs, and a hard bright light.' },
        { name: 'Bretagne', tell: 'Granite buildings, bilingual French/Breton place-name signs, hedged field boundaries and a lot of grey sky.' },
        { name: 'Alsace / Grand Est', tell: 'German-influenced half-timbered houses, Germanic place names ending in -heim or -willer, vineyards on the slope.' },
        { name: 'Hauts-de-France', tell: 'Red brick terraces, flat beet and wheat country, and slag heaps near the old coalfield.' },
        { name: 'Île-de-France', tell: 'Dense suburb, pale Haussmann stone in the centre, and the highest sign density in the country.' },
      ],
    },
    BR: {
      name: 'Brazil', flag: '🇧🇷', drivingSide: 'right', domain: '.br', phone: '+55',
      script: 'Latin, Portuguese. Look for ã, õ, ç and word endings in -ção and -ões.',
      summary: 'Yellow centre lines plus Portuguese is effectively a Brazil lock. Red soil and rectangular concrete poles confirm it.',
      lines: 'Yellow centre lines, white edge lines — the Americas pattern.',
      bollards: 'White posts with a red or orange reflective band. Less standardised than in Europe, so lean on poles and soil instead.',
      poles: 'Concrete poles with a distinctly **rectangular cross-section**, often with visible casting holes. This is one of the best Brazil confirmations.',
      plates: 'Mercosur plates since 2018: a blue strip across the top with BRASIL, black characters on white below. Older plates are grey with a coloured band.',
      signage: 'The stop sign reads **PARE**. Chevrons are typically yellow on black.',
      architecture: 'Unrendered breeze-block and brick is extremely common, with rebar left protruding for a future storey.',
      camera: 'Mixed generations; a short black roof antenna is often visible, shared with Colombia.',
      regions: [
        { name: 'Amazônia (north)', tell: 'Dense rainforest wall right up to the road, red laterite, few markings.' },
        { name: 'Nordeste', tell: 'Dry caatinga scrub, pale sandy soil, palms, and poorer road surfaces.' },
        { name: 'Sul', tell: 'Temperate: araucária pines, German and Italian place names, better road furniture.' },
      ],
    },
    RU: {
      name: 'Russia', flag: '🇷🇺', drivingSide: 'right', domain: '.ru', phone: '+7',
      script: 'Cyrillic. Distinctive letters to spot: Ж, Ф, Ы, Я, Д.',
      summary: 'Cyrillic plus birch forest plus concrete apartment blocks. The challenge is separating Russia from Ukraine, Belarus and Kazakhstan, which also use Cyrillic.',
      lines: 'White markings, frequently worn away or absent entirely on rural roads.',
      bollards: 'Posts painted in **black-and-white stripes**, most often at intersections, bridge approaches and culverts rather than continuously along the road.',
      poles: 'Concrete poles are standard, and metal lattice pylons turn up even on ordinary residential streets — an unusual sight elsewhere.',
      plates: 'White plate, black characters, with a **blue band on the right carrying RUS and a region number** above a small flag. The region number is a genuine regional clue.',
      signage: 'Blue-and-white direction signs. Distances in kilometres, all in Cyrillic.',
      architecture: 'Soviet-era panel apartment blocks, and wooden dachas with painted carved window surrounds (nalichniki) in villages.',
      camera: 'Often a black car with long antennae; a great deal of Generation 3 coverage.',
      regions: [
        { name: 'European Russia', tell: 'Birch and mixed forest, denser towns, better roads.' },
        { name: 'Siberia', tell: 'Taiga, very long straight roads, and heavy snow poles.' },
        { name: 'Caucasus', tell: 'Mountains, minarets in places, and noticeably different vegetation.' },
      ],
    },
    US: {
      name: 'United States', flag: '🇺🇸', drivingSide: 'right', domain: '.com / .us', phone: '+1',
      script: 'Latin, English.',
      summary: 'Yellow centre lines plus English plus wooden poles. Blurry old imagery is a US hint, because the USA has more surviving first-generation coverage than anywhere else.',
      lines: 'Yellow centre lines separating opposing traffic, white edge lines and white lane dividers.',
      bollards: 'Proper bollards are rare. Instead you get flexible plastic delineator posts, usually white or orange with a reflective band.',
      poles: 'Predominantly **wooden** poles, often with a cylindrical transformer can mounted partway up. Wooden poles plus yellow lines is a very strong North America signal.',
      plates: 'Wide, short North American format. Designs vary by state, which makes them a regional clue if you can read one.',
      signage: 'Red octagonal STOP, green highway guide signs, yellow diamond warnings, and route shields (the shape of the shield differs between Interstate, US and state routes).',
      architecture: 'Timber-frame housing, deep front setbacks, wide roads, kerbside mailboxes and fire hydrants.',
      camera: 'A lot of old Generation 1 and 2 coverage survives on rural roads — if the image is very blurry, think USA, Australia, New Zealand or Canada first.',
      regions: [
        { name: 'Southwest', tell: 'Desert scrub, red rock, dry washes, and adobe or stucco walls.' },
        { name: 'Northeast', tell: 'Deciduous forest, older brick towns, stone walls at field edges.' },
        { name: 'Midwest', tell: 'Grid roads exactly one mile apart, maize and soy, grain silos.' },
        { name: 'Pacific Northwest', tell: 'Conifer, moss, wet tarmac, and Douglas fir plantations.' },
      ],
    },
    ZA: {
      name: 'South Africa', flag: '🇿🇦', drivingSide: 'left', domain: '.co.za', phone: '+27',
      script: 'Latin. English and Afrikaans side by side, plus Zulu and Xhosa.',
      summary: 'Left-hand traffic plus a yellow edge line plus English signage. Afrikaans on a sign settles it immediately.',
      lines: 'White centre line with **yellow edge lines** — that yellow edge is the standout southern-Africa marker, and it separates South Africa from most of the left-driving world.',
      bollards: 'White posts with a red reflector, usually at culverts and bends.',
      poles: 'A mix of wooden and concrete poles; long runs of unfenced road with no poles at all are common.',
      plates: 'White plates with black characters. The province is encoded in the letters — GP for Gauteng, CA and WC for the Western Cape, ND for KwaZulu-Natal.',
      signage: 'Blue-and-white and green-and-white direction signs, often bilingual. Traffic lights are called robots locally, and you will see that word on signs.',
      architecture: 'Corrugated-iron roofs are extremely common, walled suburban plots with electric fencing, and informal settlements near the big cities.',
      camera: 'Generally good modern coverage. Do not look for the snorkel here — the snorkel SUV is Kenya, not South Africa.',
      regions: [
        { name: 'Western Cape', tell: 'Fynbos scrub, vineyards, dramatic mountains, and Cape Dutch gables.' },
        { name: 'Gauteng', tell: 'Dense urban, jacaranda trees flowering purple, mine dumps.' },
        { name: 'KwaZulu-Natal', tell: 'Subtropical green, sugarcane, rolling hills.' },
        { name: 'Karoo', tell: 'Semi-desert, huge flat horizons, windmill water pumps.' },
      ],
    },
  },

  /* ----------------------------------------------------------------- CLUES */
  // Drillable items. `svg` is an original diagram; `answer` is the country id.
  clues: [
    /* --- bollards ------------------------------------------------------- */
    {
      id: 'bol-fr', category: 'bollard', answer: 'FR',
      title: 'White post, red band all the way round the top',
      detail: 'The French bollard. A red band wraps the whole top of the post, with a red reflector on the face. Compare with Italy, where the red is only a reflector patch on a black strip.',
      svg: 'bollard-fr',
    },
    {
      id: 'bol-it', category: 'bollard', answer: 'IT', extra: true,
      answerName: 'Italy', answerFlag: '🇮🇹',
      title: 'White post, black strip, red reflector on the front only',
      detail: 'Italy. The give-away is the black vertical plastic strip housing the reflector — red facing you, white facing away. Included here as the classic French confusion.',
      svg: 'bollard-it',
    },
    {
      id: 'bol-ru', category: 'bollard', answer: 'RU',
      title: 'Black and white striped post',
      detail: 'Russia and much of the former USSR. Usually at intersections, bridge parapets and culverts rather than running continuously along the verge.',
      svg: 'bollard-ru',
    },
    {
      id: 'bol-jp', category: 'bollard', answer: 'JP',
      title: 'Red and white striped pole with a downward arrow',
      detail: 'Japanese snow pole. It hangs over the edge of the carriageway so drivers can see where the road ends once snow has covered it. Tells you both the country and that you are in snow country — Hokkaido, Tohoku or Hokuriku, not Kyushu.',
      svg: 'bollard-jp',
    },
    {
      id: 'bol-us', category: 'bollard', answer: 'US',
      title: 'Flexible plastic delineator with a reflective band',
      detail: 'North America. Thin, whippy, usually white or orange, and often bent out of shape. Real concrete or plastic bollards of the European kind are rare in the USA.',
      svg: 'bollard-us',
    },
    {
      id: 'bol-br', category: 'bollard', answer: 'BR',
      title: 'White post with an orange-red reflective band',
      detail: 'Brazil. Less standardised than European bollards, so do not lean on it alone — check the pole cross-section and soil colour instead.',
      svg: 'bollard-br',
    },

    /* --- road lines ----------------------------------------------------- */
    {
      id: 'line-eu', category: 'lines', answer: 'FR',
      title: 'White centre line, white edge lines',
      detail: 'Continental Europe, including France. Almost every European country uses white to separate opposing traffic. Norway and Finland are the exceptions and use yellow.',
      svg: 'lines-white',
    },
    {
      id: 'line-am', category: 'lines', answer: 'US',
      title: 'Yellow centre line, white edge lines',
      detail: 'The Americas. Yellow separates traffic going in opposite directions; white separates lanes going the same way. Seeing yellow in the middle rules out nearly all of Europe.',
      svg: 'lines-yellow',
    },
    {
      id: 'line-br', category: 'lines', answer: 'BR',
      title: 'Yellow centre line with Portuguese signage',
      detail: 'Brazil. The line pattern matches the USA, so the language does the work: PARE on the stop sign, and -ção word endings.',
      svg: 'lines-yellow',
    },
    {
      id: 'line-za', category: 'lines', answer: 'ZA',
      title: 'White centre line with yellow EDGE lines',
      detail: 'Southern Africa. The yellow is on the outside, not the middle — the reverse of the American pattern. Combined with left-hand traffic this is close to conclusive.',
      svg: 'lines-za',
    },

    /* --- utility poles --------------------------------------------------- */
    {
      id: 'pole-us', category: 'pole', answer: 'US',
      title: 'Wooden pole with a barrel transformer',
      detail: 'North America. Untreated-looking timber, a cylindrical transformer can, and a crossarm near the top.',
      svg: 'pole-us',
    },
    {
      id: 'pole-br', category: 'pole', answer: 'BR',
      title: 'Concrete pole, rectangular in cross-section',
      detail: 'Brazil. The flat rectangular profile with visible casting holes is unusual and is one of the strongest Brazil confirmations.',
      svg: 'pole-br',
    },
    {
      id: 'pole-jp', category: 'pole', answer: 'JP',
      title: 'Slim pole under a huge tangle of wires',
      detail: 'Japan. The wire density is the tell rather than the pole itself — transformers, drums and dozens of lines stacked at every level, with a small numbered plate at eye height.',
      svg: 'pole-jp',
    },
    {
      id: 'pole-ru', category: 'pole', answer: 'RU',
      title: 'Steel lattice pylon on a residential street',
      detail: 'Russia. Full lattice towers standing in ordinary streets, where most countries would use a single pole, is a distinctive post-Soviet sight.',
      svg: 'pole-ru',
    },

    /* --- plates ---------------------------------------------------------- */
    {
      id: 'plate-fr', category: 'plate', answer: 'FR',
      title: 'EU blue strip left, regional logo and number right',
      detail: 'France. Two blue bands: EU stars with F on the left, and a regional logo above a département number on the right. Since 2009 drivers may choose any département number, so read it as a hint, not proof.',
      svg: 'plate-fr',
    },
    {
      id: 'plate-jp', category: 'plate', answer: 'JP',
      title: 'Small yellow plate with black characters',
      detail: 'Japan, kei car. Yellow-on-black marks the 660cc microcar class, which barely exists outside Japan. Private cars are green on white; commercial vehicles are white on green.',
      svg: 'plate-jp',
    },
    {
      id: 'plate-ru', category: 'plate', answer: 'RU',
      title: 'White plate with a right-hand band reading RUS',
      detail: 'Russia. The narrow band on the right carries a region number above RUS and a small flag. The region number genuinely localises the car.',
      svg: 'plate-ru',
    },
    {
      id: 'plate-us', category: 'plate', answer: 'US',
      title: 'Wide, short plate with a coloured state design',
      detail: 'North America. The aspect ratio alone separates it from the long, narrow EU format. The graphic design differs per state.',
      svg: 'plate-us',
    },
    {
      id: 'plate-br', category: 'plate', answer: 'BR',
      title: 'Blue strip across the top reading BRASIL',
      detail: 'Brazil, Mercosur pattern. The blue band runs along the whole top edge rather than down one side as in the EU.',
      svg: 'plate-br',
    },
    {
      id: 'plate-za', category: 'plate', answer: 'ZA',
      title: 'Plain white plate, province encoded in the letters',
      detail: 'South Africa. No coloured band. The letter group identifies the province — GP Gauteng, CA and WC Western Cape, ND KwaZulu-Natal.',
      svg: 'plate-za',
    },

    /* --- signage --------------------------------------------------------- */
    {
      id: 'sign-jp', category: 'sign', answer: 'JP',
      title: 'Red downward triangle instead of an octagon',
      detail: 'Japan. The stop sign is an inverted red triangle reading 止まれ. Almost every other country uses the octagon, so this is unmistakable.',
      svg: 'sign-jp',
    },
    {
      id: 'sign-br', category: 'sign', answer: 'BR',
      title: 'Red octagon reading PARE',
      detail: 'Brazil and Portuguese-speaking countries. Spanish-speaking Latin America uses ALTO or PARE depending on the country, so pair it with other Portuguese spelling.',
      svg: 'sign-br',
    },
    {
      id: 'sign-fr', category: 'sign', answer: 'FR',
      title: 'Town name on white with a red border',
      detail: 'France. Entering a built-up area is marked by a white rectangular sign with a red border, which also means the default speed limit drops to 50.',
      svg: 'sign-fr',
    },
  ],

  /* ------------------------------------------------------------ CONFUSIONS */
  // Pairs people actually get wrong, and the one thing that separates them.
  confusions: [
    {
      pair: ['US', 'BR'],
      why: 'Both use yellow centre lines with white edge lines, and both have wide roads and roadside timber.',
      tiebreak: 'Language on any sign, and the poles: wooden with a barrel transformer means USA, rectangular concrete means Brazil.',
    },
    {
      pair: ['FR', 'IT'],
      why: 'Very similar white bollards and identical white European road lines.',
      tiebreak: 'The bollard top. France wraps a red band right around the post; Italy has a black strip with a red reflector on the front face only.',
    },
    {
      pair: ['JP', 'ZA'],
      why: 'Both drive on the left, which is a small enough club that people jump between them.',
      tiebreak: 'Script settles it instantly. Failing that, yellow edge lines mean South Africa; dense overhead wiring means Japan.',
    },
    {
      pair: ['RU', 'US'],
      why: 'Both have long straight roads through conifer forest, and both use a lot of Generation 3 coverage.',
      tiebreak: 'Centre line colour — Russia white, USA yellow — and any lettering at all, since Cyrillic ends the argument.',
    },
  ],
};
