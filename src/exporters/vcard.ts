import type { Design } from '../types/design';

function escapeValue(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

export function createVCard(design: Design) {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:4.0',
    `FN:${escapeValue(design.identity.name)}`,
    `ORG:${escapeValue(design.identity.company)};${escapeValue(design.identity.department)}`,
    `TITLE:${escapeValue(design.identity.title)}`,
    design.identity.tagline ? `NOTE:${escapeValue(design.identity.tagline)}` : ''
  ].filter(Boolean);

  for (const contact of design.contacts) {
    if (!contact.value.trim()) continue;
    if (contact.kind === 'email') lines.push(`EMAIL;TYPE=${contact.label.toUpperCase()}:${escapeValue(contact.value)}`);
    if (contact.kind === 'phone') lines.push(`TEL;TYPE=${contact.label.toUpperCase()}:${escapeValue(contact.value)}`);
    if (contact.kind === 'website' || contact.kind === 'social') lines.push(`URL;TYPE=${contact.label.toUpperCase()}:${escapeValue(contact.value)}`);
    if (contact.kind === 'address') lines.push(`ADR;TYPE=${contact.label.toUpperCase()}:;;${escapeValue(contact.value)};;;;`);
  }

  lines.push('END:VCARD');
  return `${lines.join('\r\n')}\r\n`;
}
