import type { ContactItem, Design, QrStyle, SharePreferences } from '../types/design';

export const MAX_IMPORT_BYTES = 2_000_000;
export const MAX_SHARE_PAYLOAD_LENGTH = 70_000;

export const DEFAULT_QR_STYLE: QrStyle = {
  pattern: 'rounded',
  foreground: '#123f35',
  background: '#ffffff',
  margin: 2,
  errorCorrection: 'Q',
  centerMark: false
};

export const DEFAULT_SHARE_PREFERENCES: SharePreferences = {
  includeEmail: true,
  includePhone: true,
  includeWebsite: true,
  includeSocial: true,
  includeAddress: false,
  includePronouns: true,
  includeTagline: true,
  includeImages: false,
  allowVcard: true,
  expiresAt: null
};

const SAFE_IMAGE = /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i;
const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const CONTACT_KEYS: Record<ContactItem['kind'], keyof SharePreferences> = {
  email: 'includeEmail',
  phone: 'includePhone',
  website: 'includeWebsite',
  social: 'includeSocial',
  address: 'includeAddress'
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function validString(value: unknown, max = 500) {
  return typeof value === 'string' && value.length <= max;
}

export function normalizeDesign(input: unknown): Design | null {
  if (!isRecord(input) || !isRecord(input.meta) || !isRecord(input.identity) || !isRecord(input.card) || !isRecord(input.theme)) return null;
  if (!Array.isArray(input.contacts) || !Array.isArray(input.elements) || !Array.isArray(input.variants) || !Array.isArray(input.assets)) return null;
  if (input.contacts.length > 16 || input.elements.length > 200 || input.variants.length > 50 || input.assets.length > 20) return null;

  const candidate = input as unknown as Design;
  if (!validString(candidate.meta.id, 160) || !validString(candidate.meta.name, 200) || !validString(candidate.meta.slug, 200)) return null;
  if (!validString(candidate.identity.name, 200) || !validString(candidate.identity.title, 200) || !validString(candidate.identity.company, 200)) return null;
  if (!Number.isFinite(candidate.card.widthMm) || !Number.isFinite(candidate.card.heightMm) || candidate.card.widthMm <= 0 || candidate.card.heightMm <= 0) return null;
  if (!HEX_COLOR.test(candidate.theme.brand) || !HEX_COLOR.test(candidate.theme.surface) || !HEX_COLOR.test(candidate.theme.text) || !HEX_COLOR.test(candidate.theme.accent)) return null;
  if (candidate.contacts.some((contact) => !validString(contact.id, 160) || !validString(contact.label, 100) || !validString(contact.value, 500))) return null;
  if (candidate.elements.some((element) => !validString(element.id, 160) || !validString(element.label, 200) || !Number.isFinite(element.x) || !Number.isFinite(element.y) || !Number.isFinite(element.width) || !Number.isFinite(element.height))) return null;

  const safeAssets = candidate.assets.filter((asset) => validString(asset.id, 160) && validString(asset.name, 240) && SAFE_IMAGE.test(asset.dataUrl) && asset.dataUrl.length <= 4_000_000);
  const safeAssetIds = new Set(safeAssets.map((asset) => asset.id));
  const safeElements = candidate.elements.filter((element) => element.kind !== 'image' || (element.assetId && safeAssetIds.has(element.assetId)));

  const qrStyle = isRecord(input.qrStyle) ? input.qrStyle : {};
  const share = isRecord(input.share) ? input.share : {};
  const pattern = qrStyle.pattern;
  const errorCorrection = qrStyle.errorCorrection;
  return {
    ...candidate,
    assets: safeAssets,
    elements: safeElements,
    qrStyle: {
      ...DEFAULT_QR_STYLE,
      ...qrStyle,
      pattern: pattern === 'square' || pattern === 'rounded' || pattern === 'dots' ? pattern : DEFAULT_QR_STYLE.pattern,
      foreground: typeof qrStyle.foreground === 'string' && HEX_COLOR.test(qrStyle.foreground) ? qrStyle.foreground : DEFAULT_QR_STYLE.foreground,
      background: typeof qrStyle.background === 'string' && HEX_COLOR.test(qrStyle.background) ? qrStyle.background : DEFAULT_QR_STYLE.background,
      margin: typeof qrStyle.margin === 'number' ? Math.min(4, Math.max(0, Math.round(qrStyle.margin))) : DEFAULT_QR_STYLE.margin,
      errorCorrection: errorCorrection === 'L' || errorCorrection === 'M' || errorCorrection === 'Q' || errorCorrection === 'H' ? errorCorrection : DEFAULT_QR_STYLE.errorCorrection,
      centerMark: Boolean(qrStyle.centerMark)
    },
    share: {
      includeEmail: typeof share.includeEmail === 'boolean' ? share.includeEmail : DEFAULT_SHARE_PREFERENCES.includeEmail,
      includePhone: typeof share.includePhone === 'boolean' ? share.includePhone : DEFAULT_SHARE_PREFERENCES.includePhone,
      includeWebsite: typeof share.includeWebsite === 'boolean' ? share.includeWebsite : DEFAULT_SHARE_PREFERENCES.includeWebsite,
      includeSocial: typeof share.includeSocial === 'boolean' ? share.includeSocial : DEFAULT_SHARE_PREFERENCES.includeSocial,
      includeAddress: typeof share.includeAddress === 'boolean' ? share.includeAddress : DEFAULT_SHARE_PREFERENCES.includeAddress,
      includePronouns: typeof share.includePronouns === 'boolean' ? share.includePronouns : DEFAULT_SHARE_PREFERENCES.includePronouns,
      includeTagline: typeof share.includeTagline === 'boolean' ? share.includeTagline : DEFAULT_SHARE_PREFERENCES.includeTagline,
      includeImages: typeof share.includeImages === 'boolean' ? share.includeImages : DEFAULT_SHARE_PREFERENCES.includeImages,
      allowVcard: typeof share.allowVcard === 'boolean' ? share.allowVcard : DEFAULT_SHARE_PREFERENCES.allowVcard,
      expiresAt: typeof share.expiresAt === 'string' && !Number.isNaN(Date.parse(share.expiresAt)) ? share.expiresAt : null
    }
  };
}

export function sanitizeSharedDesign(design: Design, stripAssets = false): Design {
  const prefs = { ...DEFAULT_SHARE_PREFERENCES, ...design.share };
  const includeAssets = prefs.includeImages && !stripAssets;
  const contacts = design.contacts.filter((contact) => Boolean(prefs[CONTACT_KEYS[contact.kind]]));
  return {
    ...design,
    identity: {
      ...design.identity,
      pronouns: prefs.includePronouns ? design.identity.pronouns : '',
      tagline: prefs.includeTagline ? design.identity.tagline : ''
    },
    contacts,
    assets: includeAssets ? design.assets : [],
    elements: includeAssets ? design.elements : design.elements.filter((element) => element.kind !== 'image'),
    variants: [],
    share: prefs
  };
}

export function isShareExpired(design: Design) {
  return Boolean(design.share.expiresAt && Date.parse(design.share.expiresAt) <= Date.now());
}

export function safeContactHref(contact: ContactItem): string | undefined {
  const value = contact.value.trim().replace(/[\r\n]/g, '');
  if (!value) return undefined;
  if (contact.kind === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? `mailto:${value}` : undefined;
  if (contact.kind === 'phone') return /^[+()\d\s.-]{5,40}$/.test(value) ? `tel:${value.replace(/[^+\d]/g, '')}` : undefined;
  if (contact.kind === 'website' || contact.kind === 'social') {
    try {
      const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
      return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}
