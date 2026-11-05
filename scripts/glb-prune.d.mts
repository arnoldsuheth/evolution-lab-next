export function readGlb(data: Uint8Array): { json: { animations?: { name: string }[]; nodes?: { name?: string; mesh?: number }[]; [key: string]: unknown }; bin: Buffer };
export function writeGlb(json: unknown, bin: Buffer): Buffer;
export function pruneAnimations(data: Uint8Array, keep: readonly string[]): Buffer;
export const KEEP_ANIMATIONS: string[];
