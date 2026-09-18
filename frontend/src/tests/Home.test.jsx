import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from '../pages/Home';

// Home has no data dependencies, but wrap in a router since it uses <Link>.
describe('Home page', () => {
  test('leads with the core value proposition', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: /never miss a customer again/i })).toBeInTheDocument();
    expect(screen.getAllByText(/get started/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/try the demo/i).length).toBeGreaterThan(0);
  });
});
