import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { candidateSchema, CandidateFormData } from '../utils/schemas';
import { useCandidates, useCandidate } from '../hooks/useCandidates';

export default function CandidateFormPage() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [skillInput, setSkillInput] = useState('');
  const [submitError, setSubmitError] = useState('');

  const { createCandidate, isCreating, updateCandidate, isUpdating } = useCandidates();
  const { data: candidateData, isLoading } = useCandidate(id ?? '');

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CandidateFormData>({
    resolver: zodResolver(candidateSchema),
    defaultValues: { skills: [], experience: 0 },
  });

  const skills = watch('skills');

  useEffect(() => {
    if (isEdit && candidateData?.data) {
      const c = candidateData.data;
      reset({
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone ?? '',
        position: c.position,
        experience: c.experience,
        skills: c.skills,
        resumeUrl: c.resumeUrl ?? '',
        notes: c.notes ?? '',
      });
    }
  }, [candidateData, isEdit, reset]);

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setValue('skills', [...skills, trimmed]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setValue('skills', skills.filter((s) => s !== skill));
  };

  const onSubmit = async (data: CandidateFormData) => {
    setSubmitError('');
    try {
      if (isEdit) {
        await updateCandidate({ id: id!, data });
      } else {
        await createCandidate(data);
      }
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setSubmitError(msg || 'Une erreur est survenue');
    }
  };

  if (isLoading) return <div style={styles.loading}>Chargement...</div>;

  const isSubmitting = isCreating || isUpdating;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <button onClick={() => navigate('/')} style={styles.backBtn} aria-label="Retour à la liste">
            ← Retour
          </button>
          <h1 style={styles.title}>{isEdit ? 'Modifier le candidat' : 'Nouveau candidat'}</h1>
        </div>

        {submitError && (
          <div role="alert" style={styles.errorAlert}>
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div style={styles.grid}>
            <Field label="Prénom *" error={errors.firstName?.message}>
              <input id="firstName" {...register('firstName')} style={styles.input} aria-invalid={!!errors.firstName} />
            </Field>
            <Field label="Nom *" error={errors.lastName?.message}>
              <input id="lastName" {...register('lastName')} style={styles.input} aria-invalid={!!errors.lastName} />
            </Field>
          </div>

          <div style={styles.grid}>
            <Field label="Email *" error={errors.email?.message}>
              <input id="email" type="email" {...register('email')} style={styles.input} aria-invalid={!!errors.email} />
            </Field>
            <Field label="Téléphone" error={errors.phone?.message}>
              <input id="phone" type="tel" {...register('phone')} style={styles.input} />
            </Field>
          </div>

          <div style={styles.grid}>
            <Field label="Poste *" error={errors.position?.message}>
              <input id="position" {...register('position')} style={styles.input} aria-invalid={!!errors.position} />
            </Field>
            <Field label="Expérience (années) *" error={errors.experience?.message}>
              <Controller
                name="experience"
                control={control}
                render={({ field }) => (
                  <input
                    id="experience"
                    type="number"
                    min={0}
                    max={50}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    style={styles.input}
                    aria-invalid={!!errors.experience}
                  />
                )}
              />
            </Field>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={styles.label}>Compétences * {errors.skills && <span style={styles.errorText}>{errors.skills.message}</span>}</label>
            <div style={styles.skillInput}>
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                placeholder="Ajouter une compétence..."
                style={{ ...styles.input, marginBottom: 0, flex: 1 }}
                aria-label="Nouvelle compétence"
              />
              <button type="button" onClick={addSkill} style={styles.addBtn}>
                Ajouter
              </button>
            </div>
            <div style={styles.tags} aria-label="Compétences ajoutées">
              {skills.map((skill) => (
                <span key={skill} style={styles.tag}>
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)} aria-label={`Supprimer ${skill}`} style={styles.tagRemove}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <Field label="URL du CV" error={errors.resumeUrl?.message}>
            <input id="resumeUrl" type="url" {...register('resumeUrl')} style={styles.input} placeholder="https://..." />
          </Field>

          <Field label="Notes" error={errors.notes?.message}>
            <textarea id="notes" {...register('notes')} rows={3} style={{ ...styles.input, resize: 'vertical' }} />
          </Field>

          <div style={styles.actions}>
            <button type="button" onClick={() => navigate('/')} style={styles.cancelBtn}>
              Annuler
            </button>
            <button type="submit" disabled={isSubmitting} style={styles.submitBtn} aria-busy={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : isEdit ? 'Enregistrer' : 'Créer le candidat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500, color: '#374151', fontSize: '0.875rem' }}>
        {label}
      </label>
      {children}
      {error && <span role="alert" style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '2px', display: 'block' }}>{error}</span>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', background: '#f8fafc', padding: '2rem 1rem' },
  card: { background: '#fff', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: '2rem', maxWidth: '720px', margin: '0 auto' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' },
  backBtn: { background: 'transparent', border: 'none', cursor: 'pointer', color: '#3b82f6', fontSize: '0.9rem' },
  title: { margin: 0, fontSize: '1.5rem', color: '#1e293b' },
  errorAlert: { background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  label: { display: 'block', marginBottom: '4px', fontWeight: 500, color: '#374151', fontSize: '0.875rem' },
  input: { width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem', boxSizing: 'border-box' },
  skillInput: { display: 'flex', gap: '0.5rem' },
  addBtn: { padding: '0.6rem 1rem', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', whiteSpace: 'nowrap' },
  tags: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' },
  tag: { background: '#eff6ff', color: '#1d4ed8', padding: '0.25rem 0.625rem', borderRadius: '99px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' },
  tagRemove: { background: 'none', border: 'none', color: '#1d4ed8', cursor: 'pointer', padding: 0, fontSize: '1rem', lineHeight: 1 },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' },
  cancelBtn: { padding: '0.6rem 1.25rem', background: '#fff', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' },
  submitBtn: { padding: '0.6rem 1.5rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 },
  errorText: { color: '#dc2626', fontSize: '0.8rem', marginLeft: '0.5rem', fontWeight: 400 },
  loading: { textAlign: 'center', padding: '3rem', color: '#64748b' },
};
