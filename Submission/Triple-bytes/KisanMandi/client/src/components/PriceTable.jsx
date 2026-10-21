import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cropImage, localizedName, money, priceChange } from '../utils/format.js';

export default function PriceTable({ rows, marketId }) {
  const { t, i18n } = useTranslation();
  return <div className="table-scroll"><table className="price-table"><thead><tr><th>{t('prices.crop')}</th><th>{t('prices.price')}</th><th>{t('prices.change')}</th><th>{t('prices.action')}</th></tr></thead><tbody>
    {rows.map((row) => {
      const change = priceChange(row.today_price, row.yesterday_price);
      return <tr key={row.crop_id}>
        <td><div className="crop-cell"><img className="crop-thumb" src={cropImage(row.crop_name)} alt="" /><div>{localizedName(row, i18n.language)}<small>{t(`categories.${row.category}`, row.category)}</small></div></div></td>
        <td className="price">{money(row.today_price)}</td>
        <td className={`change ${change.change >= 0 ? 'up' : 'down'}`}>{change.change >= 0 ? '↗' : '↘'} {Math.abs(change.percent).toFixed(1)}%<small>{change.change >= 0 ? '+' : '−'}{money(Math.abs(change.change))}</small></td>
        <td><Link className="row-action" to={`/prices/${row.crop_id}`} state={{ crop: row, marketId }}>{t('common.details')} ↗</Link></td>
      </tr>;
    })}
  </tbody></table></div>;
}
