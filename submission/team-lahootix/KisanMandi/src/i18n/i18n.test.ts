import { describe, it, expect } from 'vitest'
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from './config'
import enTranslations from './locales/en.json'
import urTranslations from './locales/ur.json'

describe('i18n Configuration & Verification', () => {
  it('supports ONLY English (en) and Urdu (ur)', () => {
    const keys = Object.keys(SUPPORTED_LANGUAGES)
    expect(keys).toHaveLength(2)
    expect(keys).toContain('en')
    expect(keys).toContain('ur')
    // Confirm Sindhi (sd) is completely removed
    expect(keys).not.toContain('sd')
    expect((SUPPORTED_LANGUAGES as Record<string, unknown>)['sd']).toBeUndefined()
  })

  it('configures native names and text directions properly', () => {
    expect(SUPPORTED_LANGUAGES.en.nativeName).toBe('English')
    expect(SUPPORTED_LANGUAGES.en.dir).toBe('ltr')

    expect(SUPPORTED_LANGUAGES.ur.nativeName).toBe('اردو')
    expect(SUPPORTED_LANGUAGES.ur.dir).toBe('rtl')
  })

  it('has DEFAULT_LANGUAGE set to English', () => {
    expect(DEFAULT_LANGUAGE).toBe('en')
  })

  it('has all top-level sections in both English and Urdu', () => {
    const enSections = Object.keys(enTranslations)
    const urSections = Object.keys(urTranslations)

    enSections.forEach((section) => {
      expect(urSections).toContain(section)
    })
  })

  it('guarantees every nested key in en.json is translated in ur.json with no raw keys', () => {
    const checkKeys = (enObj: any, urObj: any, path = '') => {
      for (const [key, val] of Object.entries(enObj)) {
        const fullPath = path ? `${path}.${key}` : key
        expect(urObj, `Missing key in Urdu translations: ${fullPath}`).toBeDefined()
        expect(urObj[key], `Missing translation for key: ${fullPath}`).toBeDefined()

        if (typeof val === 'object' && val !== null) {
          expect(typeof urObj[key]).toBe('object')
          checkKeys(val, urObj[key], fullPath)
        } else {
          expect(typeof urObj[key]).toBe('string')
          // Ensure it's not an empty string
          expect((urObj[key] as string).trim().length).toBeGreaterThan(0)
          // Ensure it is not left identical to a distinctive English sentence
          if (typeof val === 'string' && val.length > 15 && !val.includes('{') && !val.includes('•')) {
            // Urdu translations should contain Arabic/Urdu unicode characters
            const hasArabicOrUrdu = /[\u0600-\u06FF]/.test(urObj[key] as string)
            expect(hasArabicOrUrdu, `String appears untranslated in Urdu: "${urObj[key]}"`).toBe(true)
          }
        }
      }
    }

    checkKeys(enTranslations, urTranslations)
  })

  it('includes required Sindhi culture microcopy in en and ur', () => {
    expect(enTranslations.app.culturalGreeting).toBe("Welcome, Sindh's farmers")
    expect(urTranslations.app.culturalGreeting).toBe('خوش آمدید، سندھ کے کسانوں')

    expect(enTranslations.app.heroTagline).toBe('Know your price. Sell with confidence.')
    expect(urTranslations.app.heroTagline).toBe('اپنی قیمت جانیں۔ اعتماد کے ساتھ بیچیں۔')

    expect(enTranslations.app.heroSubtagline).toContain('Hyderabad to Sukkur')
    expect(urTranslations.app.heroSubtagline).toContain('حیدرآباد سے سکھر تک')

    expect(enTranslations.footer.tagline).toBe("Made with ❤ for the farmers of Sindh")
    expect(urTranslations.footer.tagline).toBe("سندھ کے کسانوں کے لیے محبت سے بنایا گیا")
  })
})
