import { DataTexture, LinearFilter, LinearMipmapLinearFilter, RepeatWrapping, RGBAFormat, SRGBColorSpace } from 'three';

function grain(x: number, y: number) {
  return ((Math.imul(x + 97, 374761393) ^ Math.imul(y + 17, 668265263)) >>> 13) % 29;
}

/** Shared, tileable stone with recessed mortar and variation between blocks. */
export function createPavingTextures() {
  const size = 128;
  const colors = new Uint8Array(size * size * 4);
  const relief = new Uint8Array(colors.length);
  for (let y = 0; y < size; y++) {
    const row = Math.floor(y / 16);
    for (let x = 0; x < size; x++) {
      const shifted = (x + (row % 2) * 16) % size;
      const sx = shifted % 32, sy = y % 16;
      const edge = Math.min(sx, 31 - sx, sy, 15 - sy);
      const tone = 160 + grain(Math.floor(shifted / 32), row) + grain(x, y) / 3;
      const stone = edge === 0 ? 83 : edge === 1 ? tone - 25 : tone;
      const height = edge === 0 ? 44 : edge === 1 ? 146 : 214 + grain(x,y) / 3;
      const index = (y * size + x) * 4;
      colors.set([stone, stone * .985, stone * .95, 255], index);
      relief.set([height, height, height, 255], index);
    }
  }
  const make = (data: Uint8Array) => {
    const texture = new DataTexture(data, size, size, RGBAFormat);
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(3, 3);
    texture.magFilter = LinearFilter;
    texture.minFilter = LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
    return texture;
  };
  const map = make(colors);
  map.colorSpace = SRGBColorSpace;
  return { map, bumpMap: make(relief) };
}
