import React from 'react'
import { render, fireEvent } from '@testing-library/react'

// Mock translations
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k, vars) => {
      if (k === 'tour.duration') return `${vars.minutes} minutes`
      return k
    },
    i18n: { language: 'en' }
  })
}))

// Mock react-router location
jest.mock('react-router-dom', () => ({ useLocation: () => ({ pathname: '/' }) }))

// Mock onboarding context and hooks
jest.mock('../../contexts/OnboardingContext', () => ({
  useOnboarding: () => ({ isTourCompleted: (id) => id === 'completed-tour' })
}))

jest.mock('../../hooks/useUserRole', () => ({ __esModule: true, default: () => ({ role: 'visitor' }) }))

// Mock the tours config modules
jest.mock('../../config/tourSteps/visitorTourSteps', () => ({
  getAllVisitorTours: () => ([
    { id: 'visitor-welcome', title: 'Welcome', description: 'Welcome tour' },
    { id: 'completed-tour', title: 'Completed', description: 'Already done' }
  ])
}))

jest.mock('../../config/tourSteps/adminTourSteps', () => ({
  getAllAdminTours: () => ([{ id: 'admin-first', title: 'Admin', description: 'Admin tour', roles: ['admin'] }])
}))

// Mock the onboarding hook which returns start function used by TourCard
jest.mock('../../hooks/useOnboardingTour', () => ({ __esModule: true, default: (tour) => ({ start: jest.fn() }) }))

import TourList from '../onboarding/TourList'

describe('TourList', () => {
  test('renders available tours for visitor and allows start', () => {
    const { getByText, getAllByRole } = render(<TourList />)

    // Should show visitor tours (two from mock)
    expect(getByText('Welcome')).toBeInTheDocument()
    expect(getByText('Completed')).toBeInTheDocument()

    // Start/restart buttons exist on both cards (2 buttons expected)
    const buttons = getAllByRole('button')
    expect(buttons.length).toBeGreaterThanOrEqual(2)
  })

  test('shows no tours when none available', () => {
    const visitorModule = require('../../config/tourSteps/visitorTourSteps')
    const adminModule = require('../../config/tourSteps/adminTourSteps')
    const onboardingCtx = require('../../contexts/OnboardingContext')

    const visitorSpy = jest.spyOn(visitorModule, 'getAllVisitorTours').mockReturnValue([])
    const adminSpy = jest.spyOn(adminModule, 'getAllAdminTours').mockReturnValue([])
    const onboardSpy = jest.spyOn(onboardingCtx, 'useOnboarding').mockImplementation(() => ({ isTourCompleted: () => false }))

    const { getByText } = render(<TourList />)
    expect(getByText('tour.noToursAvailable')).toBeInTheDocument()

    // restore spies
    visitorSpy.mockRestore()
    adminSpy.mockRestore()
    onboardSpy.mockRestore()
  })
})
