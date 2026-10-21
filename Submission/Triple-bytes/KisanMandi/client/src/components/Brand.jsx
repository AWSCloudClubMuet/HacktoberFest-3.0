import { Link } from 'react-router-dom';

export default function Brand({ footer = false }) {
  return <Link className={`brand ${footer ? 'footer-brand' : ''}`} to="/prices" aria-label="KisanMandi"><span className="brand-mark">✳</span><span>Kisan<em>Mandi</em></span></Link>;
}
