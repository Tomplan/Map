import React from 'react'
import { render } from '@testing-library/react'

// Mock the hook used inside the component so we can assert render prop values
jest.mock('../../hooks/useOnboardingTour', () => ({
  __esModule: true,
  default: jest.fn(() => ({ start: jest.fn(), stop: jest.fn(), isActive: false }))
}))

import OnboardingTour from '../onboarding/OnboardingTour'

describe('OnboardingTour component', () => {
  afterEach(() => jest.clearAllMocks())

  test('renders children as function with start/stop/isActive', () => {
    const { getByText } = render(
      <OnboardingTour tourConfig={{ id: 't1', steps: [] }}>
        {({ start, stop, isActive }) => (
          <div>
            <button onClick={start}>start</button>
            <button onClick={stop}>stop</button>
            <span>{isActive ? 'active' : 'inactive'}</span>
          </div>
        )}
      </OnboardingTour>
    )

    expect(getByText('start')).toBeInTheDocument()
    expect(getByText('stop')).toBeInTheDocument()
    expect(getByText('inactive')).toBeInTheDocument()
  })

  test('renders children node when provided', () => {
    const { getByText } = render(
      <OnboardingTour tourConfig={{ id: 't2', steps: [] }}>
        <div>plain-child</div>
      </OnboardingTour>
    )

    expect(getByText('plain-child')).toBeInTheDocument()
  })
})
