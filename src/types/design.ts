export type CardSide = 'front' | 'back';
export type ElementKind = 'text' | 'shape' | 'image' | 'qr';
export type ShapeKind = 'rect' | 'ellipse' | 'line';
export type TextRole = 'name' | 'title' | 'company' | 'body' | 'custom';
export type Density = 'compact' | 'regular' | 'airy';
export type Alignment = 'left' | 'center' | 'right';
export type CardPreset = 'us' | 'eu' | 'jp' | 'uk' | 'square' | 'mini';
export type Orientation = 'landscape' | 'portrait';
export type QrPattern = 'square' | 'rounded' | 'dots';
export type QrErrorCorrection = 'L' | 'M' | 'Q' | 'H';

export interface ContactItem {
  id: string;
  kind: 'phone' | 'email' | 'website' | 'address' | 'social';
  label: string;
  value: string;
}

export interface Identity {
  name: string;
  title: string;
  company: string;
  department: string;
  tagline: string;
  pronouns: string;
}

export interface CardSpec {
  preset: CardPreset;
  orientation: Orientation;
  widthMm: number;
  heightMm: number;
  bleedMm: number;
  cornerRadius: number;
  density: Density;
  alignment: Alignment;
  padding: number;
  safeAreaVisible: boolean;
  finish: 'matte' | 'glossy';
}

export interface Theme {
  brand: string;
  surface: string;
  text: string;
  accent: string;
  dark: boolean;
  headingFont: string;
  bodyFont: string;
  typeScale: number;
  weight: number;
  letterSpacing: number;
  lineHeight: number;
}

export interface DesignElement {
  id: string;
  side: CardSide;
  kind: ElementKind;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  locked: boolean;
  hidden: boolean;
  z: number;
  opacity?: number;
  // text
  text?: string;
  role?: TextRole;
  fill?: string;
  stroke?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  align?: Alignment;
  letterSpacing?: number;
  // shape
  shape?: ShapeKind;
  radius?: number;
  gradient?: [string, string];
  strokeWidth?: number;
  // qr
  qrMode?: 'vcard' | 'url' | 'digital';
  // image
  assetId?: string;
}

export interface DesignAsset {
  id: string;
  name: string;
  mime: string;
  dataUrl: string;
}

export interface DesignVariant {
  id: string;
  name: string;
  identity: Identity;
  contacts: ContactItem[];
}

export interface DesignMeta {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  templateId: string;
}

export interface QrStyle {
  pattern: QrPattern;
  foreground: string;
  background: string;
  margin: number;
  errorCorrection: QrErrorCorrection;
  centerMark: boolean;
}

export interface SharePreferences {
  includeEmail: boolean;
  includePhone: boolean;
  includeWebsite: boolean;
  includeSocial: boolean;
  includeAddress: boolean;
  includePronouns: boolean;
  includeTagline: boolean;
  includeImages: boolean;
  allowVcard: boolean;
  expiresAt: string | null;
}

export interface Design {
  meta: DesignMeta;
  identity: Identity;
  contacts: ContactItem[];
  card: CardSpec;
  theme: Theme;
  elements: DesignElement[];
  variants: DesignVariant[];
  assets: DesignAsset[];
  qrStyle: QrStyle;
  share: SharePreferences;
}
