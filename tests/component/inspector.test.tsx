import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Inspector } from '../../src/editor/inspector/inspector';
import { useToastStore } from '../../src/lib/toast';

vi.mock('idb-keyval', () => ({
  createStore: () => ({}),
  entries: async () => [],
  get: async () => undefined,
  set: async () => {
    throw new Error('storage unavailable');
  },
  del: async () => {},
  clear: async () => {}
}));

describe('Inspector', () => {
  it('renders identity, insert, layer, and export controls', () => {
    render(<Inspector />);
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByText('Layers')).toBeInTheDocument();
    expect(screen.getByText('Privacy & sharing')).toBeInTheDocument();
    expect(screen.getByText('Team & roster')).toBeInTheDocument();
    // Insert toolbar exposes freeform element creation.
    const insert = within(screen.getByRole('group', { name: 'Insert elements' }));
    expect(insert.getByRole('button', { name: /Text/ })).toBeInTheDocument();
    expect(insert.getByRole('button', { name: /Shape/ })).toBeInTheDocument();
    expect(insert.getByRole('button', { name: /QR/ })).toBeInTheDocument();
  });

  it('shows an error toast instead of a false success when saving fails', async () => {
    useToastStore.setState({ toasts: [] });
    render(<Inspector />);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      const messages = useToastStore.getState().toasts.map((toast) => toast.message);
      expect(messages.some((message) => message.includes('Could not save'))).toBe(true);
    });
    const messages = useToastStore.getState().toasts.map((toast) => toast.message);
    expect(messages).not.toContain('Design saved locally');
  });
});
