export const PARTICIPANTS = [
  {
    name: "Stuart",
    color: "#3b82f6",
    teams: [
      { name: "Saudi Arabia", apiName: "Saudi Arabia", flag: "🇸🇦", rank: 60 },
      { name: "Portugal",     apiName: "Portugal",     flag: "🇵🇹", rank: 5  },
      { name: "Ghana",        apiName: "Ghana",        flag: "🇬🇭", rank: 73 },
      { name: "New Zealand",  apiName: "New Zealand",  flag: "🇳🇿", rank: 85 },
    ],
  },
  {
    name: "Ozmay",
    color: "#8b5cf6",
    teams: [
      { name: "Scotland",        apiName: "Scotland",     flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", rank: 42 },
      { name: "Korea Republic",  apiName: "South Korea",  flag: "🇰🇷", rank: 25 },
      { name: "Sweden",          apiName: "Sweden",       flag: "🇸🇪", rank: 38 },
      { name: "Egypt",           apiName: "Egypt",        flag: "🇪🇬", rank: 29 },
      { name: "Cape Verde Islands", apiName: "Cape Verde Islands", flag: "🇨🇻", rank: 67 },
    ],
  },
  {
    name: "Mandy",
    color: "#ec4899",
    teams: [
      { name: "France",       apiName: "France",       flag: "🇫🇷", rank: 3  },
      { name: "Austria",      apiName: "Austria",      flag: "🇦🇹", rank: 24 },
      { name: "Congo DR",      apiName: "Congo DR",     flag: "🇨🇩", rank: 46 },
      { name: "Netherlands",  apiName: "Netherlands",  flag: "🇳🇱", rank: 8  },
    ],
  },
  {
    name: "Elise",
    color: "#f59e0b",
    teams: [
      { name: "Ecuador",       apiName: "Ecuador",        flag: "🇪🇨", rank: 23 },
      { name: "England",       apiName: "England",        flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", rank: 4  },
      { name: "United States", apiName: "United States",  flag: "🇺🇸", rank: 17 },
      { name: "Morocco",       apiName: "Morocco",        flag: "🇲🇦", rank: 7  },
    ],
  },
  {
    name: "Joseph",
    color: "#10b981",
    teams: [
      { name: "Iraq",       apiName: "Iraq",      flag: "🇮🇶", rank: 57 },
      { name: "Japan",      apiName: "Japan",     flag: "🇯🇵", rank: 18 },
      { name: "Colombia",   apiName: "Colombia",  flag: "🇨🇴", rank: 14 },
      { name: "Argentina",  apiName: "Argentina", flag: "🇦🇷", rank: 1  },
    ],
  },
  {
    name: "Tom",
    color: "#f97316",
    teams: [
      { name: "Senegal",             apiName: "Senegal",            flag: "🇸🇳", rank: 15 },
      { name: "Australia",           apiName: "Australia",          flag: "🇦🇺", rank: 27 },
      { name: "Turkey",              apiName: "Turkey",             flag: "🇹🇷", rank: 22 },
      { name: "Curaçao",             apiName: "Curaçao",            flag: "🇨🇼", rank: 82 },
      { name: "Bosnia-Herzegovina",  apiName: "Bosnia-Herzegovina", flag: "🇧🇦", rank: 64 },
    ],
  },
  {
    name: "Reuben",
    color: "#06b6d4",
    teams: [
      { name: "Norway",   apiName: "Norway",   flag: "🇳🇴", rank: 31 },
      { name: "Tunisia",  apiName: "Tunisia",  flag: "🇹🇳", rank: 45 },
      { name: "Uruguay",  apiName: "Uruguay",  flag: "🇺🇾", rank: 16 },
      { name: "Belgium",  apiName: "Belgium",  flag: "🇧🇪", rank: 9  },
    ],
  },
  {
    name: "Maddie",
    color: "#a78bfa",
    teams: [
      { name: "Paraguay",   apiName: "Paraguay",   flag: "🇵🇾", rank: 41 },
      { name: "Jordan",     apiName: "Jordan",     flag: "🇯🇴", rank: 63 },
      { name: "Uzbekistan", apiName: "Uzbekistan", flag: "🇺🇿", rank: 50 },
      { name: "Germany",    apiName: "Germany",    flag: "🇩🇪", rank: 10 },
    ],
  },
  {
    name: "Oliver",
    color: "#34d399",
    teams: [
      { name: "Brazil",   apiName: "Brazil",          flag: "🇧🇷", rank: 6  },
      { name: "Spain",    apiName: "Spain",            flag: "🇪🇸", rank: 2  },
      { name: "Czech Republic",  apiName: "Czechia",          flag: "🇨🇿", rank: 40 },
      { name: "Qatar",    apiName: "Qatar",            flag: "🇶🇦", rank: 56 },
    ],
  },
  {
    name: "Megan",
    color: "#fb7185",
    teams: [
      { name: "Algeria",       apiName: "Algeria",       flag: "🇩🇿", rank: 28 },
      { name: "Iran",          apiName: "Iran",          flag: "🇮🇷", rank: 20 },
      { name: "South Africa",  apiName: "South Africa",  flag: "🇿🇦", rank: 61 },
      { name: "Mexico",        apiName: "Mexico",        flag: "🇲🇽", rank: 13 },
      { name: "Haiti",         apiName: "Haiti",         flag: "🇭🇹", rank: 83 },
    ],
  },
  {
    name: "Elliot",
    color: "#fbbf24",
    teams: [
      { name: "Côte d'Ivoire",  apiName: "Ivory Coast",  flag: "🇨🇮", rank: 33 },
      { name: "Canada",         apiName: "Canada",        flag: "🇨🇦", rank: 30 },
      { name: "Croatia",        apiName: "Croatia",       flag: "🇭🇷", rank: 11 },
      { name: "Switzerland",    apiName: "Switzerland",   flag: "🇨🇭", rank: 19 },
      { name: "Panama",         apiName: "Panama",        flag: "🇵🇦", rank: 34 },
    ],
  },
];

export const UNASSIGNED_TEAMS = [];

export const teamToParticipant = Object.fromEntries(
  PARTICIPANTS.flatMap(p => p.teams.map(t => [t.apiName, { name: p.name, color: p.color }]))
);
