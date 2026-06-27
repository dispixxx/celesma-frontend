import type { MemberResponseDto } from '../../types';

interface Props {
  value: number | null;
  onClick: () => void;
  onClear: () => void;
  icon: string;
  label: string;
  members: MemberResponseDto[];
}

export default function FilterUserBtn({ value, onClick, onClear, icon, label, members }: Props) {
  const member = members.find(m => m.user.id === value);
  return (
    <button className={`btn-mine ${value ? 'active' : ''}`} onClick={onClick}>
      {value && member ? (
        <>
          <div style={{ width: 16, height: 16, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
            {member.user.avatarUrl
              ? <img src={member.user.avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: 'var(--primary)', color: '#fff' }}>
                  {member.user.username.slice(0, 1).toUpperCase()}
                </span>
            }
          </div>
          <span>{member.user.username}</span>
          <span
            className="material-icons"
            style={{ fontSize: '14px' }}
            onClick={(e) => { e.stopPropagation(); onClear(); }}
          >close</span>
        </>
      ) : (
        <>
          <span className="material-icons" style={{ fontSize: '16px' }}>{icon}</span>
          {label}
        </>
      )}
    </button>
  );
}