import { useLang } from '../context/LangContext.jsx';

export default function LangToggle() {
  const { toggle, lang } = useLang();
  return (
    <button
      type="button"
      className="btn light small"
      onClick={toggle}
      aria-label={lang === 'ur' ? 'Switch to English' : 'اردو میں تبدیل کریں'}
    >
      EN / اردو
    </button>
  );
}
