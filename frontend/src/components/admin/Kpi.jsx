export default function Kpi({ icon: Icon, label, value, sub, tone = 'brand' }) {
  return (
    <div className={`kpi kpi--${tone}`}>
      <span className="kpi__icon">
        <Icon size={20} />
      </span>
      <div>
        <span className="kpi__label">{label}</span>
        <strong className="kpi__value">{value}</strong>
        {sub && <span className="kpi__sub">{sub}</span>}
      </div>
    </div>
  );
}
