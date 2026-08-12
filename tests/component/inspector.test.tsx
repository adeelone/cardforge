import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Inspector } from '../../src/editor/inspector/inspector';

describe('Inspector', () => {
  it('renders identity, insert, layer, and export controls', () => {
    render(<Inspector />);
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByText('Layers')).toBeInTheDocument();
    expect(screen.getByText('Export & share')).toBeInTheDocument();
    // Insert toolbar exposes freeform element creation.
    const insert = within(screen.getByRole('group', { name: 'Insert elements' }));
    expect(insert.getByRole('button', { name: /Text/ })).toBeInTheDocument();
    expect(insert.getByRole('button', { name: /Shape/ })).toBeInTheDocument();
    expect(insert.getByRole('button', { name: /QR/ })).toBeInTheDocument();
  });
});
