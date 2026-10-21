import { z } from 'zod'

export const SINDH_DISTRICTS = [
  'Hyderabad',
  'Karachi',
  'Sukkur',
  'Larkana',
  'Mirpurkhas',
  'Jamshoro',
  'Thatta',
  'Badin',
  'Nawabshah (Shaheed Benazirabad)',
  'Khairpur',
  'Dadu',
  'Ghotki',
  'Umerkot',
  'Tharparkar',
  'Sanghar',
  'Tando Allahyar',
  'Tando Muhammad Khan',
  'Matiari',
  'Kashmore',
  'Shikarpur',
  'Jacobabad',
  'Naushahro Feroze',
] as const

/**
 * Normalizes a Pakistani phone number to 03XXXXXXXXX format.
 * Accepts: 03XXXXXXXXX, +923XXXXXXXXX, 923XXXXXXXXX (with or without spaces/dashes).
 * Returns: normalized 11-digit string or null if invalid.
 */
export function normalizePhone(input: string | null | undefined): string | null {
  if (!input) return null
  const cleaned = input.replace(/[\s\-()]/g, '')

  if (/^\+923\d{9}$/.test(cleaned)) {
    return '0' + cleaned.slice(3)
  }
  if (/^923\d{9}$/.test(cleaned)) {
    return '0' + cleaned.slice(2)
  }
  if (/^03\d{9}$/.test(cleaned)) {
    return cleaned
  }
  return null
}

/**
 * Converts a Pakistani phone number to WhatsApp international format (e.g. 923001234567).
 */
export function toWhatsAppNumber(phone: string): string {
  const normalized = normalizePhone(phone)
  if (normalized) {
    return '92' + normalized.slice(1)
  }
  // Fallback cleanup
  return phone.replace(/[^\d]/g, '')
}

/**
 * Checks if a YYYY-MM-DD date string is today or in the future.
 * Uses string comparison as required by SPEC.md section 14.
 */
export function isDateNotPast(dateStr: string): boolean {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const todayStr = `${year}-${month}-${day}`
  return dateStr >= todayStr
}

// User Schema
export const userSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name must not exceed 60 characters'),
  phone: z
    .string()
    .trim()
    .refine((val) => normalizePhone(val) !== null, {
      message: 'Please enter a valid Pakistani mobile number (e.g. 03001234567 or +923001234567)',
    }),
  district: z.string().min(1, 'Please select your district'),
  role: z.enum(['Farmer', 'Buyer'], {
    required_error: 'Please select a role',
  }),
})

export type UserFormData = z.infer<typeof userSchema>

// Listing Schema
export const listingSchema = z.object({
  crop_id: z.coerce.number().positive('Please select a crop'),
  quantity: z.coerce.number().positive('Quantity must be greater than 0 maunds'),
  asking_price: z.coerce.number().positive('Asking price must be greater than 0 PKR'),
  district: z.string().min(1, 'Please select a district'),
  grade: z.enum(['A', 'B', 'C'], {
    required_error: 'Please select a grade',
  }),
  available_from: z.string().min(1, 'Please select an availability date'),
  contact_phone: z
    .string()
    .trim()
    .refine((val) => normalizePhone(val) !== null, {
      message: 'Please enter a valid Pakistani mobile number (e.g. 03001234567)',
    }),
})

export type ListingFormData = z.infer<typeof listingSchema>

// Alert Schema
export const alertSchema = z.object({
  crop_id: z.coerce.number().positive('Please select a crop'),
  market_id: z.coerce.number().positive('Please select a market'),
  condition: z.enum(['Above', 'Below']),
  target_price: z.coerce.number().positive('Target price must be greater than 0 PKR'),
  active_status: z.boolean().default(true),
})

export type AlertFormData = z.infer<typeof alertSchema>
