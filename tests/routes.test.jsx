import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from '../src/App';

describe('Public Routing & Independent Platform Flow', () => {
  it('renders homepage without requiring user authentication', async () => {
    render(<App />);

    // Platform title and independent notice
    expect(screen.getAllByText('CS').length).toBeGreaterThan(0);
    expect(screen.getAllByText('HUB').length).toBeGreaterThan(0);
    expect(screen.getByText('Browse Resources')).toBeInTheDocument();
    expect(screen.getByText('Read Guides')).toBeInTheDocument();
  });
});
