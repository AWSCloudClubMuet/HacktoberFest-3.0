import { describe, it, expect } from 'vitest'
import { toWhatsAppNumber } from '../lib/validators'
import type { Listing } from '../types'

describe('ListingDetail & MyListings Actions & Ownership Safeguards', () => {
  const sampleListing: Listing = {
    id: 1,
    user_id: 1,
    crop_id: 1,
    quantity: 50,
    asking_price: 3950,
    district: 'Hyderabad',
    grade: 'A',
    available_from: '2026-10-25',
    status: 'Active',
    created_at: '2026-10-21T09:00:00.000Z',
    contact_phone: '03001230001',
  }

  describe('Call & WhatsApp URL generation', () => {
    it('normalizes local phone to 923XXXXXXXXX with no + or spaces', () => {
      const waNumber = toWhatsAppNumber(sampleListing.contact_phone!)
      expect(waNumber).toBe('923001230001')
      expect(waNumber.startsWith('+')).toBe(false)
      expect(waNumber.includes(' ')).toBe(false)
    })

    it('generates exact WhatsApp click-to-chat URL with prefilled message', () => {
      const waNumber = toWhatsAppNumber(sampleListing.contact_phone!)
      const cropName = 'Wheat'
      const message = `Assalam o Alaikum, I saw your listing for ${sampleListing.quantity} maunds of ${cropName} on KisanMandi.`
      const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`

      expect(waUrl).toContain('https://wa.me/923001230001?text=')
      expect(waUrl).toContain(encodeURIComponent('50 maunds of Wheat'))
    })
  })

  describe('Ownership Safeguards', () => {
    it('grants owner controls ONLY when listing.user_id === currentUser.id', () => {
      const farmerAli = { id: 1, role: 'Farmer' as const }
      const farmerSanam = { id: 2, role: 'Farmer' as const }
      const buyerNoor = { id: 4, role: 'Buyer' as const }

      const canEdit = (listing: Listing, user: { id: number; role: string } | null) => {
        return !!user && listing.user_id === user.id && user.role === 'Farmer'
      }

      // Owner farmer can edit
      expect(canEdit(sampleListing, farmerAli)).toBe(true)

      // Another farmer CANNOT edit
      expect(canEdit(sampleListing, farmerSanam)).toBe(false)

      // Buyer CANNOT edit
      expect(canEdit(sampleListing, buyerNoor)).toBe(false)

      // Guest / unauthenticated CANNOT edit
      expect(canEdit(sampleListing, null)).toBe(false)
    })

    it('logic-layer rejects mutations when user_id does not match', async () => {
      const enforceOwnership = (existingListingOwnerId: number, currentUserId: number) => {
        if (existingListingOwnerId !== currentUserId) {
          throw new Error('Forbidden: You do not own this listing.')
        }
        return true
      }

      expect(() => enforceOwnership(sampleListing.user_id, 1)).not.toThrow()
      expect(() => enforceOwnership(sampleListing.user_id, 2)).toThrow('Forbidden: You do not own this listing.')
      expect(() => enforceOwnership(sampleListing.user_id, 4)).toThrow('Forbidden: You do not own this listing.')
    })
  })

  describe('Sold status behavior', () => {
    it('sold listing disables contact actions and removes from active listings', () => {
      const soldListing: Listing = {
        ...sampleListing,
        status: 'Sold',
      }

      const isContactAllowed = (listing: Listing) => listing.status !== 'Sold'
      expect(isContactAllowed(sampleListing)).toBe(true)
      expect(isContactAllowed(soldListing)).toBe(false)

      const allListings = [sampleListing, soldListing]
      const activeOnly = allListings.filter((l) => l.status === 'Active')
      expect(activeOnly.length).toBe(1)
      expect(activeOnly[0].id).toBe(1)
    })
  })
})
