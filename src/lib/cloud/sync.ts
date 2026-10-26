import { create } from 'zustand';
import type { Design } from '../../types/design';
import { getDesign, listDesigns, saveDesign } from '../../data/repo/designRepo';
import { cloudErrorCode, isPlanLimit } from '../plans';
import { toast } from '../toast';
import { fetchCloudDesigns, listCloudDesignStamps, pushCloudDesign, type CloudDesignStamp } from './api';
import { useSession } from './session';

export type SyncState = 'synced' | 'syncing' | 'local-only' | 'error';

interface SyncStore {
  states: Record<string, SyncState>;
  set: (id: string, state: SyncState) => void;
  setMany: (entries: Record<string, SyncState>) => void;
}

export const useSyncStore = create<SyncStore>((set) => ({
  states: {},
  set: (id, state) => set((store) => ({ states: { ...store.states, [id]: state } })),
  setMany: (entries) => set((store) => ({ states: { ...store.states, ...entries } }))
}));

function time(value: string) {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Decide what to move in each direction. Newest edit wins: cloud copies that
 * are newer (or missing locally) are pulled; local copies of cloud designs
 * that are newer are pushed. Designs that exist only locally stay local until
 * the user edits them while signed in or uploads them explicitly.
 */
export function planSync(local: Pick<Design, 'meta'>[], remote: CloudDesignStamp[]) {
  const localById = new Map(local.map((design) => [design.meta.id, design]));
  const remoteById = new Map(remote.map((stamp) => [stamp.id, stamp]));
  const pull = remote
    .filter((stamp) => {
      const mine = localById.get(stamp.id);
      return !mine || time(stamp.clientUpdatedAt) > time(mine.meta.updatedAt);
    })
    .map((stamp) => stamp.id);
  const push = local
    .filter((design) => {
      const theirs = remoteById.get(design.meta.id);
      return Boolean(theirs) && time(design.meta.updatedAt) > time(theirs!.clientUpdatedAt);
    })
    .map((design) => design.meta.id);
  return { pull, push, cloudIds: new Set(remoteById.keys()) };
}

let limitNoticeShown = false;

/** Push one design. Never throws: the local copy is always the safety net. */
export async function syncDesign(design: Design, options: { explicit?: boolean } = {}): Promise<SyncState> {
  if (useSession.getState().status !== 'signed-in') return 'local-only';
  const { set } = useSyncStore.getState();
  set(design.meta.id, 'syncing');
  try {
    await pushCloudDesign(design);
    set(design.meta.id, 'synced');
    return 'synced';
  } catch (error) {
    if (isPlanLimit(error)) {
      set(design.meta.id, 'local-only');
      if (options.explicit || !limitNoticeShown) {
        limitNoticeShown = true;
        toast('Cloud sync limit reached — this card is saved on this device only. Upgrade for more synced cards.', 'info');
      }
      return 'local-only';
    }
    console.error(error);
    set(design.meta.id, 'error');
    if (options.explicit) toast(cloudErrorCode(error) === 'not_authenticated' ? 'Sign in again to sync.' : 'Cloud sync failed. Your card is still saved here.', 'error');
    return 'error';
  }
}

/** Two-way reconcile between IndexedDB and the account. Returns local designs after the merge. */
export async function reconcile(): Promise<Design[]> {
  const local = await listDesigns();
  if (useSession.getState().status !== 'signed-in') return local;
  const remote = await listCloudDesignStamps();
  const { pull, push, cloudIds } = planSync(local, remote);
  const pulled = await fetchCloudDesigns(pull);
  // Keep the cloud timestamp so the next comparison sees the copies as equal.
  await Promise.all(pulled.map((design) => saveDesign(design, { touch: false })));
  await Promise.all(local.filter((design) => push.includes(design.meta.id)).map((design) => pushCloudDesign(design)));
  const states: Record<string, SyncState> = {};
  for (const design of [...local, ...pulled]) states[design.meta.id] = cloudIds.has(design.meta.id) ? 'synced' : 'local-only';
  useSyncStore.getState().setMany(states);
  return pulled.length ? listDesigns() : local;
}

/** Load a design that is not on this device yet (e.g. opened from another device's link). */
export async function loadFromCloud(id: string): Promise<Design | null> {
  if (useSession.getState().status !== 'signed-in') return null;
  const [design] = await fetchCloudDesigns([id]);
  if (!design) return null;
  await saveDesign(design, { touch: false });
  useSyncStore.getState().set(id, 'synced');
  return (await getDesign(id)) ?? design;
}
