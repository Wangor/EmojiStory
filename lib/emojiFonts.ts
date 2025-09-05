import React from "react";

export const EMOJI_FONT_URLS: Record<string, string> = {
  'Noto Color Emoji': 'https://raw.githubusercontent.com/googlefonts/noto-emoji/main/fonts/NotoColorEmoji.ttf',
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

export async function fetchEmojiFontData(name?: string) {
  if (!name) return undefined;
  const url = EMOJI_FONT_URLS[name];
  if (!url) return undefined;
  try {
    let data: ArrayBuffer;
    if (url.startsWith('/')) {
      const [{ readFile }, { join }] = await Promise.all([
        import('fs/promises'),
        import('path'),
      ]);
      const filePath = join(process.cwd(), 'public', url.slice(1));
      const buf = await readFile(filePath);
      data = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    } else {
      const res = await fetch(url);
      if (!res.ok) return undefined;
      data = await res.arrayBuffer();
    }
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
