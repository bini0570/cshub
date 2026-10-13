import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AcademicStudyMaterials } from '../src/components/home/AcademicStudyMaterials';
import { QuickQuizWidget } from '../src/components/home/QuickQuizWidget';

describe('Homepage Academic Materials & Quick Quiz Features', () => {
  it('renders academic year and subject dropdown filters and materials', () => {
    render(<AcademicStudyMaterials />);

    // Dropdowns
    expect(screen.getByText('All Academic Years')).toBeInTheDocument();
    expect(screen.getByText('All Subjects / Courses')).toBeInTheDocument();

    // Check material titles
    expect(
      screen.getByText(/Data Structures & Algorithms Comprehensive Final Cheatsheet/i)
    ).toBeInTheDocument();
  });

  it('filters study materials when an academic year is selected', () => {
    render(<AcademicStudyMaterials />);

    const yearSelect = screen.getByDisplayValue('All Academic Years');
    fireEvent.change(yearSelect, { target: { value: 'Year 3' } });

    // Should show Year 3 materials and hide Year 1 materials
    expect(
      screen.getByText(/Operating Systems & Kernel Internals Complete Lecture Slides & Notes/i)
    ).toBeInTheDocument();
  });

  it('renders interactive Quick Quiz widget and handles user answering with instant explanation', () => {
    render(<QuickQuizWidget />);

    expect(screen.getByText(/Interactive Daily CS Quick Quiz/i)).toBeInTheDocument();
    expect(screen.getByText(/Test Your Computer Science Knowledge/i)).toBeInTheDocument();

    // Click an answer option
    const firstOption = screen.getByText('O(n²)');
    fireEvent.click(firstOption);

    // Should reveal feedback
    expect(screen.getByText(/Correct Answer!/i)).toBeInTheDocument();
    expect(screen.getByText(/recursive call depth n/i)).toBeInTheDocument();

    // Next question button
    const nextBtn = screen.getByText(/Next Question/i);
    expect(nextBtn).toBeInTheDocument();
    fireEvent.click(nextBtn);

    // Question 2 should load
    expect(screen.getByText(/Coffman conditions/i)).toBeInTheDocument();
  });
});
