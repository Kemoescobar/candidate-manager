import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCandidates, usePagination } from '../hooks/useCandidates';
import { useAuth } from '../hooks/useAuth';
import { getStatusLabel, getStatusColor, formatDate } from '../utils/helpers';
import { Candidate } from '../types';

export default function CandidatesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { page, limit, nextPage, prevPage, goToPage } = usePagination();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const { candidates, pagination, isLoading, isError, deleteCandidate, isDeleting } =
    useCandidates({ page, limit, search: search || undefined, status: statusFilter || undefined });

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Supprimer ${name} ?`)) return;
    await deleteCandidate(id);
  };

  return (
    <div style={styles.layout}>
      <header style={styles.header}>
        <h1 style={styles.logo}>Candidats</h1>
        <div style={styles.headerRight}>
          <span style={styles.userInfo}>👤 {user?.name}</span>
          <button onClick={logout} style={styles.logoutBtn}>
            Déconnexion
          </button>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.toolbar}>
          <div style={styles.filters}>
            <input
              type="search"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); goToPage(1); }}
              style={styles.searchInput}
              aria-label="Rechercher un candidat"
            />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); goToPage(1); }}
              style={styles.select}
              aria-label="Filtrer par statut"
            >
              <option value="">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="validated">Validés</option>
              <option value="rejected">Rejetés</option>
            </select>
          </div>
          <Link to="/candidates/new" style={styles.newBtn}>
            + Nouveau candidat
          </Link>
        </div>

        {isLoading && (
          <div style={styles.center} role="status" aria-live="polite">
            Chargement...
          </div>
        )}

        {isError && (
          <div role="alert" style={styles.errorAlert}>
            Erreur lors du chargement des candidats.
          </div>
        )}

        {!isLoading && !isError && (
          <>
            <div style={styles.tableWrapper}>
              <table style={styles.table} role="grid" aria-label="Liste des candidats">
                <thead>
                  <tr>
                    <th style={styles.th}>Nom</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Poste</th>
                    <th style={styles.th}>Statut</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                        Aucun candidat trouvé
                      </td>
                    </tr>
                  ) : (
                    candidates.map((c: Candidate) => (
                      <tr key={c.id} style={styles.tr}>
                        <td style={styles.td}>
                          <strong>{c.firstName} {c.lastName}</strong>
                        </td>
                        <td style={styles.td}>{c.email}</td>
                        <td style={styles.td}>{c.position}</td>
                        <td style={styles.td}>
                          <span style={{ ...styles.badge, background: getStatusColor(c.status) + '22', color: getStatusColor(c.status) }}>
                            {getStatusLabel(c.status)}
                          </span>
                        </td>
                        <td style={styles.td}>{formatDate(c.createdAt)}</td>
                        <td style={styles.td}>
                          <button
                            onClick={() => navigate(`/candidates/${c.id}`)}
                            style={styles.actionBtn}
                            aria-label={`Voir ${c.firstName} ${c.lastName}`}
                          >
                            Détail
                          </button>
                          <button
                            onClick={() => navigate(`/candidates/${c.id}/edit`)}
                            style={{ ...styles.actionBtn, background: '#f59e0b22', color: '#b45309' }}
                            aria-label={`Modifier ${c.firstName} ${c.lastName}`}
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDelete(c.id, `${c.firstName} ${c.lastName}`)}
                            disabled={isDeleting}
                            style={{ ...styles.actionBtn, background: '#fee2e2', color: '#dc2626' }}
                            aria-label={`Supprimer ${c.firstName} ${c.lastName}`}
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {pagination && pagination.totalPages > 1 && (
              <nav style={styles.pagination} aria-label="Pagination">
                <button onClick={prevPage} disabled={page <= 1} style={styles.pageBtn} aria-label="Page précédente">
                  ← Précédent
                </button>
                <span style={styles.pageInfo}>
                  Page {page} / {pagination.totalPages} ({pagination.total} candidats)
                </span>
                <button
                  onClick={nextPage}
                  disabled={page >= pagination.totalPages}
                  style={styles.pageBtn}
                  aria-label="Page suivante"
                >
                  Suivant →
                </button>
              </nav>
            )}
          </>
        )}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  layout: { minHeight: '100vh', background: '#f8fafc' },
  header: { background: '#1e293b', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logo: { color: '#fff', margin: 0, fontSize: '1.5rem' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
  userInfo: { color: '#94a3b8', fontSize: '0.875rem' },
  logoutBtn: { background: 'transparent', border: '1px solid #475569', color: '#94a3b8', padding: '0.375rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem' },
  main: { padding: '2rem', maxWidth: '1200px', margin: '0 auto' },
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' },
  filters: { display: 'flex', gap: '0.75rem', flex: 1 },
  searchInput: { padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem', minWidth: '200px' },
  select: { padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem' },
  newBtn: { background: '#3b82f6', color: '#fff', padding: '0.5rem 1rem', borderRadius: '8px', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, whiteSpace: 'nowrap' },
  tableWrapper: { background: '#fff', borderRadius: '12px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '0.875rem 1rem', textAlign: 'left', background: '#f8fafc', color: '#64748b', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '0.875rem 1rem', fontSize: '0.875rem', color: '#334155', verticalAlign: 'middle' },
  badge: { padding: '0.25rem 0.625rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600 },
  actionBtn: { padding: '0.3rem 0.6rem', borderRadius: '6px', border: 'none', background: '#eff6ff', color: '#2563eb', cursor: 'pointer', fontSize: '0.8rem', marginRight: '4px' },
  center: { textAlign: 'center', padding: '3rem', color: '#64748b' },
  errorAlert: { background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' },
  pageBtn: { padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: '0.875rem' },
  pageInfo: { color: '#64748b', fontSize: '0.875rem' },
};
