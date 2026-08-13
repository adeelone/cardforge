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

function validString(value: unknown, max = 500): value is string {
  return typeof value === 'string' && value.length <= max;
}

function stringValue(value: unknown, max: number, fallback = ''): string {
  return validString(value, max) ? value : fallback;
}

function numberValue(value: unknown, min: number, max: number, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

function enumValue<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && allowed.includes(value as T) ? (value as T) : fallback;
}

function normalizeIdentity(value: unknown) {
  const identity = isRecord(value) ? value : {};
  return {
    name: stringValue(identity.name, 200),
    title: stringValue(identity.title, 200),
    company: stringValue(identity.company, 200),
    department: stringValue(identity.department, 200),
    tagline: stringValue(identity.tagline, 500),
    pronouns: stringValue(identity.pronouns, 100)
  };
}

function normalizeContacts(value: unknown): ContactItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!isRecord(entry) || !validString(entry.id, 160) || !validString(entry.label, 100) || !validString(entry.value, 500)) return [];
    const kind = enumValue(entry.kind, ['phone', 'email', 'website', 'address', 'social'] as const, 'website');
    return [{ id: entry.id, kind, label: entry.label, value: entry.value }];
  });
}

export function normalizeDesign(input: unknown): Design | null {
  if (!isRecord(input) || !isRecord(input.meta) || !isRecord(input.identity) || !isRecord(input.card) || !isRecord(input.theme)) return null;
  if (!Array.isArray(input.contacts) || !Array.isArray(input.elements) || !Array.isArray(input.variants) || !Array.isArray(input.assets)) return null;
  if (input.contacts.length > 16 || input.elements.length > 200 || input.variants.length > 50 || input.assets.length > 20) return null;

  const candidate = input as unknown as Design;
  if (!validString(candidate.meta.id, 160) || !validString(candidate.meta.name, 200) || !validString(candidate.meta.slug, 200)) return null;
  if (!Number.isFinite(candidate.card.widthMm) || !Number.isFinite(candidate.card.heightMm) || candidate.card.widthMm <= 0 || candidate.card.heightMm <= 0) return null;
  if (!HEX_COLOR.test(candidate.theme.brand) || !HEX_COLOR.test(candidate.theme.surface) || !HEX_COLOR.test(candidate.theme.text) || !HEX_COLOR.test(candidate.theme.accent)) return null;
  const safeAssets = candidate.assets.flatMap((asset) => {
    if (!isRecord(asset) || !validString(asset.id, 160) || !validString(asset.name, 240) || !validString(asset.mime, 100) || !validString(asset.dataUrl, 4_000_000) || !SAFE_IMAGE.test(asset.dataUrl)) return [];
    return [{ id: asset.id, name: asset.name, mime: asset.mime, dataUrl: asset.dataUrl }];
  });
  const safeAssetIds = new Set(safeAssets.map((asset) => asset.id));
  const safeElements = candidate.elements.flatMap((value) => {
    if (!isRecord(value) || !validString(value.id, 160) || !validString(value.label, 200)) return [];
    const kind = enumValue(value.kind, ['text', 'shape', 'image', 'qr'] as const, 'text');
    const assetId = stringValue(value.assetId, 160) || undefined;
    if (kind === 'image' && (!assetId || !safeAssetIds.has(assetId))) return [];
    const gradient = Array.isArray(value.gradient) && value.gradient.length === 2 && value.gradient.every((color) => typeof color === 'string' && HEX_COLOR.test(color))
      ? [value.gradient[0], value.gradient[1]] as [string, string]
      : undefined;
    return [{
      id: value.id,
      side: enumValue(value.side, ['front', 'back'] as const, 'front'),
      kind,
      label: value.label,
      x: numberValue(value.x, -10_000, 10_000, 0),
      y: numberValue(value.y, -10_000, 10_000, 0),
      width: numberValue(value.width, 0.1, 10_000, 10),
      height: numberValue(value.height, 0.1, 10_000, 10),
      rotation: numberValue(value.rotation, -3600, 3600, 0),
      locked: Boolean(value.locked),
      hidden: Boolean(value.hidden),
      z: Math.round(numberValue(value.z, -1000, 1000, 0)),
      opacity: numberValue(value.opacity, 0, 1, 1),
      text: typeof value.text === 'string' ? stringValue(value.text, 2000) : undefined,
      role: typeof value.role === 'string' ? enumValue(value.role, ['name', 'title', 'company', 'body', 'custom'] as const, 'custom') : undefined,
      fill: typeof value.fill === 'string' && HEX_COLOR.test(value.fill) ? value.fill : undefined,
      stroke: typeof value.stroke === 'string' && HEX_COLOR.test(value.stroke) ? value.stroke : undefined,
      fontSize: typeof value.fontSize === 'number' ? numberValue(value.fontSize, 1, 1000, 12) : undefined,
      fontFamily: typeof value.fontFamily === 'string' ? stringValue(value.fontFamily, 120) : undefined,
      fontWeight: typeof value.fontWeight === 'number' ? Math.round(numberValue(value.fontWeight, 100, 900, 400)) : undefined,
      align: typeof value.align === 'string' ? enumValue(value.align, ['left', 'center', 'right'] as const, 'left') : undefined,
      letterSpacing: typeof value.letterSpacing === 'number' ? numberValue(value.letterSpacing, -20, 100, 0) : undefined,
      shape: typeof value.shape === 'string' ? enumValue(value.shape, ['rect', 'ellipse', 'line'] as const, 'rect') : undefined,
      radius: typeof value.radius === 'number' ? numberValue(value.radius, 0, 1000, 0) : undefined,
      gradient,
      strokeWidth: typeof value.strokeWidth === 'number' ? numberValue(value.strokeWidth, 0, 100, 0) : undefined,
      qrMode: typeof value.qrMode === 'string' ? enumValue(value.qrMode, ['vcard', 'url', 'digital'] as const, 'digital') : undefined,
      assetId
    }];
  });

  const qrStyle = isRecord(input.qrStyle) ? input.qrStyle : {};
  const share = isRecord(input.share) ? input.share : {};
  const pattern = qrStyle.pattern;
  const errorCorrection = qrStyle.errorCorrection;
  return {
    meta: {
      id: candidate.meta.id,
      name: candidate.meta.name,
      slug: candidate.meta.slug,
      createdAt: stringValue(candidate.meta.createdAt, 80, new Date(0).toISOString()),
      updatedAt: stringValue(candidate.meta.updatedAt, 80, new Date(0).toISOString()),
      templateId: stringValue(candidate.meta.templateId, 160)
    },
    identity: normalizeIdentity(candidate.identity),
    contacts: normalizeContacts(candidate.contacts),
    card: {
      preset: enumValue(candidate.card.preset, ['us', 'eu', 'jp', 'uk', 'square', 'mini'] as const, 'us'),
      orientation: enumValue(candidate.card.orientation, ['landscape', 'portrait'] as const, 'landscape'),
      widthMm: numberValue(candidate.card.widthMm, 20, 500, 88.9),
      heightMm: numberValue(candidate.card.heightMm, 20, 500, 50.8),
      bleedMm: numberValue(candidate.card.bleedMm, 0, 20, 3),
      cornerRadius: numberValue(candidate.card.cornerRadius, 0, 100, 0),
      density: enumValue(candidate.card.density, ['compact', 'regular', 'airy'] as const, 'regular'),
      alignment: enumValue(candidate.card.alignment, ['left', 'center', 'right'] as const, 'left'),
      padding: numberValue(candidate.card.padding, 0, 500, 24),
      safeAreaVisible: Boolean(candidate.card.safeAreaVisible),
      finish: enumValue(candidate.card.finish, ['matte', 'glossy'] as const, 'matte')
    },
    theme: {
      brand: candidate.theme.brand,
      surface: candidate.theme.surface,
      text: candidate.theme.text,
      accent: candidate.theme.accent,
      dark: Boolean(candidate.theme.dark),
      headingFont: stringValue(candidate.theme.headingFont, 120, 'Inter Variable'),
      bodyFont: stringValue(candidate.theme.bodyFont, 120, 'Inter Variable'),
      typeScale: numberValue(candidate.theme.typeScale, 0.5, 4, 1),
      weight: Math.round(numberValue(candidate.theme.weight, 100, 900, 600)),
      letterSpacing: numberValue(candidate.theme.letterSpacing, -20, 100, 0),
      lineHeight: numberValue(candidate.theme.lineHeight, 0.5, 5, 1.2)
    },
    assets: safeAssets,
    elements: safeElements,
    variants: candidate.variants.flatMap((value) => {
      if (!isRecord(value) || !validString(value.id, 160) || !validString(value.name, 200)) return [];
      return [{ id: value.id, name: value.name, identity: normalizeIdentity(value.identity), contacts: normalizeContacts(value.contacts).slice(0, 16) }];
    }),
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
