/*
 * diagrams.js — original SVG illustrations for the clue drills.
 *
 * Every diagram is self-contained: it paints its own sky and ground so a white
 * bollard stays readable in both light and dark themes. Referenced by name from
 * data/meta.js (`svg: 'bollard-fr'`).
 */
(function () {
  'use strict';

  const SKY = '#c8d6e0', GROUND = '#8d8f8b', ROAD = '#5a5c5e';
  const WHITE = '#f4f4f0', OUTLINE = '#2a2d31', RED = '#d1332e';
  const YELLOW = '#e8b93a', ORANGE = '#e2762c', WOOD = '#9a7550';
  const CONCRETE = '#b9b6ae', STEEL = '#6e737a', BLACK = '#22252a';

  // shared scene for the bollard diagrams
  function scene(inner) {
    return `<svg viewBox="0 0 80 120" role="img">
      <rect x="0" y="0" width="80" height="88" fill="${SKY}"/>
      <rect x="0" y="88" width="80" height="32" fill="${GROUND}"/>
      <rect x="0" y="88" width="80" height="3" fill="${ROAD}" opacity=".35"/>
      ${inner}
    </svg>`;
  }

  const D = {

    /* ------------------------------------------------------------ bollards */
    // France: red band wraps the entire top of a white post.
    'bollard-fr': scene(`
      <rect x="31" y="26" width="18" height="66" rx="2" fill="${WHITE}" stroke="${OUTLINE}" stroke-width="1.5"/>
      <rect x="31" y="26" width="18" height="11" rx="2" fill="${RED}" stroke="${OUTLINE}" stroke-width="1.5"/>
      <circle cx="40" cy="48" r="5" fill="${RED}" stroke="${OUTLINE}" stroke-width="1.2"/>
      <ellipse cx="40" cy="92" rx="13" ry="3.5" fill="${OUTLINE}" opacity=".22"/>`),

    // Italy: black strip housing a red reflector on the front face only.
    'bollard-it': scene(`
      <rect x="31" y="26" width="18" height="66" rx="2" fill="${WHITE}" stroke="${OUTLINE}" stroke-width="1.5"/>
      <rect x="35" y="31" width="10" height="26" rx="1.5" fill="${BLACK}"/>
      <rect x="37" y="35" width="6" height="12" rx="1" fill="${RED}"/>
      <ellipse cx="40" cy="92" rx="13" ry="3.5" fill="${OUTLINE}" opacity=".22"/>`),

    // Russia: horizontal black-and-white banding.
    'bollard-ru': scene(`
      <rect x="32" y="24" width="16" height="68" rx="2" fill="${WHITE}" stroke="${OUTLINE}" stroke-width="1.5"/>
      <rect x="32" y="24" width="16" height="12" fill="${BLACK}"/>
      <rect x="32" y="48" width="16" height="12" fill="${BLACK}"/>
      <rect x="32" y="72" width="16" height="12" fill="${BLACK}"/>
      <rect x="32" y="24" width="16" height="68" rx="2" fill="none" stroke="${OUTLINE}" stroke-width="1.5"/>
      <ellipse cx="40" cy="92" rx="12" ry="3.5" fill="${OUTLINE}" opacity=".22"/>`),

    // Japan: snow pole — red/white striped post under a DOWNWARD arrowhead
    // that points at the buried road edge.
    'bollard-jp': scene(`
      <rect x="35" y="20" width="10" height="72" fill="${RED}" stroke="${OUTLINE}" stroke-width="1.3"/>
      <rect x="35" y="32" width="10" height="11" fill="${WHITE}"/>
      <rect x="35" y="54" width="10" height="11" fill="${WHITE}"/>
      <rect x="35" y="76" width="10" height="11" fill="${WHITE}"/>
      <rect x="35" y="20" width="10" height="72" fill="none" stroke="${OUTLINE}" stroke-width="1.3"/>
      <path d="M29 6 H51 L40 22 Z" fill="${RED}" stroke="${OUTLINE}" stroke-width="1.3" stroke-linejoin="round"/>
      <ellipse cx="40" cy="92" rx="9" ry="3" fill="${OUTLINE}" opacity=".22"/>`),

    // USA: thin flexible delineator, slightly bent.
    'bollard-us': scene(`
      <path d="M38 92 C38 70 36 48 43 28" fill="none" stroke="${WHITE}" stroke-width="7" stroke-linecap="round"/>
      <path d="M38 92 C38 70 36 48 43 28" fill="none" stroke="${OUTLINE}" stroke-width="1.2" stroke-linecap="round" opacity=".55"/>
      <path d="M40.2 46 C39 40 40 34 42.4 30" fill="none" stroke="${STEEL}" stroke-width="6" stroke-linecap="butt"/>
      <ellipse cx="38" cy="92" rx="9" ry="3" fill="${OUTLINE}" opacity=".22"/>`),

    // Brazil: white post, orange-red reflective band.
    'bollard-br': scene(`
      <rect x="32" y="30" width="16" height="62" rx="2" fill="${WHITE}" stroke="${OUTLINE}" stroke-width="1.5"/>
      <rect x="32" y="40" width="16" height="10" fill="${ORANGE}"/>
      <rect x="32" y="30" width="16" height="62" rx="2" fill="none" stroke="${OUTLINE}" stroke-width="1.5"/>
      <ellipse cx="40" cy="92" rx="12" ry="3.5" fill="${OUTLINE}" opacity=".22"/>`),

    /* --------------------------------------------------------- road lines */
    // A road receding to a vanishing point, so centre vs edge is unambiguous.
    'lines-white': roadScene('#f4f4f0', '#f4f4f0'),
    'lines-yellow': roadScene(YELLOW, '#f4f4f0'),
    'lines-za': roadScene('#f4f4f0', YELLOW),

    /* -------------------------------------------------------------- poles */
    'pole-us': `<svg viewBox="0 0 100 120" role="img">
      <rect x="0" y="0" width="100" height="96" fill="${SKY}"/>
      <rect x="0" y="96" width="100" height="24" fill="${GROUND}"/>
      <rect x="46" y="14" width="8" height="82" fill="${WOOD}" stroke="${OUTLINE}" stroke-width="1.2"/>
      <rect x="24" y="26" width="52" height="4" fill="${WOOD}" stroke="${OUTLINE}" stroke-width="1"/>
      <rect x="56" y="44" width="16" height="22" rx="7" fill="${STEEL}" stroke="${OUTLINE}" stroke-width="1.2"/>
      <path d="M0 24 L26 27 M76 27 L100 24" stroke="${OUTLINE}" stroke-width="1.1" fill="none" opacity=".7"/>
      <path d="M0 30 L26 33 M76 33 L100 30" stroke="${OUTLINE}" stroke-width="1.1" fill="none" opacity=".7"/>
      <circle cx="30" cy="27" r="2" fill="${OUTLINE}"/><circle cx="70" cy="27" r="2" fill="${OUTLINE}"/>
    </svg>`,

    'pole-br': `<svg viewBox="0 0 100 120" role="img">
      <rect x="0" y="0" width="100" height="96" fill="${SKY}"/>
      <rect x="0" y="96" width="100" height="24" fill="${GROUND}"/>
      <path d="M42 96 L45 12 L57 12 L60 96 Z" fill="${CONCRETE}" stroke="${OUTLINE}" stroke-width="1.3"/>
      <path d="M45 12 L57 12 L57 96 L45 96 Z" fill="${OUTLINE}" opacity=".08"/>
      <circle cx="51" cy="34" r="2.4" fill="${OUTLINE}" opacity=".55"/>
      <circle cx="51" cy="52" r="2.4" fill="${OUTLINE}" opacity=".55"/>
      <circle cx="51" cy="70" r="2.4" fill="${OUTLINE}" opacity=".55"/>
      <path d="M0 20 L45 22 M57 22 L100 20" stroke="${OUTLINE}" stroke-width="1.1" fill="none" opacity=".7"/>
      <path d="M0 27 L45 29 M57 29 L100 27" stroke="${OUTLINE}" stroke-width="1.1" fill="none" opacity=".7"/>
    </svg>`,

    'pole-jp': `<svg viewBox="0 0 100 120" role="img">
      <rect x="0" y="0" width="100" height="96" fill="${SKY}"/>
      <rect x="0" y="96" width="100" height="24" fill="${GROUND}"/>
      <rect x="47" y="8" width="7" height="88" fill="${CONCRETE}" stroke="${OUTLINE}" stroke-width="1.2"/>
      <rect x="44" y="60" width="13" height="5" fill="${WHITE}" stroke="${OUTLINE}" stroke-width=".8"/>
      <rect x="36" y="34" width="12" height="16" rx="5" fill="${STEEL}" stroke="${OUTLINE}" stroke-width="1"/>
      <rect x="53" y="38" width="10" height="13" rx="4" fill="${STEEL}" stroke="${OUTLINE}" stroke-width="1"/>
      ${[14, 19, 24, 29, 55, 59, 63, 67, 71].map(y =>
        `<path d="M0 ${y} L47 ${y + 1.5} M54 ${y + 1.5} L100 ${y}" stroke="${OUTLINE}" stroke-width="1" fill="none" opacity=".75"/>`).join('')}
      <rect x="41" y="20" width="18" height="3" fill="${STEEL}" stroke="${OUTLINE}" stroke-width=".8"/>
    </svg>`,

    'pole-ru': `<svg viewBox="0 0 100 120" role="img">
      <rect x="0" y="0" width="100" height="96" fill="${SKY}"/>
      <rect x="0" y="96" width="100" height="24" fill="${GROUND}"/>
      <g stroke="${STEEL}" stroke-width="2.2" fill="none" stroke-linecap="round">
        <path d="M36 96 L46 16 M64 96 L54 16 M46 16 L54 16"/>
        <path d="M38 80 L62 80 M40 64 L60 64 M42 48 L58 48 M44 32 L56 32"/>
        <path d="M36 96 L60 80 L38 80 L58 64 L40 64 L56 48 L42 48 L54 32 L44 32"/>
      </g>
      <path d="M28 20 L46 18 M54 18 L72 20" stroke="${OUTLINE}" stroke-width="1.2" fill="none" opacity=".7"/>
      <path d="M30 26 L46 24 M54 24 L70 26" stroke="${OUTLINE}" stroke-width="1.2" fill="none" opacity=".7"/>
    </svg>`,

    /* ------------------------------------------------------------- plates */
    'plate-fr': `<svg viewBox="0 0 200 52" role="img">
      <rect x="1" y="1" width="198" height="50" rx="5" fill="${WHITE}" stroke="${OUTLINE}" stroke-width="2"/>
      <rect x="1" y="1" width="26" height="50" rx="5" fill="#1b3a8c"/><rect x="21" y="1" width="6" height="50" fill="#1b3a8c"/>
      <g fill="${YELLOW}">${stars(14, 18, 7)}</g>
      <text x="14" y="44" font-size="11" fill="${WHITE}" text-anchor="middle" font-family="sans-serif" font-weight="700">F</text>
      <rect x="173" y="1" width="26" height="50" rx="5" fill="#1b3a8c"/><rect x="173" y="1" width="6" height="50" fill="#1b3a8c"/>
      <rect x="180" y="8" width="12" height="12" rx="2" fill="${YELLOW}" opacity=".85"/>
      <text x="186" y="44" font-size="13" fill="${WHITE}" text-anchor="middle" font-family="sans-serif" font-weight="700">35</text>
      <text x="100" y="36" font-size="22" fill="${OUTLINE}" text-anchor="middle" font-family="sans-serif" font-weight="700" letter-spacing="1">AB-123-CD</text>
    </svg>`,

    'plate-jp': `<svg viewBox="0 0 200 52" role="img">
      <rect x="46" y="1" width="108" height="50" rx="6" fill="${YELLOW}" stroke="${OUTLINE}" stroke-width="2"/>
      <text x="100" y="18" font-size="11" fill="${OUTLINE}" text-anchor="middle" font-family="sans-serif">品川 500</text>
      <text x="100" y="42" font-size="21" fill="${OUTLINE}" text-anchor="middle" font-family="sans-serif" font-weight="700">あ 12-34</text>
    </svg>`,

    'plate-ru': `<svg viewBox="0 0 200 52" role="img">
      <rect x="12" y="1" width="176" height="50" rx="5" fill="${WHITE}" stroke="${OUTLINE}" stroke-width="2"/>
      <line x1="150" y1="1" x2="150" y2="51" stroke="${OUTLINE}" stroke-width="2"/>
      <text x="80" y="38" font-size="23" fill="${OUTLINE}" text-anchor="middle" font-family="sans-serif" font-weight="700">А123ВС</text>
      <text x="169" y="24" font-size="15" fill="${OUTLINE}" text-anchor="middle" font-family="sans-serif" font-weight="700">78</text>
      <text x="169" y="35" font-size="8" fill="${OUTLINE}" text-anchor="middle" font-family="sans-serif">RUS</text>
      <rect x="160" y="38" width="18" height="8" fill="${WHITE}" stroke="${OUTLINE}" stroke-width=".6"/>
      <rect x="160" y="38" width="18" height="2.6" fill="${WHITE}"/>
      <rect x="160" y="40.6" width="18" height="2.7" fill="#1b3a8c"/>
      <rect x="160" y="43.3" width="18" height="2.7" fill="${RED}"/>
    </svg>`,

    'plate-us': `<svg viewBox="0 0 200 52" role="img">
      <rect x="34" y="1" width="132" height="50" rx="7" fill="${WHITE}" stroke="${OUTLINE}" stroke-width="2"/>
      <rect x="34" y="1" width="132" height="14" rx="7" fill="#3d6fb5" opacity=".28"/>
      <text x="100" y="12" font-size="9" fill="${OUTLINE}" text-anchor="middle" font-family="sans-serif" font-weight="700" letter-spacing="2">STATE</text>
      <text x="100" y="41" font-size="24" fill="#20386e" text-anchor="middle" font-family="sans-serif" font-weight="700" letter-spacing="2">ABC 123</text>
    </svg>`,

    'plate-br': `<svg viewBox="0 0 200 52" role="img">
      <rect x="18" y="1" width="164" height="50" rx="5" fill="${WHITE}" stroke="${OUTLINE}" stroke-width="2"/>
      <path d="M23 1 h154 a5 5 0 0 1 5 5 v9 H18 V6 a5 5 0 0 1 5 -5 z" fill="#1b3a8c"/>
      <text x="100" y="12" font-size="8.5" fill="${WHITE}" text-anchor="middle" font-family="sans-serif" font-weight="700" letter-spacing="3">BRASIL</text>
      <text x="100" y="42" font-size="23" fill="${OUTLINE}" text-anchor="middle" font-family="sans-serif" font-weight="700" letter-spacing="1">ABC1D23</text>
    </svg>`,

    'plate-za': `<svg viewBox="0 0 200 52" role="img">
      <rect x="22" y="1" width="156" height="50" rx="5" fill="${WHITE}" stroke="${OUTLINE}" stroke-width="2"/>
      <text x="100" y="37" font-size="23" fill="${OUTLINE}" text-anchor="middle" font-family="sans-serif" font-weight="700" letter-spacing="1">CA 123-456</text>
    </svg>`,

    /* -------------------------------------------------------------- signs */
    'sign-jp': `<svg viewBox="0 0 120 110" role="img">
      <rect x="0" y="0" width="120" height="110" fill="${SKY}"/>
      <rect x="57" y="60" width="6" height="50" fill="${STEEL}"/>
      <path d="M60 6 L112 62 H8 Z" fill="${RED}" stroke="${WHITE}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M60 6 L112 62 H8 Z" fill="none" stroke="${OUTLINE}" stroke-width="1.5" stroke-linejoin="round"/>
      <text x="60" y="50" font-size="21" fill="${WHITE}" text-anchor="middle" font-family="sans-serif" font-weight="700">止まれ</text>
    </svg>`,

    'sign-br': `<svg viewBox="0 0 120 110" role="img">
      <rect x="0" y="0" width="120" height="110" fill="${SKY}"/>
      <rect x="57" y="82" width="6" height="28" fill="${STEEL}"/>
      <path d="M36 8 H84 L108 32 V80 L84 104 H36 L12 80 V32 Z" fill="${RED}" stroke="${WHITE}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M36 8 H84 L108 32 V80 L84 104 H36 L12 80 V32 Z" fill="none" stroke="${OUTLINE}" stroke-width="1.5" stroke-linejoin="round"/>
      <text x="60" y="65" font-size="24" fill="${WHITE}" text-anchor="middle" font-family="sans-serif" font-weight="700" letter-spacing="1">PARE</text>
    </svg>`,

    'sign-fr': `<svg viewBox="0 0 160 100" role="img">
      <rect x="0" y="0" width="160" height="100" fill="${SKY}"/>
      <rect x="77" y="58" width="6" height="42" fill="${STEEL}"/>
      <rect x="20" y="18" width="120" height="42" rx="2" fill="${WHITE}" stroke="${RED}" stroke-width="5"/>
      <rect x="20" y="18" width="120" height="42" rx="2" fill="none" stroke="${OUTLINE}" stroke-width="1"/>
      <text x="80" y="46" font-size="19" fill="${OUTLINE}" text-anchor="middle" font-family="sans-serif" font-weight="600">Auray</text>
    </svg>`,
  };

  // A road running to a vanishing point. `centre` and `edge` are line colours.
  function roadScene(centre, edge) {
    return `<svg viewBox="0 0 160 100" role="img">
      <rect x="0" y="0" width="160" height="38" fill="${SKY}"/>
      <rect x="0" y="38" width="160" height="62" fill="${GROUND}"/>
      <path d="M62 38 L98 38 L150 100 L10 100 Z" fill="${ROAD}"/>
      <path d="M64.5 38 L16 100" stroke="${edge}" stroke-width="3" stroke-linecap="round"/>
      <path d="M95.5 38 L144 100" stroke="${edge}" stroke-width="3" stroke-linecap="round"/>
      <path d="M80 40 L80 100" stroke="${centre}" stroke-width="4" stroke-linecap="round"
            stroke-dasharray="7 9" transform="translate(0,0)"/>
    </svg>`;
  }

  // Twelve EU stars in a ring.
  function stars(cx, cy, r) {
    let out = '';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      out += `<circle cx="${(cx + Math.cos(a) * r).toFixed(1)}" cy="${(cy + Math.sin(a) * r).toFixed(1)}" r="1.1"/>`;
    }
    return out;
  }

  window.DIAGRAMS = D;
})();
