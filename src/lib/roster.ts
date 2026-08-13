import type { ContactItem, Design, DesignVariant, Identity } from '../types/design';
import { createId } from './id';

export const ROSTER_COLUMNS = ['name', 'title', 'company', 'department', 'tagline', 'pronouns', 'email', 'phone', 'website', 'address', 'social'] as const;
const MAX_ROSTER_ROWS = 250;

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n') {
      row.push(field.replace(/\r$/, ''));
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = '';
    } else field += character;
  }
  row.push(field.replace(/\r$/, ''));
  if (row.some((value) => value.trim())) rows.push(row);
  if (quoted) throw new Error('CSV has an unclosed quote');
  return rows;
}

function contact(kind: ContactItem['kind'], label: string, value: string): ContactItem | null {
  return value.trim() ? { id: createId('contact'), kind, label, value: value.trim().slice(0, 500) } : null;
}

export function variantsFromCsv(text: string, fallback: Design): DesignVariant[] {
  if (text.length > 500_000) throw new Error('Roster is larger than 500 KB');
  const rows = parseCsv(text.replace(/^\uFEFF/, ''));
  if (rows.length < 2) throw new Error('Roster needs a header and at least one person');
  const headers = rows[0].map((value) => value.trim().toLowerCase());
  if (!headers.includes('name')) throw new Error('Roster must include a name column');
  const indexes = new Map(headers.map((header, index) => [header, index]));
  const value = (row: string[], column: string) => (row[indexes.get(column) ?? -1] ?? '').trim().slice(0, 500);

  return rows.slice(1, MAX_ROSTER_ROWS + 1).flatMap((row) => {
    const name = value(row, 'name');
    if (!name) return [];
    const identity: Identity = {
      name,
      title: value(row, 'title') || fallback.identity.title,
      company: value(row, 'company') || fallback.identity.company,
      department: value(row, 'department'),
      tagline: value(row, 'tagline'),
      pronouns: value(row, 'pronouns')
    };
    const contacts = [
      contact('email', 'Email', value(row, 'email')),
      contact('phone', 'Mobile', value(row, 'phone')),
      contact('website', 'Web', value(row, 'website')),
      contact('address', 'Address', value(row, 'address')),
      contact('social', 'Social', value(row, 'social'))
    ].filter((item): item is ContactItem => Boolean(item));
    return [{ id: createId('variant'), name, identity, contacts }];
  });
}

function escapeCsv(value: string) {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

export function variantsToCsv(variants: DesignVariant[]) {
  const rows = variants.map((variant) => {
    const byKind = new Map(variant.contacts.map((item) => [item.kind, item.value]));
    const values = {
      ...variant.identity,
      email: byKind.get('email') ?? '',
      phone: byKind.get('phone') ?? '',
      website: byKind.get('website') ?? '',
      address: byKind.get('address') ?? '',
      social: byKind.get('social') ?? ''
    };
    return ROSTER_COLUMNS.map((column) => escapeCsv(values[column] ?? '')).join(',');
  });
  return [ROSTER_COLUMNS.join(','), ...rows].join('\r\n');
}

export function rosterTemplateCsv() {
  return `${ROSTER_COLUMNS.join(',')}\r\nAlex Rivera,Program Coordinator,Desert Innovation Hub,Entrepreneurship,Building useful things together.,they/them,alex@example.org,+1 555 0100,example.org,,linkedin.com/in/alexrivera`;
}
