import { useState } from 'react';
import { Folder, FileText, LayoutGrid, List } from 'lucide-react';
import { projects } from '../data/projects';

const categories = ['all', 'personal', 'startup', 'consulting', 'freelance'] as const;

export default function FinderApp() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filtered = activeCategory === 'all'
    ? projects
    : projects.filter(p => p.type === activeCategory);

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-44 shrink-0 bg-[var(--bg-secondary)]/60 border-r border-[var(--border-secondary)] py-3 px-2 flex flex-col gap-0.5">
        <div className="font-mono text-[9px] tracking-widest text-[var(--text-tertiary)] uppercase px-2 mb-1">
          favorites
        </div>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => { setActiveCategory(cat); setSelectedProject(null); }}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-left font-mono text-xs tracking-wide transition-colors ${
              activeCategory === cat
                ? 'bg-blue-500/15 text-blue-500'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
            }`}
          >
            <Folder size={14} strokeWidth={1.5} />
            {cat}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-secondary)] bg-[var(--bg-secondary)]/30">
          <span className="font-mono text-[10px] tracking-wider text-[var(--text-tertiary)]">
            {filtered.length} item{filtered.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded transition-colors ${viewMode === 'grid' ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded transition-colors ${viewMode === 'list' ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}
            >
              <List size={14} />
            </button>
          </div>
        </div>

        {/* File area */}
        <div className="flex-1 overflow-auto p-3">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-3 gap-3">
              {filtered.map((project, i) => {
                const globalIdx = projects.indexOf(project);
                const isSelected = selectedProject === globalIdx;
                return (
                  <button
                    key={project.name}
                    onClick={() => setSelectedProject(isSelected ? null : globalIdx)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all text-center group ${
                      isSelected
                        ? 'bg-blue-500/15 ring-1 ring-blue-500/30'
                        : 'hover:bg-[var(--bg-secondary)]'
                    }`}
                  >
                    <FileText
                      size={32}
                      strokeWidth={1}
                      className={`${isSelected ? 'text-blue-500' : 'text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]'} transition-colors`}
                    />
                    <div className="space-y-0.5">
                      <div className={`font-mono text-[11px] tracking-wide leading-tight ${
                        isSelected ? 'text-blue-500' : 'text-[var(--text-primary)]'
                      }`}>
                        {project.name}
                      </div>
                      <div className="font-mono text-[9px] tracking-wider text-[var(--text-tertiary)] uppercase">
                        {project.type}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col">
              {filtered.map((project) => {
                const globalIdx = projects.indexOf(project);
                const isSelected = selectedProject === globalIdx;
                return (
                  <button
                    key={project.name}
                    onClick={() => setSelectedProject(isSelected ? null : globalIdx)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all text-left ${
                      isSelected
                        ? 'bg-blue-500/15 ring-1 ring-blue-500/30'
                        : 'hover:bg-[var(--bg-secondary)]'
                    }`}
                  >
                    <FileText size={16} strokeWidth={1.5} className={isSelected ? 'text-blue-500' : 'text-[var(--text-tertiary)]'} />
                    <span className={`font-mono text-xs tracking-wide flex-1 ${isSelected ? 'text-blue-500' : 'text-[var(--text-primary)]'}`}>
                      {project.name}
                    </span>
                    <span className="font-mono text-[10px] tracking-wider text-[var(--text-tertiary)] uppercase">
                      {project.type}
                    </span>
                    <span className="font-mono text-[10px] text-[var(--text-tertiary)]">
                      {project.tags.length} tags
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedProject !== null && projects[selectedProject] && (
          <div className="border-t border-[var(--border-secondary)] px-4 py-3 bg-[var(--bg-secondary)]/30">
            <div className="flex items-start gap-3">
              <FileText size={24} strokeWidth={1} className="text-blue-500 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="font-mono text-sm font-medium text-[var(--text-primary)] mb-1">
                  {projects[selectedProject].name}
                </div>
                <div className="text-xs text-[var(--text-secondary)] font-light leading-relaxed mb-2">
                  {projects[selectedProject].description}
                </div>
                <div className="flex flex-wrap gap-1">
                  {projects[selectedProject].tags.map(tag => (
                    <span key={tag} className="font-mono text-[9px] bg-[var(--bg-secondary)] border border-[var(--border-secondary)] px-1.5 py-0.5 rounded text-[var(--text-tertiary)]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
