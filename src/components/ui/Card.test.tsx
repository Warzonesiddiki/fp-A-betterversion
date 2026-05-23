/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';

describe('Card', () => {
  it('renders Card with children', () => {
    render(
      <Card>
        <p>Card body</p>
      </Card>
    );
    expect(screen.getByText('Card body')).toBeInTheDocument();
  });

  it('renders CardHeader', () => {
    render(
      <CardHeader>
        <p>Header</p>
      </CardHeader>
    );
    expect(screen.getByText('Header')).toBeInTheDocument();
  });

  it('renders CardTitle with h3 tag', () => {
    render(<CardTitle>Title</CardTitle>);
    const title = screen.getByText('Title');
    expect(title.tagName).toBe('H3');
  });

  it('renders CardDescription', () => {
    render(<CardDescription>Description</CardDescription>);
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('renders CardContent with children', () => {
    render(
      <CardContent>
        <span>Content</span>
      </CardContent>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders CardFooter', () => {
    render(
      <CardFooter>
        <span>Footer</span>
      </CardFooter>
    );
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  it('renders composed card with all subcomponents', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>Main content</CardContent>
        <CardFooter>Footer content</CardFooter>
      </Card>
    );
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Description')).toBeInTheDocument();
    expect(screen.getByText('Main content')).toBeInTheDocument();
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });
});
