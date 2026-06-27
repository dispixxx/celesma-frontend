import type { MemberResponseDto } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  selected: number | null;
  onSelect: (id: number | null) => void;
  title: string;
  members: MemberResponseDto[];
  memberSearch: string;
  setMemberSearch: (v: string) => void;
}

export default function MemberModal({
  open, onClose, selected, onSelect, title, members, memberSearch, setMemberSearch,
}: Props) {
  if (!open) return null;
  return (
    <div className="modal" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg)' }}>
            <span className="material-icons" style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>search</span>
            <input
              type="text"
              placeholder="Поиск..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', color: 'var(--text)', width: '100%', fontSize: '0.95rem' }}
              autoFocus
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '320px', overflowY: 'auto' }}>
            <div
              onClick={() => { onSelect(null); onClose(); }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.75rem', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.9rem' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span className="material-icons" style={{ fontSize: '18px' }}>close</span>
              Сбросить фильтр
            </div>
            {members
              .filter(m => m.user.username.toLowerCase().includes(memberSearch.toLowerCase()))
              .map((m) => (
                <div
                  key={m.user.id}
                  onClick={() => { onSelect(m.user.id); onClose(); setMemberSearch(''); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.625rem 0.75rem', borderRadius: '8px', cursor: 'pointer',
                    background: selected === m.user.id ? 'var(--primary-light)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { if (selected !== m.user.id) (e.currentTarget as HTMLDivElement).style.background = 'var(--bg)'; }}
                  onMouseLeave={(e) => { if (selected !== m.user.id) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                >
                  <div className="user-avatar-small" style={{ width: '36px', height: '36px', fontSize: '0.9rem' }}>
                    {m.user.avatarUrl
                      ? <img src={m.user.avatarUrl} alt={m.user.username} />
                      : <span>{m.user.username.slice(0, 2).toUpperCase()}</span>
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{m.user.username}</div>
                    {(m.user.firstName || m.user.lastName) && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {m.user.firstName} {m.user.lastName}
                      </div>
                    )}
                  </div>
                  <span className={`project-role role-${m.role}`}>{m.role}</span>
                  {selected === m.user.id && (
                    <span className="material-icons" style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>check_circle</span>
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}