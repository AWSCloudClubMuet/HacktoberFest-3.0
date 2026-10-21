import React from 'react'
import { useTranslation } from '../i18n'
import { AjrakDivider } from './AjrakPattern'
import { CropIconsRow } from './illustrations/CropIconsRow'

export const Footer: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { t } = useTranslation()

  return (
    <footer className={`mt-auto pt-6 pb-20 md:pb-8 text-center select-none text-gray-500 dark:text-gray-400 text-xs ${className}`}>
      <div className="max-w-5xl mx-auto px-4">
        {/* Ajrak section divider */}
        <AjrakDivider className="mb-4 opacity-80" />

        {/* Culture icons row: wheat, mango, cotton, river wave */}
        <CropIconsRow size={18} className="mb-2.5" />

        {/* Culture tagline */}
        <p className="font-semibold text-gray-700 dark:text-gray-300">
          {t('footer.tagline')}
        </p>

        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
          {t('footer.subtagline')}
        </p>
      </div>
    </footer>
  )
}
