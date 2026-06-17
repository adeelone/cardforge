import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Inspector } from '../../src/editor/inspector/inspector';

describe('Inspector', () => {
  it('renders identity controls', () => {
    render(<Inspector />);
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
    expect(screen.getByText('Layers')).toBeInTheDocument();
    expect(screen.getByText('Logo & headshot')).toBeInTheDocument();
  });
});
