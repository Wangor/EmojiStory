import React from "react";

export const EMOJI_FONT_URLS: Record<string, string> = {
  'Noto Color Emoji':
    'https://raw.githubusercontent.com/googlefonts/noto-emoji/main/fonts/NotoColorEmoji.ttf',
  'Noto Emoji':
    'https://raw.githubusercontent.com/googlefonts/noto-emoji/main/fonts/NotoEmoji-Regular.ttf',
  'Twemoji': '/fonts/twemoji.ttf',
  'OpenMoji': '/fonts/OpenMoji-color-colr1_svg.woff2',
  'Blobmoji': '/fonts/Blobmoji.ttf',
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

