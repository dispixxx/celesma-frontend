import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { tasksApi } from '../api/tasks';
import { projectsApi } from '../api/projects';
import type { TaskResponse, TaskStatus, MemberResponseDto } from '../types';
import ProjectLayout from '../components/layout/ProjectLayout';
import { useProjectRole } from '../hooks/useProjectRole';
import UserAvatar from '../components/ui/UserAvatar';
import StatusDot from '../components/ui/StatusDot';

const STATUSES: TaskStatus[] = ['NEW', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'ON_HOLD', 'CANCELED'];
const STATUS_LABELS: Record<TaskStatus, string> = {
    NEW: 'To Do', IN_PROGRESS: 'В работе', REVIEW: 'Проверка',
    COMPLETED: 'Готово', ON_HOLD: 'Пауза', CANCELED: 'Отмена',
};
const STATUS_COLORS: Record<TaskStatus, string> = {
    NEW: 'var(--status-new)', IN_PROGRESS: 'var(--status-in-progress)',
    REVIEW: 'var(--status-review)', COMPLETED: 'var(--status-completed)',
    ON_HOLD: 'var(--status-on-hold)', CANCELED: 'var(--status-canceled)',
};
const PRIORITY_COLORS = {
    HIGH: 'var(--status-canceled)',
    MEDIUM: 'var(--status-on-hold)',
    LOW: 'var(--status-completed)',
};
const MEMBER_COLORS = [
    '#6366f1', '#22c55e', '#f97316', '#a855f7',
    '#06b6d4', '#f43f5e', '#eab308', '#14b8a6',
];

function getLast30Days(): string[] {
    const days: string[] = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().slice(0, 10));
    }
    return days;
}

// ── Утилита для SVG пирога ──
function PieChart({ segments }: {
    segments: { value: number; color: string; label: string }[]
}) {
    const total = segments.reduce((s, x) => s + x.value, 0);
    if (total === 0) return (
        <text x="50" y="54" textAnchor="middle" fontSize="10" fill="var(--text-secondary)">Нет данных</text>
    );

    let angle = -Math.PI / 2;
    const R = 40, cx = 50, cy = 50;

    const slices = segments.map(seg => {
        const pct = seg.value / total;
        const startAngle = angle;
        angle += pct * 2 * Math.PI;
        const endAngle = angle;
        const x1 = cx + R * Math.cos(startAngle);
        const y1 = cy + R * Math.sin(startAngle);
        const x2 = cx + R * Math.cos(endAngle);
        const y2 = cy + R * Math.sin(endAngle);
        const largeArc = pct > 0.5 ? 1 : 0;
        return { ...seg, pct, path: `M${cx},${cy} L${x1},${y1} A${R},${R} 0 ${largeArc},1 ${x2},${y2} Z` };
    });

    return (
        <>
            {slices.map((s, i) => (
                <path key={i} d={s.path} fill={s.color} opacity={0.9}>
                    <title>{s.label}: {s.value} ({Math.round(s.pct * 100)}%)</title>
                </path>
            ))}
        </>
    );
}

export default function ProjectStatsPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const userRole = useProjectRole(projectId);
    const [tasks, setTasks] = useState<TaskResponse[]>([]);
    const [members, setMembers] = useState<MemberResponseDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMembers, setSelectedMembers] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (!projectId) return;
        Promise.all([
            tasksApi.getByProject(Number(projectId)),
            projectsApi.getMembers(Number(projectId)),
        ]).then(([t, m]) => {
            setTasks(t);
            setMembers(m);
            setSelectedMembers(new Set(m.map((x: { user: { id: any; }; }) => x.user.id)));
        }).finally(() => setLoading(false));
    }, [projectId]);

    if (loading) return (
        <ProjectLayout userRole={userRole}>
            <div className="empty-state"><p>Загрузка...</p></div>
        </ProjectLayout>
    );

    // ── KPI ──
    const totalByStatus = STATUSES.reduce((acc, s) => {
        acc[s] = tasks.filter(t => t.status === s).length;
        return acc;
    }, {} as Record<TaskStatus, number>);

    const overdueCount = tasks.filter(t =>
        t.endDate && new Date(t.endDate) < new Date() && t.status !== 'COMPLETED'
    ).length;

    const completionRate = tasks.length > 0
        ? Math.round((totalByStatus.COMPLETED / tasks.length) * 100)
        : 0;

    // ── Таблица участник × статус ──
    const memberTaskMap = new Map<number, Record<TaskStatus, number>>();
    members.forEach(m => {
        memberTaskMap.set(m.user.id, {
            NEW: 0, IN_PROGRESS: 0, REVIEW: 0, COMPLETED: 0, ON_HOLD: 0, CANCELED: 0,
        });
    });
    tasks.forEach(t => {
        if (t.assignee && memberTaskMap.has(t.assignee.id)) {
            memberTaskMap.get(t.assignee.id)![t.status]++;
        }
    });

    // ── Нагрузка ──
    const memberLoad = members.map(m => ({
        member: m,
        active: tasks.filter(t => t.assignee?.id === m.user.id && t.status === 'IN_PROGRESS').length,
        total: tasks.filter(t => t.assignee?.id === m.user.id).length,
    })).sort((a, b) => b.active - a.active);

    const maxLoad = Math.max(...memberLoad.map(m => m.total), 1);

    // ── График ──
    const days = getLast30Days();
    const W = 700, H = 130;
    const PAD = { top: 10, right: 16, bottom: 24, left: 28 };
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;

    const memberActivityData = members.map((m, idx) => {
        const pointsMap = new Map<string, number>();
        days.forEach(d => pointsMap.set(d, 0));
        tasks
            .filter(t => t.assignee?.id === m.user.id || t.creator.id === m.user.id)
            .forEach(t => {
                const day = t.createdAt?.slice(0, 10);
                if (day && pointsMap.has(day)) pointsMap.set(day, (pointsMap.get(day) ?? 0) + 1);
            });
        return {
            member: m,
            color: MEMBER_COLORS[idx % MEMBER_COLORS.length],
            data: days.map(d => ({ date: d, count: pointsMap.get(d) ?? 0 })),
        };
    });

    const maxActivity = Math.max(
        ...memberActivityData.flatMap(m => m.data.map(d => d.count)), 1
    );

    const toSvgPoints = (data: { date: string; count: number }[]) =>
        data.map((d, i) => ({
            x: PAD.left + (i / (data.length - 1)) * innerW,
            y: PAD.top + innerH - (d.count / maxActivity) * innerH,
            ...d,
        }));

    const dateLabels = days
        .map((d, i) => ({ date: d, i }))
        .filter(({ i }) => i % 7 === 0 || i === days.length - 1);

    const toggleMember = (id: number) => {
        setSelectedMembers(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const allSelected = selectedMembers.size === members.length;

    return (
        <ProjectLayout userRole={userRole}>
            <div className="stats-page">
                <h2 className="stats-title">Статистика проекта</h2>

                {/* ── KPI ── */}
                <div className="stats-kpi-row">
                    {[
                        { label: 'Всего задач', value: tasks.length, color: undefined },
                        { label: 'Выполнено', value: `${completionRate}%`, color: 'var(--status-completed)' },
                        { label: 'В работе', value: totalByStatus.IN_PROGRESS, color: 'var(--status-in-progress)' },
                        { label: 'На проверке', value: totalByStatus.REVIEW, color: 'var(--status-review)' },
                        { label: 'Просрочено', value: overdueCount, color: overdueCount > 0 ? 'var(--status-canceled)' : undefined },
                        { label: 'Участников', value: members.length, color: undefined },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="stats-kpi-card">
                            <span className="stats-kpi-value" style={color ? { color } : undefined}>{value}</span>
                            <span className="stats-kpi-label">{label}</span>
                        </div>
                    ))}
                </div>

                {/* ── График активности ── */}
                <div className="stats-card">
                    <h3>
                        Активность за 30 дней
                        <span className="stats-subtitle"> (задачи по дате создания)</span>
                    </h3>
                    <div className="stats-chart-layout">

                        {/* Легенда */}
                        <div className="stats-chart-legend">
                            {memberActivityData.map(({ member, color }) => {
                                const active = selectedMembers.has(member.user.id);
                                return (
                                    <button
                                        key={member.user.id}
                                        className={`stats-legend-btn ${active ? 'active' : ''}`}
                                        onClick={() => toggleMember(member.user.id)}
                                    >
                                        <span className="stats-legend-dot" style={{ background: active ? color : 'var(--border)' }} />
                                        <UserAvatar username={member.user.username} avatarUrl={member.user.avatarUrl} />
                                        <span>{member.user.username}</span>
                                    </button>
                                );
                            })}
                            <button
                                className="stats-legend-all-btn"
                                onClick={() => setSelectedMembers(
                                    allSelected ? new Set() : new Set(members.map(m => m.user.id))
                                )}
                            >
                                {allSelected ? 'Скрыть всех' : 'Показать всех'}
                            </button>
                        </div>

                        {/* SVG */}
                        <svg viewBox={`0 0 ${W} ${H}`} className="stats-activity-chart" preserveAspectRatio="none">
                            <defs>
                                {memberActivityData.map(({ member, color }) => (
                                    <linearGradient key={member.user.id} id={`grad_${member.user.id}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={color} stopOpacity="0.18" />
                                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                                    </linearGradient>
                                ))}
                            </defs>

                            {/* Сетка */}
                            {[0, 0.25, 0.5, 0.75, 1].map(f => {
                                const y = PAD.top + innerH - f * innerH;
                                const val = Math.round(f * maxActivity);
                                return (
                                    <g key={f}>
                                        <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
                                            stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4,3" />
                                        {val > 0 && (
                                            <text x={PAD.left - 4} y={y + 4} textAnchor="end"
                                                fontSize="9" fill="var(--text-secondary)">{val}</text>
                                        )}
                                    </g>
                                );
                            })}

                            {/* Линии */}
                            {memberActivityData.map(({ member, color, data }) => {
                                if (!selectedMembers.has(member.user.id)) return null;
                                const pts = toSvgPoints(data);
                                const polyline = pts.map(p => `${p.x},${p.y}`).join(' ');
                                const area = `M${pts[0].x},${PAD.top + innerH} ` +
                                    pts.map(p => `L${p.x},${p.y}`).join(' ') +
                                    ` L${pts[pts.length - 1].x},${PAD.top + innerH} Z`;
                                return (
                                    <g key={member.user.id}>
                                        <path d={area} fill={`url(#grad_${member.user.id})`} />
                                        <polyline points={polyline} fill="none" stroke={color}
                                            strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                                        {pts.map((p, i) => p.count > 0 && (
                                            <circle key={i} cx={p.x} cy={p.y} r="3"
                                                fill={color} stroke="var(--bg-alt)" strokeWidth="1.5">
                                                <title>{member.user.username} · {p.date}: {p.count}</title>
                                            </circle>
                                        ))}
                                    </g>
                                );
                            })}

                            {/* Даты */}
                            {dateLabels.map(({ date, i }) => {
                                const x = PAD.left + (i / (days.length - 1)) * innerW;
                                return (
                                    <text key={date} x={x} y={H - 4} textAnchor="middle"
                                        fontSize="9" fill="var(--text-secondary)">
                                        {date.slice(5)}
                                    </text>
                                );
                            })}
                        </svg>
                    </div>
                </div>

                <div className="stats-two-col">
                    {/* ── Таблица участник × статус ── */}
                    <div className="stats-card">
                        <h3>Задачи по участникам</h3>
                        <div className="stats-table-wrapper">
                            <table className="stats-table">
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left' }}>Участник</th>
                                        {STATUSES.map(s => (
                                            <th key={s}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'center' }}>
                                                    <StatusDot status={s} />
                                                    <span style={{ fontSize: '0.7rem' }}>{STATUS_LABELS[s]}</span>
                                                </div>
                                            </th>
                                        ))}
                                        <th>Итого</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {members.map(m => {
                                        const counts = memberTaskMap.get(m.user.id)!;
                                        const total = Object.values(counts).reduce((a, b) => a + b, 0);
                                        return (
                                            <tr key={m.user.id}>
                                                <td>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <UserAvatar username={m.user.username} avatarUrl={m.user.avatarUrl} />
                                                        <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{m.user.username}</span>
                                                    </span>
                                                </td>
                                                {STATUSES.map(s => (
                                                    <td key={s} className="stats-table-count">
                                                        {counts[s] > 0
                                                            ? <span className="stats-count-badge"
                                                                style={{ background: STATUS_COLORS[s] + '22', color: STATUS_COLORS[s] }}>
                                                                {counts[s]}
                                                            </span>
                                                            : <span style={{ color: 'var(--text-secondary)', opacity: 0.3 }}>—</span>
                                                        }
                                                    </td>
                                                ))}
                                                <td className="stats-table-count"><strong>{total}</strong></td>
                                            </tr>
                                        );
                                    })}
                                    <tr className="stats-table-total">
                                        <td><strong>Итого</strong></td>
                                        {STATUSES.map(s => (
                                            <td key={s} className="stats-table-count"><strong>{totalByStatus[s]}</strong></td>
                                        ))}
                                        <td className="stats-table-count"><strong>{tasks.length}</strong></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ── Нагрузка + Приоритеты ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                        {/* Нагрузка */}
                        <div className="stats-card">
                            <h3>Нагрузка участников</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                                {memberLoad.map(({ member, active, total }, idx) => {
                                    const pct = Math.round((total / maxLoad) * 100);
                                    const color = MEMBER_COLORS[idx % MEMBER_COLORS.length];
                                    return (
                                        <div key={member.user.id}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                                                <UserAvatar username={member.user.username} avatarUrl={member.user.avatarUrl} />
                                                <span style={{ fontSize: '0.85rem', fontWeight: 500, flex: 1 }}>{member.user.username}</span>
                                                <span style={{ fontSize: '0.78rem', color: 'var(--status-in-progress)', fontWeight: 600 }}>
                                                    {active} акт.
                                                </span>
                                                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>/ {total}</span>
                                            </div>
                                            <div className="stats-load-bar-bg">
                                                <div className="stats-load-bar-fill"
                                                    style={{ width: `${pct}%`, background: color }} />
                                            </div>
                                        </div>
                                    );
                                })}
                                {memberLoad.every(m => m.total === 0) && (
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', margin: '0.5rem 0' }}>
                                        Нет назначенных задач
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Приоритеты */}
                        <div className="stats-card">
                            <h3>По приоритетам</h3>
                            <div className="stats-priority-row">
                                {(['HIGH', 'MEDIUM', 'LOW'] as const).map(p => {
                                    const count = tasks.filter(t => t.priority === p).length;
                                    const pct = tasks.length > 0 ? Math.round((count / tasks.length) * 100) : 0;
                                    return (
                                        <div key={p} className="stats-priority-item">
                                            <div className="stats-priority-bar-wrap">
                                                <div className="stats-priority-bar"
                                                    style={{ height: `${Math.max(pct, 4)}%`, background: PRIORITY_COLORS[p] }} />
                                            </div>
                                            <span className="stats-priority-count" style={{ color: PRIORITY_COLORS[p] }}>{count}</span>
                                            <span className="stats-priority-label">{p}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ── Диаграммы ── */}
                        <div className="stats-charts-row">

                            {/* Пирог по статусам */}
                            <div className="stats-card stats-pie-card">
                                <h3>По статусам</h3>
                                <svg viewBox="0 0 100 100" className="stats-pie-svg">
                                    <PieChart segments={STATUSES.map(s => ({
                                        value: totalByStatus[s],
                                        color: STATUS_COLORS[s],
                                        label: STATUS_LABELS[s],
                                    }))} />
                                </svg>
                                <div className="stats-pie-legend">
                                    {STATUSES.map(s => totalByStatus[s] > 0 && (
                                        <div key={s} className="stats-pie-legend-item">
                                            <span className="stats-pie-legend-dot" style={{ background: STATUS_COLORS[s] }} />
                                            <span>{STATUS_LABELS[s]}</span>
                                            <span className="stats-pie-legend-count">{totalByStatus[s]}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Пирог по приоритетам */}
                            <div className="stats-card stats-pie-card">
                                <h3>По приоритетам</h3>
                                <svg viewBox="0 0 100 100" className="stats-pie-svg">
                                    <PieChart segments={[
                                        { value: tasks.filter(t => t.priority === 'HIGH').length, color: PRIORITY_COLORS.HIGH, label: 'Высокий' },
                                        { value: tasks.filter(t => t.priority === 'MEDIUM').length, color: PRIORITY_COLORS.MEDIUM, label: 'Средний' },
                                        { value: tasks.filter(t => t.priority === 'LOW').length, color: PRIORITY_COLORS.LOW, label: 'Низкий' },
                                    ]} />
                                </svg>
                                <div className="stats-pie-legend">
                                    {(['HIGH', 'MEDIUM', 'LOW'] as const).map(p => {
                                        const count = tasks.filter(t => t.priority === p).length;
                                        const labels = { HIGH: 'Высокий', MEDIUM: 'Средний', LOW: 'Низкий' };
                                        return count > 0 && (
                                            <div key={p} className="stats-pie-legend-item">
                                                <span className="stats-pie-legend-dot" style={{ background: PRIORITY_COLORS[p] }} />
                                                <span>{labels[p]}</span>
                                                <span className="stats-pie-legend-count">{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Горизонтальные бары — завершённость по участникам */}
                            <div className="stats-card" style={{ flex: 2 }}>
                                <h3>Завершённость по участникам</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                                    {memberLoad.map(({ member, total }, idx) => {
                                        const completed = tasks.filter(t =>
                                            t.assignee?.id === member.user.id && t.status === 'COMPLETED'
                                        ).length;
                                        const inProgress = tasks.filter(t =>
                                            t.assignee?.id === member.user.id && t.status === 'IN_PROGRESS'
                                        ).length;
                                        const other = total - completed - inProgress;
                                        const color = MEMBER_COLORS[idx % MEMBER_COLORS.length];

                                        return (
                                            <div key={member.user.id}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                                                    <UserAvatar username={member.user.username} avatarUrl={member.user.avatarUrl} />
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 500, flex: 1 }}>{member.user.username}</span>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                        {completed}/{total} завершено
                                                    </span>
                                                </div>
                                                {total > 0 ? (
                                                    <div className="stats-stacked-bar">
                                                        {completed > 0 && (
                                                            <div
                                                                className="stats-stacked-segment"
                                                                style={{ width: `${(completed / total) * 100}%`, background: 'var(--status-completed)' }}
                                                                title={`Выполнено: ${completed}`}
                                                            />
                                                        )}
                                                        {inProgress > 0 && (
                                                            <div
                                                                className="stats-stacked-segment"
                                                                style={{ width: `${(inProgress / total) * 100}%`, background: 'var(--status-in-progress)' }}
                                                                title={`В работе: ${inProgress}`}
                                                            />
                                                        )}
                                                        {other > 0 && (
                                                            <div
                                                                className="stats-stacked-segment"
                                                                style={{ width: `${(other / total) * 100}%`, background: color, opacity: 0.3 }}
                                                                title={`Остальные: ${other}`}
                                                            />
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="stats-stacked-bar">
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '0 0.5rem', lineHeight: '8px' }}>
                                                            нет задач
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                        </div>

                    </div>
                </div>
            </div>
        </ProjectLayout>
    );
}