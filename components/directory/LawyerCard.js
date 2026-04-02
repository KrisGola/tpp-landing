import s from './LawyerCard.module.css';

const AVAIL_COLORS = {
  today:    { color: '#2E9465', dot: '#2E9465' },
  tomorrow: { color: '#6B7280', dot: '#9CA3AF' },
  week:     { color: '#6B7280', dot: '#9CA3AF' },
};

export default function LawyerCard({ lawyer }) {
  const avail = AVAIL_COLORS[lawyer.availabilityType] ?? AVAIL_COLORS.week;
  const initials = lawyer.displayName
    .split(' ')
    .filter(w => /[A-ZŻŹĆĄŚĘŁÓŃ]/i.test(w[0]) && w.length > 1)
    .slice(-2)
    .map(w => w[0].toUpperCase())
    .join('');

  return (
    <a href={`/p/${lawyer.slug}`} className={s.card}>
      {/* Top row */}
      <div className={s.top}>
        <div className={s.avatar}>{initials}</div>
        <div className={s.info}>
          <div className={s.name}>{lawyer.displayName}</div>
          <div className={s.meta}>{lawyer.title} · {lawyer.city}</div>
        </div>
        <div className={s.ratingWrap}>
          <span className={s.star}>★</span>
          <span className={s.rating}>{lawyer.rating?.toFixed(1)}</span>
          <span className={s.reviews}>({lawyer.reviewCount})</span>
        </div>
      </div>

      {/* Specialization tags */}
      <div className={s.specs}>
        {lawyer.specializations.slice(0, 3).map(spec => (
          <span key={spec} className={s.specTag}>{spec}</span>
        ))}
        {lawyer.specializations.length > 3 && (
          <span className={s.specMore}>+{lawyer.specializations.length - 3}</span>
        )}
      </div>

      {/* Bio */}
      {lawyer.bio && (
        <p className={s.bio}>{lawyer.bio}</p>
      )}

      {/* Footer */}
      <div className={s.footer}>
        <div className={s.availRow} style={{ color: avail.color }}>
          <span className={s.availDot} style={{ background: avail.dot }} />
          {lawyer.availability}
        </div>

        <div className={s.footerRight}>
          {lawyer.priceConsult ? (
            <span className={s.price}>od <strong>bezpłatna</strong></span>
          ) : (
            <span className={s.price}>{lawyer.priceHour}</span>
          )}
          <span className={s.arrow}>›</span>
        </div>
      </div>
    </a>
  );
}
