import type { CommentAuthor } from "@comments/shared";

export interface AvatarPreset {
  id: string;
  name: string;
  url: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: "memoji-boy-white-hair",
    name: "White Hair Guy",
    url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Anonym&hair=short01&hairColor=white"
  },
  {
    id: "memoji-girl-purple-beanie",
    name: "Purple Beanie Girl",
    url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Rum_8&hat=beanie&hatColor=6b46c1"
  },
  {
    id: "memoji-cool-glasses",
    name: "Cool Glasses",
    url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Alex&glasses=variant05"
  },
  {
    id: "memoji-curly-hair",
    name: "Curly Hair",
    url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Sam&hair=curly"
  },
  {
    id: "memoji-artist",
    name: "Creative Artist",
    url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Max&accessories=roundGlasses"
  },
  {
    id: "robot-bot",
    name: "Tech Bot",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=Coder"
  },
  {
    id: "lorelei-smile",
    name: "Smile Lorelei",
    url: "https://api.dicebear.com/7.x/lorelei/svg?seed=Happy"
  },
  {
    id: "adventurer-explorer",
    name: "Explorer",
    url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix"
  }
];

export function getAvatarUrl(author: CommentAuthor): string {
  if (author.avatarUrl?.trim()) {
    return author.avatarUrl.trim();
  }

  const seed = encodeURIComponent(author.userName || "Guest");
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`;
}
