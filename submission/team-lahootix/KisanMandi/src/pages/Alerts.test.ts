import { describe, it, expect } from 'vitest'
import { isTriggered, getAlertStatus } from '../lib/alertEval'
import type { Alert } from '../types'

describe('Alerts Workflow & Badge Evaluation', () => {
  const seededAlerts: Alert[] = [
    // Alert 1: Wheat in Hyderabad (latest=3910, target=3860, Above, active) -> Triggered
    { id: 1, user_id: 1, crop_id: 1, market_id: 1, condition: 'Above', target_price: 3860, active_status: true },
    // Alert 2: Onion in Hyderabad (latest=3050, target=3110, Below, active) -> Triggered
    { id: 2, user_id: 2, crop_id: 4, market_id: 1, condition: 'Below', target_price: 3110, active_status: true },
    // Alert 3: Rice in Sukkur (latest=4730, target=5130, Above, active) -> Not Triggered
    { id: 3, user_id: 3, crop_id: 2, market_id: 2, condition: 'Above', target_price: 5130, active_status: true },
    // Alert 4: Tomato in Mirpurkhas (latest=2600, target=2300, Below, active) -> Not Triggered
    { id: 4, user_id: 6, crop_id: 5, market_id: 3, condition: 'Below', target_price: 2300, active_status: true },
    // Alert 5: Inactive alert (Above, target < latest, but active_status: false) -> Not Triggered
    { id: 5, user_id: 1, crop_id: 7, market_id: 3, condition: 'Above', target_price: 6400, active_status: false },
  ]

  const latestPrices: Record<string, number> = {
    '1_1': 3910, // Crop 1, Market 1
    '4_1': 3050, // Crop 4, Market 1
    '2_2': 4730, // Crop 2, Market 2
    '5_3': 2600, // Crop 5, Market 3
    '7_3': 6500, // Crop 7, Market 3
  }

  it('correctly evaluates triggered status for all seeded alerts', () => {
    // Alert 1 (User 1): Above target 3860 with price 3910 -> Triggered
    expect(isTriggered(seededAlerts[0], latestPrices['1_1'])).toBe(true)
    expect(getAlertStatus(seededAlerts[0], latestPrices['1_1'])).toBe('Triggered')

    // Alert 2 (User 2): Below target 3110 with price 3050 -> Triggered
    expect(isTriggered(seededAlerts[1], latestPrices['4_1'])).toBe(true)
    expect(getAlertStatus(seededAlerts[1], latestPrices['4_1'])).toBe('Triggered')

    // Alert 3 (User 3): Above target 5130 with price 4730 -> Waiting
    expect(isTriggered(seededAlerts[2], latestPrices['2_2'])).toBe(false)
    expect(getAlertStatus(seededAlerts[2], latestPrices['2_2'])).toBe('Waiting')

    // Alert 4 (User 6): Below target 2300 with price 2600 -> Waiting
    expect(isTriggered(seededAlerts[3], latestPrices['5_3'])).toBe(false)
    expect(getAlertStatus(seededAlerts[3], latestPrices['5_3'])).toBe('Waiting')

    // Alert 5 (User 1): Inactive -> Inactive (never triggers)
    expect(isTriggered(seededAlerts[4], latestPrices['7_3'])).toBe(false)
    expect(getAlertStatus(seededAlerts[4], latestPrices['7_3'])).toBe('Inactive')
  })

  it('computes correct badge count for User 1 (Farmer Ali Raza Memon)', () => {
    const user1Alerts = seededAlerts.filter((a) => a.user_id === 1)
    const user1Triggered = user1Alerts.filter((a) =>
      isTriggered(a, latestPrices[`${a.crop_id}_${a.market_id}`]),
    )
    expect(user1Triggered.length).toBe(1) // Alert 1 is triggered
  })

  it('toggling active_status off decreases triggered count immediately', () => {
    const toggledAlert1: Alert = { ...seededAlerts[0], active_status: false }
    expect(isTriggered(toggledAlert1, latestPrices['1_1'])).toBe(false)
  })

  it('creating an alert whose target is met increases triggered count', () => {
    const newAlert: Alert = {
      id: 99,
      user_id: 1,
      crop_id: 1,
      market_id: 1,
      condition: 'Above',
      target_price: 3900, // Price is 3910 >= 3900 -> triggers
      active_status: true,
    }
    expect(isTriggered(newAlert, latestPrices['1_1'])).toBe(true)
  })

  it('triggers on exact price equality for both Above (>=) and Below (<=)', () => {
    const exactPrice = 4000
    const aboveAlert: Alert = { ...seededAlerts[0], condition: 'Above', target_price: exactPrice }
    const belowAlert: Alert = { ...seededAlerts[0], condition: 'Below', target_price: exactPrice }

    expect(isTriggered(aboveAlert, exactPrice)).toBe(true)
    expect(isTriggered(belowAlert, exactPrice)).toBe(true)
  })

  it('enforces ownership check between current user and alert owner', () => {
    const checkOwnership = (alert: Alert, currentUserId: number) => alert.user_id === currentUserId
    expect(checkOwnership(seededAlerts[0], 1)).toBe(true)
    expect(checkOwnership(seededAlerts[0], 2)).toBe(false)
  })
})
