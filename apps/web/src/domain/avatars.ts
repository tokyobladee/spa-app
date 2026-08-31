import type { CommentAuthor } from "@comments/shared";

export interface AvatarPreset {
  id: string;
  name: string;
  url: string;
}

interface AvatarTheme {
  background: string;
  face: string;
  hair: string;
  accent: string;
}

const themes: [AvatarTheme, ...AvatarTheme[]] = [
  { background: "#dcefed", face: "#f4c9a8", hair: "#f8f8f2", accent: "#1f6f66" },
  { background: "#efe5f8", face: "#d7a579", hair: "#5d2f80", accent: "#6f3db5" },
  { background: "#e8f1ff", face: "#9b5f32", hair: "#3b2418", accent: "#273c75" },
  { background: "#e1f3ea", face: "#c98d5c", hair: "#2d1d16", accent: "#18895c" },
  { background: "#fff3cc", face: "#efbe85", hair: "#674126", accent: "#d19119" },
  { background: "#e8ecff", face: "#d8e0ff", hair: "#26315e", accent: "#536dfe" },
  { background: "#f6e9ec", face: "#f0b7c8", hair: "#171820", accent: "#b92d5d" },
  { background: "#e7f2df", face: "#d2a476", hair: "#7b623a", accent: "#597f2f" }
];

function createAvatarSvg(theme: AvatarTheme, label: string): string {
  const initial = label.trim().charAt(0).toUpperCase() || "U";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="${initial}">
      <rect width="96" height="96" rx="48" fill="${theme.background}"/>
      <circle cx="48" cy="50" r="24" fill="${theme.face}"/>
      <path d="M25 47c4-18 15-28 32-25 10 2 16 8 18 18-8-5-17-7-28-7-9 0-16 5-22 14z" fill="${theme.hair}"/>
      <circle cx="39" cy="50" r="3" fill="#172026"/>
      <circle cx="57" cy="50" r="3" fill="#172026"/>
      <path d="M38 63c6 5 14 5 20 0" fill="none" stroke="#172026" stroke-width="4" stroke-linecap="round"/>
      <path d="M24 80c5-14 14-21 24-21s19 7 24 21" fill="${theme.accent}"/>
      <text x="48" y="86" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#ffffff">${initial}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.replace(/\s+/g, " ").trim())}`;
}

function getTheme(index: number): AvatarTheme {
  return themes[index % themes.length] ?? themes[0];
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: "memoji-boy-white-hair",
    name: "White Hair Guy",
    url: createAvatarSvg(getTheme(0), "White Hair Guy")
  },
  {
    id: "memoji-girl-purple-beanie",
    name: "Purple Beanie Girl",
    url: createAvatarSvg(getTheme(1), "Purple Beanie Girl")
  },
  {
    id: "memoji-cool-glasses",
    name: "Cool Glasses",
    url: createAvatarSvg(getTheme(2), "Cool Glasses")
  },
  {
    id: "memoji-curly-hair",
    name: "Curly Hair",
    url: createAvatarSvg(getTheme(3), "Curly Hair")
  },
  {
    id: "memoji-artist",
    name: "Creative Artist",
    url: createAvatarSvg(getTheme(4), "Creative Artist")
  },
  {
    id: "robot-bot",
    name: "Tech Bot",
    url: createAvatarSvg(getTheme(5), "Tech Bot")
  },
  {
    id: "lorelei-smile",
    name: "Smile Lorelei",
    url: createAvatarSvg(getTheme(6), "Smile Lorelei")
  },
  {
    id: "adventurer-explorer",
    name: "Explorer",
    url: createAvatarSvg(getTheme(7), "Explorer")
  }
];

export function getAvatarUrl(author: CommentAuthor): string {
  if (author.avatarUrl?.trim()) {
    return author.avatarUrl.trim();
  }

  const seed = Array.from(author.userName || "User").reduce((hash, character) => hash + character.charCodeAt(0), 0);
  return createAvatarSvg(getTheme(seed), author.userName || "User");
}
