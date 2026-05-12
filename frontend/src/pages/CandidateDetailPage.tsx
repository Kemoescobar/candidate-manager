import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCandidate, useCandidates } from '../hooks/useCandidates';
import { getStatusLabel, getStatusColor, formatDate, formatExperience } from '../utils/helpers';

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useCandidate(id!);
  const { validateCandidate, isValidating, deleteCandidate } = useCandidates();
  const [validateMsg, setValidateMsg] = useState('');

  if (isLoading) return <div style={styles.center} aria-busy="true">Chargement...</div>;
  if (isError || !data?.data) return (
    <div style={styles.center} role="alert">
      Candidat introuvable.{' '}
      <button onClick={() => navigate('/')} style={styles.link}>Retour</button>
    </div>
  );

  const c = data.data;

  const handleValidate = async () => {
    setValidateMsg('Validation en cours (2s)...');
    try {
      const res = await validateCandidate(id!);
      setValidateMsg(res.message || 'Terminé');
    } catch {
      setValidateMsg('Erreur lors de la validation');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Supprimer ce candidat ?')) return;
    await deleteCandidate(id!);
    navigate('/');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <button onClick={() => navigate('/')} style={styles.backBtn} aria-label="Retour à la liste">
            ← Retour
          </button>
          <div style={styles.headerActions}>
            <button onClick={() => navigate(`/candidates/${id}/edit`)} style={styles.editBtn}>
              Modifier
            </button>
            <button onClick={handleDelete} style={styles.deleteBtn}>
              Supprimer
            </button>
          </div>
        </div>

        <div style={styles.hero}>
          <div style={styles.avatar}>
            {c.firstName[0]}{c.lastName[0]}
          </div>
          <div>
            <h1 style={styles.name}>{c.firstName} {c.lastName}</h1>
            <p style={styles.position}>{c.position}</p>
            <span style={{ ...styles.badge, background: getStatusColor(c.status) + '22', color: getStatusColor(c.status) }}>
              {getStatusLabel(c.status)}
            </span>
          </div>
        </div>

        <div style={styles.grid}>
          <InfoBlock label="Email" value={c.email} />
          <InfoBlock label="Téléphone" value={c.phone ?? '-'} />
          <InfoBlock label="Expérience" value={formatExperience(c.experience)} />
          <InfoBlock label="Créé le" value={formatDate(c.createdAt)} />
          {c.validatedAt && <InfoBlock label="Validé le" value={formatDate(c.validatedAt)} />}
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Compétences</h2>
          <div style={styles.tags}>
            {c.skills.map((s) => (
              <span key={s} style={styles.tag}>{s}</span>
            ))}
          </div>
        </div>

        {c.notes && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Notes</h2>
            <p style={styles.notes}>{c.notes}</p>
          </div>
        )}

        {c.resumeUrl && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>CV</h2>
            <a href={c.resumeUrl} target="_blank" rel="noopener noreferrer" style={styles.link}>
              Voir le CV ↗
            </a>
          </div>
        )}

        {c.status === 'pending' && (
          <div style={styles.validateSection}>
            <button
              onClick={handleValidate}
              disabled={isValidating}
              style={styles.validateBtn}
              aria-busy={isValidating}
              aria-label="Valider ce candidat"
            >
              {isValidating ? '⏳ Validation en cours...' : '✓ Valider le candidat'}
            </button>
            {validateMsg && (
              <p role="status" aria-live="polite" style={styles.validateMsg}>
                {validateMsg}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
      <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: '#1e293b' }}>{value}</p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', background: '#f8fafc', padding: '2rem 1rem' },
  card: { background: '#fff', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: '2rem', maxWidth: '680px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  backBtn: { background: 'transparent', border: 'none', cursor: 'pointer', color: '#3b82f6', fontSize: '0.9rem' },
  headerActions: { display: 'flex', gap: '0.5rem' },
  editBtn: { padding: '0.375rem 0.75rem', background: '#fef3c7', color: '#b45309', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' },
  deleteBtn: { padding: '0.375rem 0.75rem', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' },
  hero: { display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' },
  avatar: { width: '64px', height: '64px', borderRadius: '50%', background: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, flexShrink: 0 },
  name: { margin: '0 0 4px', fontSize: '1.5rem', color: '#1e293b' },
  position: { margin: '0 0 8px', color: '#64748b', fontSize: '0.9rem' },
  badge: { padding: '0.25rem 0.625rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' },
  section: { marginBottom: '1.5rem' },
  sectionTitle: { margin: '0 0 0.75rem', fontSize: '1rem', color: '#374151', fontWeight: 600 },
  tags: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' },
  tag: { background: '#eff6ff', color: '#1d4ed8', padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.8rem' },
  notes: { color: '#374151', fontSize: '0.9rem', lineHeight: 1.6, background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', margin: 0 },
  link: { color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' },
  validateSection: { borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem', textAlign: 'center' },
  validateBtn: { background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.75rem 2rem', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' },
  validateMsg: { color: '#059669', marginTop: '0.75rem', fontSize: '0.9rem' },
  center: { textAlign: 'center', padding: '4rem', color: '#64748b' },
};
