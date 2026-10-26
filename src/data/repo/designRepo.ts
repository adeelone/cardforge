import { clear, createStore, del, entries, get, set } from 'idb-keyval';
import type { Design } from '../../types/design';
import { normalizeDesign } from '../../lib/design-security';

const prefix = 'cardforge:design:';
const designStore = createStore('cardforge', 'designs');
let migrated = false;

async function migrateLegacyDesigns() {
  if (migrated) return;
  migrated = true;
  const legacy = await entries<string, Design>();
  await Promise.all(
    legacy
      .filter(([key]) => key.startsWith(prefix))
      .map(async ([key, value]) => {
        await set(key, value, designStore);
        await del(key);
      })
  );
}

/**
 * Persist a design. `touch` stamps the edit time (the default for library
 * actions); pass `touch: false` when the timestamp is already authoritative —
 * the editor stamps every change itself, and cloud pulls must keep the cloud
 * edit time so sync can compare copies.
 */
export async function saveDesign(design: Design, options: { touch?: boolean } = {}) {
  await migrateLegacyDesigns();
  const updatedAt = options.touch === false ? design.meta.updatedAt : new Date().toISOString();
  await set(`${prefix}${design.meta.id}`, { ...design, meta: { ...design.meta, updatedAt } }, designStore);
}

export async function getDesign(id: string) {
  await migrateLegacyDesigns();
  return normalizeDesign(await get<Design>(`${prefix}${id}`, designStore));
}

export async function listDesigns() {
  await migrateLegacyDesigns();
  const all = await entries<string, Design>(designStore);
  return all
    .filter(([key]) => key.startsWith(prefix))
    .map(([, value]) => normalizeDesign(value))
    .filter((value): value is Design => Boolean(value))
    .sort((a, b) => b.meta.updatedAt.localeCompare(a.meta.updatedAt));
}

export async function deleteDesign(id: string) {
  await migrateLegacyDesigns();
  await del(`${prefix}${id}`, designStore);
}

export async function clearAllDesigns() {
  await clear(designStore);
  const legacy = await entries<string, Design>();
  await Promise.all(legacy.filter(([key]) => key.startsWith(prefix)).map(([key]) => del(key)));
}
