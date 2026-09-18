import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Pricing from '../pages/Pricing';

describe('Pricing page', () => {
  test('shows the three packages with the correct prices', () => {
    render(
      <MemoryRouter>
        <Pricing />
      </MemoryRouter>
    );

    expect(screen.getByText('Starter')).toBeInTheDocument();
    expect(screen.getByText('₦150,000')).toBeInTheDocument();

    expect(screen.getByText('Growth')).toBeInTheDocument();
    expect(screen.getByText('₦250,000')).toBeInTheDocument();

    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('₦150,000 + ₦50,000/mo')).toBeInTheDocument();
  });
});
