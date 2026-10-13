import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Logo } from '../src/components/common/Logo';
import { Badge } from '../src/components/ui/Badge';
import { Button } from '../src/components/ui/Button';
import { EmptyState } from '../src/components/common/EmptyState';

describe('UI & Common Components', () => {
  it('renders CS Hub logo with brand wordmark and subtitle', () => {
    render(
      <BrowserRouter>
        <Logo size="md" />
      </BrowserRouter>
    );
    expect(screen.getByText('CS')).toBeInTheDocument();
    expect(screen.getByText('HUB')).toBeInTheDocument();
    expect(screen.getByText('Platform')).toBeInTheDocument();
    expect(screen.getByText('Student Tech Knowledge')).toBeInTheDocument();
  });

  it('renders Badge with children and variant styles', () => {
    render(<Badge variant="teal">Programming</Badge>);
    const badge = screen.getByText('Programming');
    expect(badge).toBeInTheDocument();
    expect(badge.parentElement).toHaveClass('text-teal-700');
  });

  it('renders Button and shows spinner when loading', () => {
    const { rerender } = render(<Button isLoading={false}>Save Material</Button>);
    expect(screen.getByText('Save Material')).toBeInTheDocument();

    rerender(<Button isLoading={true}>Save Material</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
  });

  it('renders EmptyState with custom title, description, and action button', () => {
    render(
      <EmptyState
        title="No resources found"
        description="Try adjusting your search criteria."
        actionLabel="Reset Filter"
        onAction={() => {}}
      />
    );
    expect(screen.getByText('No resources found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your search criteria.')).toBeInTheDocument();
    expect(screen.getByText('Reset Filter')).toBeInTheDocument();
  });
});
