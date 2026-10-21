import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { userSchema, type UserFormData, SINDH_DISTRICTS, normalizePhone } from '../lib/validators'
import { useUsers, useCreateUser } from '../api/hooks'
import { useCurrentUser } from '../context/UserContext'
import { useTranslation, LanguageSwitcher } from '../i18n'
import { Spinner, ErrorBanner, Badge, AjrakStrip, AjrakCorner } from '../components'
import { IndusLandscape } from '../components/illustrations/IndusLandscape'
import { Sprout, ShoppingBag, UserCheck, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react'

export const Onboarding: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useCurrentUser()
  const { t, isRTL } = useTranslation()
  const { data: existingUsers, isLoading: isLoadingUsers, error: usersError } = useUsers()
  const createUser = useCreateUser()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showDemoUsers, setShowDemoUsers] = useState<boolean>(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      phone: '',
      district: '',
      role: 'Farmer',
    },
  })

  const selectedRole = watch('role')

  const onSubmit = async (data: UserFormData) => {
    setSubmitError(null)
    const normalized = normalizePhone(data.phone)
    if (!normalized) {
      setSubmitError('Invalid Pakistani mobile number format.')
      return
    }

    try {
      const created = await createUser.mutateAsync({
        name: data.name.trim(),
        phone: normalized,
        district: data.district,
        role: data.role,
      })
      await login(created.id)
      navigate('/prices', { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create profile. Please check API.'
      setSubmitError(msg)
    }
  }

  const handleSelectDemoUser = async (id: number) => {
    try {
      await login(id)
      navigate('/prices', { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to switch user.'
      setSubmitError(msg)
    }
  }

  return (
    <div className="min-h-screen bg-transparent py-6 sm:py-10 px-4 transition-colors">
      <div className="max-w-5xl mx-auto">
        {/* Top bar with Language Switcher */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <span className="text-2xl">🌾</span>
            <span className="font-black text-xl tracking-tight text-forest dark:text-white">
              {t('app.name')}
            </span>
          </div>
          <LanguageSwitcher variant="pills" />
        </div>

        {/* Full-width Hero with Large Faint Outlined Circle (Requirement 2.3 #2) */}
        <div className="hero-grid relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-forest-800 via-forest-900 to-[#061b10] text-white p-7 sm:p-11 mb-8 shadow-[0_24px_60px_rgba(14,42,27,0.22)] border border-forest-700/70">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-forest-700/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-lg text-center md:text-left rtl:md:text-right">
              {/* Cultural Greeting Badge */}
              <div className="inline-flex items-center space-x-2 rtl:space-x-reverse px-3 py-1 rounded-full bg-forest-800/80 border border-forest-700 text-[#DFFF38] text-xs font-bold mb-3 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('app.culturalGreeting')}</span>
              </div>

              {/* Hero Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-[-0.045em] text-white mb-4 leading-[0.98] font-sans">
                {t('onboarding.title')}
              </h1>

              <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-md">
                {t('onboarding.subtitle')}
              </p>
            </div>

            {/* Indus River Landscape Illustration in Large Outlined Circle */}
            <div className="flex-shrink-0 relative flex items-center justify-center">
              <IndusLandscape size={260} className="animate-float-soft w-56 h-56 sm:w-64 sm:h-64" />
            </div>
          </div>
        </div>

        {/* Main Onboarding Card with Ajrak Corner and Ajrak Strip Header */}
        <div className="premium-panel max-w-xl mx-auto relative rounded-[2rem] dark:bg-forest-950 overflow-hidden">
          {/* Ajrak Strip Header (Requirement 2.3 #2) */}
          <AjrakStrip height={10} variant="md" />

          {/* Ajrak Corner Ornament on top right / top left based on direction */}
          <AjrakCorner position={isRTL ? 'top-left' : 'top-right'} size={44} />

          <div className="p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-black text-gray-900 dark:text-white">
                {t('onboarding.registerTitle')}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {selectedRole === 'Farmer' ? t('onboarding.farmerDesc') : t('onboarding.buyerDesc')}
              </p>
            </div>

            {submitError && (
              <ErrorBanner
                message={submitError}
                onRetry={() => setSubmitError(null)}
                className="mb-5"
              />
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {/* Role Segmented Control */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                  {t('onboarding.roleLabel')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setValue('role', 'Farmer', { shouldValidate: true })}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all duration-150 ${
                      selectedRole === 'Farmer'
                        ? 'border-forest bg-forest-50 dark:bg-forest-900/80 text-forest dark:text-mint shadow-xs'
                        : 'border-gray-200 dark:border-forest-800 bg-gray-50/50 dark:bg-forest-900/30 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    <Sprout className="w-6 h-6 mb-1 text-forest dark:text-mint" />
                    <span className="text-sm font-black">{t('onboarding.farmerRole')}</span>
                    <span className="text-[10px] opacity-75 mt-0.5 text-center">
                      {isRTL ? 'فصل فروخت اور ریٹ' : 'Sell & track prices'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setValue('role', 'Buyer', { shouldValidate: true })}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all duration-150 ${
                      selectedRole === 'Buyer'
                        ? 'border-forest bg-forest-50 dark:bg-forest-900/80 text-forest dark:text-mint shadow-xs'
                        : 'border-gray-200 dark:border-forest-800 bg-gray-50/50 dark:bg-forest-900/30 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    <ShoppingBag className="w-6 h-6 mb-1 text-forest dark:text-mint" />
                    <span className="text-sm font-black">{t('onboarding.buyerRole')}</span>
                    <span className="text-[10px] opacity-75 mt-0.5 text-center">
                      {isRTL ? 'فصلوں کی خریداری' : 'Source produce'}
                    </span>
                  </button>
                </div>
                {errors.role && <p className="text-xs text-red-600 mt-1.5">{errors.role.message}</p>}
              </div>

              {/* Full Name */}
              <div>
                <label htmlFor="name" className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {t('onboarding.nameLabel')}
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder={t('onboarding.namePlaceholder')}
                  {...register('name')}
                  className={`w-full px-4 py-3 text-sm rounded-xl border bg-gray-50 dark:bg-forest-900/40 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-forest-900 focus:outline-none focus:ring-2 focus:ring-forest/20 transition ${
                    errors.name ? 'border-red-500' : 'border-gray-200 dark:border-forest-700 focus:border-forest'
                  }`}
                />
                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
              </div>

              {/* Mobile Phone */}
              <div>
                <label htmlFor="phone" className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {t('onboarding.phoneLabel')}
                </label>
                <input
                  id="phone"
                  type="tel"
                  dir="ltr"
                  placeholder={t('onboarding.phonePlaceholder')}
                  {...register('phone')}
                  className={`w-full px-4 py-3 text-sm rounded-xl border bg-gray-50 dark:bg-forest-900/40 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-forest-900 focus:outline-none focus:ring-2 focus:ring-forest/20 transition ${
                    errors.phone ? 'border-red-500' : 'border-gray-200 dark:border-forest-700 focus:border-forest'
                  }`}
                />
                {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone.message}</p>}
              </div>

              {/* District Dropdown */}
              <div>
                <label htmlFor="district" className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {t('onboarding.districtLabel')}
                </label>
                <select
                  id="district"
                  {...register('district')}
                  className={`w-full px-4 py-3 text-sm rounded-xl border bg-gray-50 dark:bg-forest-900/40 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-forest-900 focus:outline-none focus:ring-2 focus:ring-forest/20 transition ${
                    errors.district ? 'border-red-500' : 'border-gray-200 dark:border-forest-700 focus:border-forest'
                  }`}
                >
                  <option value="">{t('onboarding.districtLabel')}...</option>
                  {SINDH_DISTRICTS.map((dist) => (
                    <option key={dist} value={dist}>
                      {dist}
                    </option>
                  ))}
                </select>
                {errors.district && (
                  <p className="text-xs text-red-600 mt-1">{errors.district.message}</p>
                )}
              </div>

              {/* Submit Button (Neon yellow CTA as in reference image) */}
              <button
                type="submit"
                disabled={isSubmitting || createUser.isPending}
                className="w-full mt-3 py-3.5 px-4 bg-neon text-neon-dark font-black rounded-xl text-sm shadow-md hover:brightness-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 rtl:space-x-reverse transition"
              >
                {isSubmitting || createUser.isPending ? (
                  <>
                    <Spinner size="sm" className="!p-0 border-t-neon-dark" />
                    <span>{t('common.loading')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('onboarding.submitBtn')}</span>
                    <ArrowRight className="w-4 h-4 rtl-flip" />
                  </>
                )}
              </button>
            </form>

            {/* Demo User Fast Switching */}
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-forest-800 text-center">
              <button
                type="button"
                onClick={() => setShowDemoUsers(!showDemoUsers)}
                className="text-xs font-bold text-forest dark:text-mint hover:underline inline-flex items-center gap-1.5"
              >
                <UserCheck className="w-4 h-4" />
                <span>{t('onboarding.orChooseDemo')}</span>
              </button>

              {showDemoUsers && (
                <div className="mt-4 text-left rtl:text-right space-y-2 max-h-56 overflow-y-auto pr-1">
                  {isLoadingUsers ? (
                    <Spinner size="sm" label={t('common.loading')} />
                  ) : usersError ? (
                    <p className="text-xs text-red-500 text-center">{t('common.retry')}</p>
                  ) : (
                    existingUsers?.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleSelectDemoUser(u.id)}
                        className="w-full p-2.5 rounded-xl border border-gray-100 dark:border-forest-800 bg-gray-50/60 dark:bg-forest-900/40 hover:bg-forest-50/60 dark:hover:bg-forest-800/60 transition flex items-center justify-between text-left rtl:text-right group"
                      >
                        <div>
                          <div className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-forest dark:group-hover:text-mint">
                            {u.name}
                          </div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400">
                            {u.district} • <span dir="ltr">{u.phone}</span>
                          </div>
                        </div>
                        <Badge variant={u.role === 'Farmer' ? 'primary' : 'accent'}>
                          {u.role === 'Farmer' ? t('nav.farmerBadge') : t('nav.buyerBadge')}
                        </Badge>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-gray-400 dark:text-gray-500 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Fictional demonstration data for Sindh agriculture</span>
        </div>
      </div>
    </div>
  )
}

export default Onboarding
