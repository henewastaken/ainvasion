// Placeholder map data — simple grid layout.
// Each entry has an id, display label, and a small rectangle position.
// Replace `x/y/w/h` and `adjacency` with real SVG paths once the MVP is done.

export interface PlaceholderCountry {
  id: string;        // matches the backend country name exactly
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

// 5-column grid, countries positioned roughly west→east, north→south
export const PLACEHOLDER_COUNTRIES: PlaceholderCountry[] = [
  // Row 0 — North
  { id: "Ireland",        label: "IE", x: 20,  y: 20,  w: 70, h: 40 },
  { id: "United Kingdom", label: "UK", x: 110, y: 20,  w: 70, h: 40 },
  { id: "Norway",         label: "NO", x: 200, y: 20,  w: 70, h: 40 },
  { id: "Sweden",         label: "SE", x: 290, y: 20,  w: 70, h: 40 },
  { id: "Finland",        label: "FI", x: 380, y: 20,  w: 70, h: 40 },

  // Row 1
  { id: "Portugal",       label: "PT", x: 20,  y: 80,  w: 70, h: 40 },
  { id: "Spain",          label: "ES", x: 110, y: 80,  w: 70, h: 40 },
  { id: "France",         label: "FR", x: 200, y: 80,  w: 70, h: 40 },
  { id: "Belgium",        label: "BE", x: 290, y: 80,  w: 70, h: 40 },
  { id: "Netherlands",    label: "NL", x: 380, y: 80,  w: 70, h: 40 },

  // Row 2
  { id: "Denmark",        label: "DK", x: 20,  y: 140, w: 70, h: 40 },
  { id: "Germany",        label: "DE", x: 110, y: 140, w: 70, h: 40 },
  { id: "Switzerland",    label: "CH", x: 200, y: 140, w: 70, h: 40 },
  { id: "Austria",        label: "AT", x: 290, y: 140, w: 70, h: 40 },
  { id: "Italy",          label: "IT", x: 380, y: 140, w: 70, h: 40 },

  // Row 3
  { id: "Poland",         label: "PL", x: 20,  y: 200, w: 70, h: 40 },
  { id: "Czechia",        label: "CZ", x: 110, y: 200, w: 70, h: 40 },
  { id: "Slovakia",       label: "SK", x: 200, y: 200, w: 70, h: 40 },
  { id: "Hungary",        label: "HU", x: 290, y: 200, w: 70, h: 40 },
  { id: "Slovenia",       label: "SI", x: 380, y: 200, w: 70, h: 40 },

  // Row 4
  { id: "Estonia",        label: "EE", x: 20,  y: 260, w: 70, h: 40 },
  { id: "Latvia",         label: "LV", x: 110, y: 260, w: 70, h: 40 },
  { id: "Lithuania",      label: "LT", x: 200, y: 260, w: 70, h: 40 },
  { id: "Belarus",        label: "BY", x: 290, y: 260, w: 70, h: 40 },
  { id: "Ukraine",        label: "UA", x: 380, y: 260, w: 70, h: 40 },

  // Row 5 — South-east
  { id: "Croatia",        label: "HR", x: 20,  y: 320, w: 70, h: 40 },
  { id: "Bosnia",         label: "BA", x: 110, y: 320, w: 70, h: 40 },
  { id: "Serbia",         label: "RS", x: 200, y: 320, w: 70, h: 40 },
  { id: "Romania",        label: "RO", x: 290, y: 320, w: 70, h: 40 },
  { id: "Bulgaria",       label: "BG", x: 380, y: 320, w: 70, h: 40 },

  // Row 6
  { id: "Albania",          label: "AL", x: 110, y: 380, w: 70, h: 40 },
  { id: "North Macedonia",  label: "MK", x: 200, y: 380, w: 70, h: 40 },
  { id: "Greece",           label: "GR", x: 290, y: 380, w: 70, h: 40 },
];
