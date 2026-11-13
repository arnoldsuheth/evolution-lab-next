import * as THREE from 'three';

/** 5.0: faixas claras de correnteza (fundo transparente), repetidas ao longo do rio e deslizadas a cada quadro. */
export function createFlowTexture(kind: 'water' | 'lava' | 'ice') {
  const w = 256, h = 64, data = new Uint8Array(w * h * 4);
  const tint = kind === 'lava' ? [255, 196, 110] : kind === 'ice' ? [235, 250, 255] : [215, 244, 250];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    // Traços finos e ondulados, com intervalos irregulares (parece correnteza, não listras).
    const lane = Math.sin((y / h) * Math.PI * 6 + Math.sin(x / 19) * 1.3);
    const dash = .5 + .5 * Math.sin(x / w * Math.PI * 2 * 3 + y * .37) * Math.sin(x / w * Math.PI * 2 * 5 - y * .21);
    const a = Math.max(0, lane - .72) / .28 * dash;
    const i = (y * w + x) * 4;
    data[i] = tint[0]; data[i + 1] = tint[1]; data[i + 2] = tint[2]; data[i + 3] = Math.round(Math.min(1, a) * (kind === 'lava' ? 210 : 150));
  }
  const texture = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.magFilter = THREE.LinearFilter; texture.minFilter = THREE.LinearFilter; texture.needsUpdate = true;
  return texture;
}
