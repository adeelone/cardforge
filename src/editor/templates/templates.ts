import type { Design, DesignElement, Theme } from '../../types/design';
import { createId, slugify } from '../../lib/id';
import { presetSize } from '../../lib/units';

export type TemplateCategory = 'Professional' | 'Minimal' | 'Creative';

export interface TemplateDefinition {
  id: string;
  name: string;
  notes: string;
  category: TemplateCategory;
  theme: Theme;
  cornerRadius?: number;
  elements: DesignElement[];
}

const baseTheme: Theme = {
  brand: '#1f5f5b',
  surface: '#f8f4ec',
  text: '#1b1d1b',
  accent: '#b9633b',
  dark: false,
  headingFont: 'Fraunces',
  bodyFont: 'Inter',
  typeScale: 1,
  weight: 600,
  letterSpacing: 0,
  lineHeight: 1.15
};

function el(partial: Partial<DesignElement> & Pick<DesignElement, 'id' | 'side' | 'kind' | 'label'>): DesignElement {
  return {
    x: 16,
    y: 16,
    width: 160,
    height: 24,
    rotation: 0,
    locked: false,
    hidden: false,
    z: 1,
    ...partial
  };
}

export const templates: TemplateDefinition[] = [
  {
    id: 'atelier',
    name: 'Atelier',
    notes: 'Editorial serif with a quiet accent band for consultancies and studios.',
    category: 'Professional',
    theme: baseTheme,
    elements: [
      el({ id: 'brand-band', side: 'front', kind: 'shape', shape: 'rect', label: 'Accent band', x: 0, y: 0, width: 52, height: 192, fill: '#1f5f5b', z: 0 }),
      el({ id: 'name', side: 'front', kind: 'text', role: 'name', label: 'Name', x: 72, y: 50, width: 230, height: 34, text: '{name}', fontSize: 23, z: 2 }),
      el({ id: 'title', side: 'front', kind: 'text', role: 'title', label: 'Title', x: 74, y: 88, width: 220, height: 18, text: '{title}', fontSize: 11, z: 2 }),
      el({ id: 'company', side: 'front', kind: 'text', role: 'company', label: 'Company', x: 74, y: 124, width: 210, height: 20, text: '{company}', fontSize: 13, z: 2 }),
      el({ id: 'contact', side: 'back', kind: 'text', role: 'body', label: 'Contact stack', x: 30, y: 38, width: 240, height: 88, text: '{contacts}', fontSize: 10, z: 2 }),
      el({ id: 'qr', side: 'back', kind: 'qr', label: 'QR code', x: 286, y: 104, width: 54, height: 54, qrMode: 'digital', z: 2 })
    ]
  },
  {
    id: 'signal',
    name: 'Signal',
    notes: 'Strong brand field and compact back for product teams.',
    category: 'Professional',
    theme: { ...baseTheme, brand: '#2242a3', surface: '#f6f7fb', accent: '#d5a72f', headingFont: 'Geist', bodyFont: 'IBM Plex Sans' },
    elements: [
      el({ id: 'brand-field', side: 'front', kind: 'shape', shape: 'rect', label: 'Brand field', x: 0, y: 0, width: 336, height: 192, fill: '#2242a3', z: 0 }),
      el({ id: 'name', side: 'front', kind: 'text', role: 'name', label: 'Name', x: 28, y: 42, width: 260, height: 36, text: '{name}', fill: '#ffffff', fontSize: 24, z: 2 }),
      el({ id: 'title', side: 'front', kind: 'text', role: 'title', label: 'Title', x: 30, y: 84, width: 230, height: 18, text: '{title}', fill: '#e9ecff', fontSize: 11, z: 2 }),
      el({ id: 'tagline', side: 'front', kind: 'text', role: 'body', label: 'Tagline', x: 30, y: 132, width: 250, height: 26, text: '{tagline}', fill: '#ffffff', fontSize: 12, z: 2 }),
      el({ id: 'company', side: 'back', kind: 'text', role: 'company', label: 'Company', x: 26, y: 28, width: 260, height: 24, text: '{company}', fontSize: 16, z: 2 }),
      el({ id: 'contact', side: 'back', kind: 'text', role: 'body', label: 'Contact stack', x: 26, y: 64, width: 230, height: 90, text: '{contacts}', fontSize: 10, z: 2 }),
      el({ id: 'qr', side: 'back', kind: 'qr', label: 'QR code', x: 276, y: 108, width: 48, height: 48, qrMode: 'vcard', z: 2 })
    ]
  },
  {
    id: 'quiet-grid',
    name: 'Quiet Grid',
    notes: 'Structured, utilitarian layout for professional services.',
    category: 'Professional',
    theme: { ...baseTheme, brand: '#304642', surface: '#fbfaf6', accent: '#8f3f2d', headingFont: 'Manrope', bodyFont: 'Inter' },
    elements: [
      el({ id: 'rule', side: 'front', kind: 'shape', shape: 'rect', label: 'Rule', x: 24, y: 130, width: 286, height: 2, fill: '#8f3f2d', z: 1 }),
      el({ id: 'name', side: 'front', kind: 'text', role: 'name', label: 'Name', x: 24, y: 44, width: 260, height: 32, text: '{name}', fontSize: 22, z: 2 }),
      el({ id: 'title', side: 'front', kind: 'text', role: 'title', label: 'Title', x: 25, y: 82, width: 210, height: 18, text: '{title}', fontSize: 11, z: 2 }),
      el({ id: 'company', side: 'front', kind: 'text', role: 'company', label: 'Company', x: 25, y: 142, width: 210, height: 18, text: '{company}', fontSize: 11, z: 2 }),
      el({ id: 'contact', side: 'back', kind: 'text', role: 'body', label: 'Contact stack', x: 26, y: 42, width: 230, height: 96, text: '{contacts}', fontSize: 10, z: 2 }),
      el({ id: 'qr', side: 'back', kind: 'qr', label: 'QR code', x: 274, y: 112, width: 48, height: 48, qrMode: 'url', z: 2 })
    ]
  },
  {
    id: 'mono-lab',
    name: 'Mono Lab',
    notes: 'Technical monospace details paired with clean product typography.',
    category: 'Professional',
    theme: { ...baseTheme, brand: '#111315', surface: '#f4f6f2', accent: '#45a77a', headingFont: 'IBM Plex Sans', bodyFont: 'JetBrains Mono' },
    elements: [
      el({ id: 'name', side: 'front', kind: 'text', role: 'name', label: 'Name', x: 24, y: 38, width: 250, height: 30, text: '{name}', fontSize: 22, z: 2 }),
      el({ id: 'title', side: 'front', kind: 'text', role: 'title', label: 'Title', x: 24, y: 78, width: 230, height: 18, text: '{title}', fontSize: 10, z: 2 }),
      el({ id: 'accent', side: 'front', kind: 'shape', shape: 'ellipse', label: 'Accent dot', x: 296, y: 38, width: 14, height: 14, fill: '#45a77a', z: 2 }),
      el({ id: 'company', side: 'back', kind: 'text', role: 'company', label: 'Company', x: 26, y: 28, width: 210, height: 20, text: '{company}', fontSize: 13, z: 2 }),
      el({ id: 'contact', side: 'back', kind: 'text', role: 'body', label: 'Contact stack', x: 26, y: 62, width: 250, height: 90, text: '{contacts}', fontSize: 9, z: 2 }),
      el({ id: 'qr', side: 'back', kind: 'qr', label: 'QR code', x: 282, y: 28, width: 44, height: 44, qrMode: 'digital', z: 2 })
    ]
  },
  {
    id: 'gallery',
    name: 'Gallery',
    notes: 'Large logo/headshot zone with generous spacing for creative practices.',
    category: 'Creative',
    theme: { ...baseTheme, brand: '#5f3047', surface: '#f9f1f4', accent: '#2d7f88', headingFont: 'Playfair Display', bodyFont: 'Manrope' },
    elements: [
      el({ id: 'photo', side: 'front', kind: 'shape', shape: 'ellipse', label: 'Image mask', x: 24, y: 24, width: 76, height: 76, fill: '#5f3047', z: 1 }),
      el({ id: 'name', side: 'front', kind: 'text', role: 'name', label: 'Name', x: 120, y: 38, width: 190, height: 32, text: '{name}', fontSize: 22, z: 2 }),
      el({ id: 'title', side: 'front', kind: 'text', role: 'title', label: 'Title', x: 122, y: 78, width: 180, height: 18, text: '{title}', fontSize: 10, z: 2 }),
      el({ id: 'tagline', side: 'front', kind: 'text', role: 'body', label: 'Tagline', x: 24, y: 128, width: 250, height: 30, text: '{tagline}', fontSize: 12, z: 2 }),
      el({ id: 'contact', side: 'back', kind: 'text', role: 'body', label: 'Contact stack', x: 26, y: 44, width: 230, height: 86, text: '{contacts}', fontSize: 10, z: 2 }),
      el({ id: 'qr', side: 'back', kind: 'qr', label: 'QR code', x: 274, y: 108, width: 52, height: 52, qrMode: 'digital', z: 2 })
    ]
  },
  {
    id: 'foundry',
    name: 'Foundry',
    notes: 'Dense but balanced layout for operations, finance, and legal teams.',
    category: 'Professional',
    theme: { ...baseTheme, brand: '#38433f', surface: '#f7f5ef', accent: '#a64332', headingFont: 'IBM Plex Sans', bodyFont: 'IBM Plex Sans' },
    elements: [
      el({ id: 'company', side: 'front', kind: 'text', role: 'company', label: 'Company', x: 24, y: 24, width: 170, height: 18, text: '{company}', fontSize: 12, z: 2 }),
      el({ id: 'name', side: 'front', kind: 'text', role: 'name', label: 'Name', x: 24, y: 96, width: 230, height: 32, text: '{name}', fontSize: 22, z: 2 }),
      el({ id: 'title', side: 'front', kind: 'text', role: 'title', label: 'Title', x: 26, y: 132, width: 210, height: 18, text: '{title}', fontSize: 10, z: 2 }),
      el({ id: 'contact', side: 'back', kind: 'text', role: 'body', label: 'Contact stack', x: 24, y: 30, width: 252, height: 110, text: '{contacts}', fontSize: 10, z: 2 }),
      el({ id: 'qr', side: 'back', kind: 'qr', label: 'QR code', x: 286, y: 112, width: 42, height: 42, qrMode: 'vcard', z: 2 })
    ]
  },
  {
    id: 'duotone',
    name: 'Duotone',
    notes: 'Split field composition with strong but print-friendly contrast.',
    category: 'Creative',
    theme: { ...baseTheme, brand: '#185c70', surface: '#f3f7f8', accent: '#c07f36', headingFont: 'Geist', bodyFont: 'Inter' },
    elements: [
      el({ id: 'left-field', side: 'front', kind: 'shape', shape: 'rect', label: 'Left field', x: 0, y: 0, width: 168, height: 192, fill: '#185c70', z: 0 }),
      el({ id: 'name', side: 'front', kind: 'text', role: 'name', label: 'Name', x: 24, y: 46, width: 126, height: 42, text: '{name}', fill: '#ffffff', fontSize: 20, z: 2 }),
      el({ id: 'title', side: 'front', kind: 'text', role: 'title', label: 'Title', x: 190, y: 60, width: 118, height: 36, text: '{title}', fontSize: 11, z: 2 }),
      el({ id: 'company', side: 'front', kind: 'text', role: 'company', label: 'Company', x: 190, y: 122, width: 120, height: 18, text: '{company}', fontSize: 11, z: 2 }),
      el({ id: 'contact', side: 'back', kind: 'text', role: 'body', label: 'Contact stack', x: 26, y: 38, width: 230, height: 92, text: '{contacts}', fontSize: 10, z: 2 }),
      el({ id: 'qr', side: 'back', kind: 'qr', label: 'QR code', x: 278, y: 110, width: 48, height: 48, qrMode: 'digital', z: 2 })
    ]
  },
  {
    id: 'minimal',
    name: 'Minimal',
    notes: 'Sparse and calm for users who want the content to do the work.',
    category: 'Minimal',
    theme: { ...baseTheme, brand: '#2f4b4a', surface: '#ffffff', accent: '#7a5c3c', headingFont: 'Inter', bodyFont: 'Inter' },
    cornerRadius: 6,
    elements: [
      el({ id: 'name', side: 'front', kind: 'text', role: 'name', label: 'Name', x: 28, y: 72, width: 240, height: 30, text: '{name}', fontSize: 22, z: 2 }),
      el({ id: 'title', side: 'front', kind: 'text', role: 'title', label: 'Title', x: 30, y: 108, width: 220, height: 18, text: '{title}', fontSize: 10, z: 2 }),
      el({ id: 'company', side: 'back', kind: 'text', role: 'company', label: 'Company', x: 28, y: 30, width: 220, height: 18, text: '{company}', fontSize: 12, z: 2 }),
      el({ id: 'contact', side: 'back', kind: 'text', role: 'body', label: 'Contact stack', x: 28, y: 64, width: 230, height: 90, text: '{contacts}', fontSize: 10, z: 2 }),
      el({ id: 'qr', side: 'back', kind: 'qr', label: 'QR code', x: 284, y: 118, width: 42, height: 42, qrMode: 'digital', z: 2 })
    ]
  },
  {
    id: 'neon',
    name: 'Neon',
    notes: 'Dark, high-energy gradient for founders, DJs, and side projects.',
    category: 'Creative',
    cornerRadius: 16,
    theme: {
      ...baseTheme,
      brand: '#a855f7',
      surface: '#0b0f1a',
      text: '#e9edff',
      accent: '#22d3ee',
      dark: true,
      headingFont: 'Space Grotesk',
      bodyFont: 'Space Grotesk',
      weight: 700
    },
    elements: [
      el({ id: 'glow', side: 'front', kind: 'shape', shape: 'rect', label: 'Gradient field', x: 0, y: 0, width: 336, height: 192, gradient: ['#7c3aed', '#22d3ee'], opacity: 0.9, z: 0 }),
      el({ id: 'panel', side: 'front', kind: 'shape', shape: 'rect', label: 'Panel', x: 16, y: 16, width: 304, height: 160, fill: '#0b0f1a', radius: 12, opacity: 0.62, z: 1 }),
      el({ id: 'name', side: 'front', kind: 'text', role: 'name', label: 'Name', x: 32, y: 54, width: 260, height: 34, text: '{name}', fill: '#ffffff', fontSize: 26, z: 2 }),
      el({ id: 'title', side: 'front', kind: 'text', role: 'title', label: 'Title', x: 34, y: 98, width: 250, height: 18, text: '{title}', fill: '#a5f3fc', fontSize: 11, z: 2 }),
      el({ id: 'tagline', side: 'front', kind: 'text', role: 'body', label: 'Tagline', x: 34, y: 130, width: 250, height: 26, text: '{tagline}', fill: '#e9edff', fontSize: 11, z: 2 }),
      el({ id: 'contact', side: 'back', kind: 'text', role: 'body', label: 'Contact stack', x: 28, y: 40, width: 240, height: 96, text: '{contacts}', fill: '#e9edff', fontSize: 10, z: 2 }),
      el({ id: 'qr', side: 'back', kind: 'qr', label: 'QR code', x: 276, y: 108, width: 48, height: 48, qrMode: 'digital', z: 2 })
    ]
  },
  {
    id: 'marquee',
    name: 'Marquee',
    notes: 'Oversized display type that turns a name into a statement.',
    category: 'Creative',
    cornerRadius: 4,
    theme: {
      ...baseTheme,
      brand: '#f43f5e',
      surface: '#111114',
      text: '#fafafa',
      accent: '#f43f5e',
      dark: true,
      headingFont: 'Bebas Neue',
      bodyFont: 'Space Grotesk',
      weight: 400,
      letterSpacing: 1
    },
    elements: [
      el({ id: 'bar', side: 'front', kind: 'shape', shape: 'rect', label: 'Accent bar', x: 0, y: 150, width: 336, height: 42, fill: '#f43f5e', z: 0 }),
      el({ id: 'name', side: 'front', kind: 'text', role: 'name', label: 'Name', x: 24, y: 34, width: 300, height: 70, text: '{name}', fill: '#fafafa', fontSize: 52, z: 2 }),
      el({ id: 'title', side: 'front', kind: 'text', role: 'title', label: 'Title', x: 26, y: 158, width: 220, height: 20, text: '{title}', fill: '#111114', fontSize: 12, z: 3 }),
      el({ id: 'company', side: 'back', kind: 'text', role: 'company', label: 'Company', x: 24, y: 30, width: 260, height: 40, text: '{company}', fontSize: 30, z: 2 }),
      el({ id: 'contact', side: 'back', kind: 'text', role: 'body', label: 'Contact stack', x: 26, y: 78, width: 240, height: 96, text: '{contacts}', fontSize: 10, z: 2 }),
      el({ id: 'qr', side: 'back', kind: 'qr', label: 'QR code', x: 280, y: 120, width: 44, height: 44, qrMode: 'digital', z: 2 })
    ]
  },
  {
    id: 'sunset',
    name: 'Sunset',
    notes: 'Warm gradient wash for photographers, cafes, and lifestyle brands.',
    category: 'Creative',
    cornerRadius: 14,
    theme: {
      ...baseTheme,
      brand: '#fb7185',
      surface: '#2a1533',
      text: '#fff5f0',
      accent: '#fbbf24',
      dark: true,
      headingFont: 'Fraunces',
      bodyFont: 'Manrope'
    },
    elements: [
      el({ id: 'wash', side: 'front', kind: 'shape', shape: 'rect', label: 'Gradient wash', x: 0, y: 0, width: 336, height: 192, gradient: ['#fb7185', '#fbbf24'], z: 0 }),
      el({ id: 'name', side: 'front', kind: 'text', role: 'name', label: 'Name', x: 28, y: 60, width: 260, height: 34, text: '{name}', fill: '#2a1533', fontSize: 26, z: 2 }),
      el({ id: 'title', side: 'front', kind: 'text', role: 'title', label: 'Title', x: 30, y: 102, width: 250, height: 18, text: '{title}', fill: '#3d1f2b', fontSize: 12, z: 2 }),
      el({ id: 'tagline', side: 'front', kind: 'text', role: 'body', label: 'Tagline', x: 30, y: 134, width: 250, height: 24, text: '{tagline}', fill: '#3d1f2b', fontSize: 11, z: 2 }),
      el({ id: 'contact', side: 'back', kind: 'text', role: 'body', label: 'Contact stack', x: 28, y: 42, width: 240, height: 96, text: '{contacts}', fill: '#fff5f0', fontSize: 10, z: 2 }),
      el({ id: 'qr', side: 'back', kind: 'qr', label: 'QR code', x: 276, y: 110, width: 48, height: 48, qrMode: 'digital', z: 2 })
    ]
  }
];

export function createStarterDesign(templateId = 'atelier'): Design {
  const now = new Date().toISOString();
  const template = templates.find((item) => item.id === templateId) ?? templates[0];
  const { widthMm, heightMm } = presetSize('us', 'landscape');
  const identity = {
    name: 'Avery Stone',
    title: 'Principal Designer',
    company: 'Northline Studio',
    department: 'Brand Systems',
    tagline: 'Identity systems for focused teams.',
    pronouns: ''
  };
  const contacts = [
    { id: createId('contact'), kind: 'email' as const, label: 'Email', value: 'avery@northline.example' },
    { id: createId('contact'), kind: 'phone' as const, label: 'Mobile', value: '+1 555 0148' },
    { id: createId('contact'), kind: 'website' as const, label: 'Web', value: 'northline.example' },
    { id: createId('contact'), kind: 'social' as const, label: 'LinkedIn', value: 'linkedin.com/in/averystone' }
  ];
  return {
    meta: {
      id: createId('design'),
      name: 'Avery Stone business card',
      slug: slugify('Avery Stone business card'),
      createdAt: now,
      updatedAt: now,
      templateId: template.id
    },
    identity,
    contacts,
    card: {
      preset: 'us',
      orientation: 'landscape',
      widthMm,
      heightMm,
      bleedMm: 3,
      cornerRadius: template.cornerRadius ?? 10,
      density: 'regular',
      alignment: 'left',
      padding: 24,
      safeAreaVisible: true,
      finish: 'matte'
    },
    theme: template.theme,
    elements: template.elements.map((element) => ({ ...element })),
    variants: [{ id: createId('variant'), name: 'Default', identity, contacts }],
    assets: []
  };
}
