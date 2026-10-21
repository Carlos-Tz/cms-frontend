// Animated GIFs already move on their own, so the hero banners show them
// whole (no crop) and skip the Ken Burns zoom.
export const isGif = (url: string) => /\.gif($|[?#])/i.test(url);

interface ImageSize {
  width: number;
  height: number;
}

// Reads just the first chunk of a remote image to find its natural
// dimensions, without downloading the whole file — used at build time to
// tell a real icon from an editor-uploaded stock photo (see FeatureGrid.astro
// and technical_debt.md). Returns null on any network/format problem; the
// caller falls back to treating the image as a plain icon.
export async function probeImageSize(url: string): Promise<ImageSize | null> {
  try {
    const response = await fetch(url, { headers: { Range: "bytes=0-65535" } });
    if (!response.ok && response.status !== 206) return null;
    const bytes = new Uint8Array(await response.arrayBuffer());
    return readPngSize(bytes) ?? readJpegSize(bytes);
  } catch {
    return null;
  }
}

function readPngSize(bytes: Uint8Array): ImageSize | null {
  const isPng = bytes.length >= 24 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (!isPng) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

function readJpegSize(bytes: Uint8Array): ImageSize | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = bytes[offset + 1];
    // SOF0–SOF15, excluding DHT/JPG/DAC which share the same range but aren't
    // "start of frame" markers.
    const isStartOfFrame = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isStartOfFrame) {
      return { height: view.getUint16(offset + 5), width: view.getUint16(offset + 7) };
    }
    offset += 2 + view.getUint16(offset + 2);
  }
  return null;
}
