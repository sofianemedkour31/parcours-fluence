// Sprites pixel dessinés en caractères : chaque lettre est un pixel, '.' est transparent.

export const MASCOTTE = {
  palette: { '#': '#1b1626', o: '#c9773a', O: '#e39552', b: '#f6dcae', w: '#ffffff', k: '#1b1626', y: '#ffd23f', f: '#ff8c42', l: '#4a3aa8', L: '#7d6bf0' },
  // Lecto, la chouette qui lit
  repos: [
    '..#........#..',
    '.#o#......#o#.',
    '.#oO######Oo#.',
    '#oooooooooooo#',
    '#owwwwoowwwwo#',
    '#owkkwoowkkwo#',
    '#owwwwyywwwwo#',
    '#oooobyyboooo#',
    '#oobbbbbbbboo#',
    '#llllllllllll#',
    '#lLLLLllLLLLl#',
    '.#llllllllll#.',
    '..##########..',
    '...ff....ff...',
  ],
  pas: [
    '..#........#..',
    '.#o#......#o#.',
    '.#oO######Oo#.',
    '#oooooooooooo#',
    '#owwwwoowwwwo#',
    '#owwkkoowwkko#',
    '#owwwwyywwwwo#',
    '#oooobyyboooo#',
    '#oobbbbbbbboo#',
    '#llllllllllll#',
    '#lLLLLllLLLLl#',
    '.#llllllllll#.',
    '..##########..',
    '..ff......ff..',
  ],
  content: [
    '..#........#..',
    '.#o#......#o#.',
    '.#oO######Oo#.',
    '#oooooooooooo#',
    '#oooooooooooo#',
    '#ok#kooook#ko#',
    '#owwwwyywwwwo#',
    '#oooobyyboooo#',
    '#oobbbbbbbboo#',
    '#llllllllllll#',
    '#lLLLLllLLLLl#',
    '.#llllllllll#.',
    '..##########..',
    '...ff....ff...',
  ],
};

export const PIECE = {
  palette: { '#': '#7a4d0a', y: '#ffd23f', Y: '#ffe98a', x: '#fffbe6' },
  lignes: [
    '..####..',
    '.#yyyy#.',
    '#yYxyyy#',
    '#yYxyyy#',
    '#yYxyyy#',
    '#yYyyyy#',
    '.#yyyy#.',
    '..####..',
  ],
};

export const ETOILE = {
  lignes: [
    '....##....',
    '...#yy#...',
    '...#yy#...',
    '####yy####',
    '#yyyyyyyy#',
    '.#yyYyyy#.',
    '..#yyyy#..',
    '.#yy##yy#.',
    '#yy#..#yy#',
    '###....###',
  ],
  pleine: { '#': '#1b1626', y: '#ffd23f', Y: '#fff3b0' },
  vide: { '#': '#1b1626', y: '#3d3456', Y: '#4a4066' },
};

export const DECORS = {
  vert: {
    palette: { '#': '#1b1626', g: '#3f9a4a', G: '#8fe08a', t: '#7a4a2a' },
    lignes: [
      '...####...',
      '..#gGgg#..',
      '.#gGgggg#.',
      '#gGgggggg#',
      '#gggggGgg#',
      '#ggggggGg#',
      '.#gggggg#.',
      '..##tt##..',
      '....tt....',
      '....tt....',
    ],
  },
  jaune: {
    palette: { '#': '#1b1626', g: '#3f9a4a', G: '#8fe08a', s: '#e8c06a' },
    lignes: [
      '....###....',
      '...#gGg#...',
      '.#.#gGg#...',
      '#g##ggg#.#.',
      '#gg#ggg##g#',
      '.##ggggggg#',
      '...#ggg###.',
      '...#ggg#...',
      '...#ggg#...',
      '..#sssss#..',
    ],
  },
  orange: {
    palette: { '#': '#1b1626', r: '#ff5a2a', R: '#ffd23f', m: '#6b4a5a', M: '#8a6a78' },
    lignes: [
      '......rr......',
      '.....rRRr.....',
      '.....#rr#.....',
      '....#mmmm#....',
      '...#mmMmmm#...',
      '..#mmmmmMmm#..',
      '..#mMmmmmmm#..',
      '.#mmmmmmMmmm#.',
      '#mmmmMmmmmmmm#',
      '##############',
    ],
  },
  bleu: {
    palette: { '#': '#1b1626', w: '#ffffff', b: '#7f97cf', B: '#b9cbee' },
    lignes: [
      '......##......',
      '.....#ww#.....',
      '....#wwww#....',
      '...#wwbwww#...',
      '..#bbbbwbbb#..',
      '..#bbbbbbbb#..',
      '.#bbBbbbbbbb#.',
      '.#bbbbbbBbbb#.',
      '#bbbBbbbbbbbb#',
      '##############',
    ],
  },
};
DECORS.violet = DECORS.bleu;
DECORS.rose = DECORS.vert;

export const NUAGE = {
  palette: { '#': '#1b1626', w: '#e9e3f5' },
  lignes: [
    '...####.....',
    '..#wwww###..',
    '.#wwwwwwww#.',
    '#wwwwwwwwww#',
    '.##########.',
  ],
};

/** Rectangles SVG d'un sprite, décalés en (x, y), à l'échelle e. */
export function rectsSprite(lignes, palette, x = 0, y = 0, e = 1) {
  let s = '';
  lignes.forEach((ligne, j) => {
    [...ligne].forEach((c, i) => {
      const coul = palette[c];
      if (coul) s += `<rect x="${x + i * e}" y="${y + j * e}" width="${e + 0.02}" height="${e + 0.02}" fill="${coul}"/>`;
    });
  });
  return s;
}

/** Sprite autonome dans un <span>. */
export function sprite(lignes, palette, { taille = 48, classe = '', etiquette = '' } = {}) {
  const h = lignes.length;
  const w = lignes[0].length;
  const span = document.createElement('span');
  span.className = `sprite ${classe}`;
  if (etiquette) { span.setAttribute('role', 'img'); span.setAttribute('aria-label', etiquette); } else span.setAttribute('aria-hidden', 'true');
  span.innerHTML = `<svg viewBox="0 0 ${w} ${h}" width="${taille}" height="${Math.round(taille * h / w)}" shape-rendering="crispEdges">${rectsSprite(lignes, palette)}</svg>`;
  return span;
}

/** Mascotte animée (deux images qui alternent). */
export function mascotte({ taille = 56, humeur = 'repos', classe = '' } = {}) {
  const span = document.createElement('span');
  span.className = `mascotte ${classe}`;
  span.setAttribute('aria-hidden', 'true');
  const w = MASCOTTE.repos[0].length;
  const h = MASCOTTE.repos.length;
  const image = (lignes, c) => `<svg class="${c}" viewBox="0 0 ${w} ${h}" width="${taille}" height="${Math.round(taille * h / w)}" shape-rendering="crispEdges">${rectsSprite(lignes, MASCOTTE.palette)}</svg>`;
  const premiere = humeur === 'content' ? MASCOTTE.content : MASCOTTE.repos;
  span.innerHTML = image(premiere, 'img-a') + image(MASCOTTE.pas, 'img-b');
  return span;
}

export function etoile(pleine = true, taille = 28) {
  return sprite(ETOILE.lignes, pleine ? ETOILE.pleine : ETOILE.vide, { taille, classe: `etoile ${pleine ? 'pleine' : 'vide'}` });
}

export function piece(taille = 22) {
  return sprite(PIECE.lignes, PIECE.palette, { taille, classe: 'piece' });
}
