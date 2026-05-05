import { useState } from 'react';
import { Link } from 'react-router-dom';
import { projectsApi } from '../api/projects';
import type { ProjectResponse } from '../types';
import MainLayout from '../components/layout/MainLayout';

export default function ProjectSearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProjectResponse[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await projectsApi.search(query.trim());
      setResults(data);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="search-container">
        <h1>Поиск проектов</h1>

        <form onSubmit={handleSearch}>
          <div className="search-bar">
            <span className="material-icons">search</span>
            <input
              type="text"
              placeholder="Введите название проекта..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Поиск...' : 'Найти'}
            </button>
          </div>
        </form>

        {searched && results.length === 0 && (
          <div className="empty-state">
            <span className="material-icons">search_off</span>
            <h2>Ничего не найдено</h2>
            <p>Попробуйте другой запрос</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="projects-grid">
            {results.map((p) => (
              <div key={p.id} className="project-card">
                <div className="project-header">
                  <h3>{p.name}</h3>
                  <span className={`project-role role-${p.currentUserRole}`}>
                    {p.currentUserRole}
                  </span>
                </div>
                <p className="project-description">{p.description}</p>
                <div className="project-meta">
                  <Link to={`/projects/${p.id}`} className="open-link">Открыть →</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
