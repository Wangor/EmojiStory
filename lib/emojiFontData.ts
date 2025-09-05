import { readFile } from "fs/promises";
import { join } from "path";
import { EMOJI_FONT_URLS } from "./emojiFonts";

export async function fetchEmojiFontData(name?: string) {
  if (!name) return undefined;
  const url = EMOJI_FONT_URLS[name];
  if (!url) return undefined;
  try {
    let data: ArrayBuffer;
    if (url.startsWith('/')) {
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
