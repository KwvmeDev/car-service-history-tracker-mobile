import { fireEvent, render, screen } from '@testing-library/react-native'

import { Badge } from './Badge'
import { Button } from './Button'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'
import { StatRow } from './StatRow'

describe('Button', () => {
  it('renders the label and fires onPress', () => {
    const onPress = jest.fn()
    render(<Button label="Generate resale report" onPress={onPress} />)
    fireEvent.press(screen.getByText('Generate resale report'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('does not fire while loading', () => {
    const onPress = jest.fn()
    render(<Button label="Save" loading onPress={onPress} />)
    fireEvent.press(screen.getByRole('button'))
    expect(onPress).not.toHaveBeenCalled()
  })
})

describe('Badge', () => {
  it('shows each status', () => {
    const { rerender } = render(<Badge label="Logged" status="neutral" />)
    expect(screen.getByText('Logged')).toBeOnTheScreen()
    rerender(<Badge label="Oil change due" status="due" />)
    expect(screen.getByText('Oil change due')).toBeOnTheScreen()
    rerender(<Badge label="Overdue" status="overdue" />)
    expect(screen.getByText('Overdue')).toBeOnTheScreen()
  })
})

describe('StatRow', () => {
  it('renders every stat value and label', () => {
    render(
      <StatRow
        stats={[
          { label: 'Mileage', value: '41,200' },
          { label: 'Records', value: '7' },
          { label: 'Owned since', value: '2021' },
        ]}
      />,
    )
    expect(screen.getByText('41,200')).toBeOnTheScreen()
    expect(screen.getByText('Records')).toBeOnTheScreen()
    expect(screen.getByText('2021')).toBeOnTheScreen()
  })
})

describe('EmptyState', () => {
  it('is designed, not "No items yet" — has a glyph, copy and a nudge action', () => {
    const onAction = jest.fn()
    render(
      <EmptyState
        glyph="🔑"
        title="Your garage is empty"
        body="Add your first vehicle to start its record."
        actionLabel="Add a vehicle"
        onAction={onAction}
      />,
    )
    expect(screen.getByText('Your garage is empty')).toBeOnTheScreen()
    fireEvent.press(screen.getByText('Add a vehicle'))
    expect(onAction).toHaveBeenCalled()
  })
})

describe('ErrorState', () => {
  it('is inline and actionable', () => {
    const onRetry = jest.fn()
    render(<ErrorState onRetry={onRetry} />)
    fireEvent.press(screen.getByText('Try again'))
    expect(onRetry).toHaveBeenCalled()
  })
})
