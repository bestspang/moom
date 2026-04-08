import { render, screen, fireEvent } from '@/test/test-utils';
import { EmptyState } from './EmptyState';

describe('EmptyState (common)', () => {
  it('renders message text', () => {
    render(<EmptyState message="No data available" />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<EmptyState message="Empty" description="Try adding some items" />);
    expect(screen.getByText('Try adding some items')).toBeInTheDocument();
  });

  it('renders custom icon when provided', () => {
    render(
      <EmptyState
        message="Empty"
        icon={<span data-testid="custom-icon">icon</span>}
      />
    );
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('does not render icon area when variant is default and no icon', () => {
    const { container } = render(<EmptyState message="Empty" />);
    // The icon wrapper div has class text-muted-foreground/40
    const iconWrapper = container.querySelector('.text-muted-foreground\\/40');
    expect(iconWrapper).not.toBeInTheDocument();
  });

  it('renders actionLabel button and calls onAction on click', () => {
    const onAction = vi.fn();
    render(
      <EmptyState message="Empty" actionLabel="Add Item" onAction={onAction} />
    );
    const button = screen.getByText('Add Item');
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(onAction).toHaveBeenCalledOnce();
  });
});
