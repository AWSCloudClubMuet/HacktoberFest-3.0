import { useTranslation } from 'react-i18next';
import { CATEGORIES, TYPES, PAYMENT_TYPES } from '../utils/constants.js';

const toggle = (list, v) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

export default function Filters({ value, onChange, onReset }) {
  const { t } = useTranslation();

  return (
    <aside className="filters reveal">
      <div className="filtertop">
        {t('filters.title')}
        <button type="button" className="reset" onClick={onReset}>
          {t('filters.reset')}
        </button>
      </div>

      <div className="filtergroup">
        <label className="title">{t('filters.category')}</label>
        {CATEGORIES.map((c) => (
          <label className="check" key={c}>
            <input
              type="checkbox"
              checked={value.cats.includes(c)}
              onChange={() => onChange({ ...value, cats: toggle(value.cats, c) })}
            />
            {t(`category.${c}`)}
          </label>
        ))}
      </div>

      <div className="filtergroup">
        <label className="title">{t('filters.lookingFor')}</label>
        {TYPES.map((x) => (
          <label className="check" key={x}>
            <input
              type="checkbox"
              checked={value.types.includes(x)}
              onChange={() => onChange({ ...value, types: toggle(value.types, x) })}
            />
            {x === 'Offering' ? t('filters.offers') : t('filters.help')}
          </label>
        ))}
      </div>

      <div className="filtergroup">
        <label className="title">{t('filters.payment')}</label>
        {PAYMENT_TYPES.map((p) => (
          <label className="check" key={p}>
            <input
              type="checkbox"
              checked={value.pays.includes(p)}
              onChange={() => onChange({ ...value, pays: toggle(value.pays, p) })}
            />
            {t(`payment.${p}`)}
          </label>
        ))}
      </div>

      <div className="filtergroup">
        <label className="title">{t('filters.budget')}</label>
        <div className="range">
          <input
            type="number"
            min="0"
            placeholder={t('filters.min')}
            value={value.min}
            onChange={(e) => onChange({ ...value, min: e.target.value })}
          />
          <input
            type="number"
            min="0"
            placeholder={t('filters.max')}
            value={value.max}
            onChange={(e) => onChange({ ...value, max: e.target.value })}
          />
        </div>
      </div>
    </aside>
  );
}
