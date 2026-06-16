import { del, entries, get, set } from 'idb-keyval';
import type { Design } from '../../types/design';

const prefix = 'cardforge:design:';

export async function saveDesign(design: Design) {
  await set(`${prefix}${design.meta.id}`, { ...design, meta: { ...design.meta, updatedAt: new Date().toISOString() } });
}

export async function getDesign(id: string) {
  return (await get<Design>(`${prefix}${id}`)) ?? null;
}

export async function listDesigns() {
  const all = await entries<string, Design>();
  return all
    .filter(([key]) => key.startsWith(prefix))
    .map(([, value]) => value)
    .sort((a, b) => b.meta.updatedAt.localeCompare(a.meta.updatedAt));
}

export async function deleteDesign(id: string) {
  await del(`${prefix}${id}`);
}
