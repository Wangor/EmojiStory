import React from "react";
export const EMOJI_FONT_URLS: Record<string, string> = {
  'Noto Color Emoji': 'https://raw.githubusercontent.com/googlefonts/noto-emoji/main/fonts/NotoColorEmoji.ttf',
  'Twemoji': 'https://github.com/mozilla/twemoji-colr/raw/master/TwemojiMozilla.ttf',
  'OpenMoji': 'https://github.com/hfg-gmuend/openmoji/raw/main/font/Color/SVGinOT/OpenMojiColor.otf',
  'Blobmoji': 'https://github.com/C1710/blobmoji/releases/latest/download/Blobmoji.ttf',
  'FxEmoji': 'https://github.com/mozilla/fxemoji/raw/master/FxEmoji.ttf',
};

const loadedFonts = new Set<string>();

export function useEmojiFont(name?: string) {
  React.useEffect(() => {
    if (!name || loadedFonts.has(name)) return;
    const url = EMOJI_FONT_URLS[name];
    if (!url) return;
    const font = new FontFace(name, `url(${url})`);
    font
      .load()
      .then((f) => {
        loadedFonts.add(name);
        (document as any).fonts.add(f);
      })
      .catch(() => {});
  }, [name]);
}

export async function fetchEmojiFontData(name?: string) {
  if (!name) return undefined;
  const url = EMOJI_FONT_URLS[name];
  if (!url) return undefined;
  try {
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const data = await res.arrayBuffer();
    return [
      {
        name,
        data,
        style: 'normal' as const,
      },
    ];
  } catch {
    return undefined;
  }
}
