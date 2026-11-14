import type { Project } from '../client/siteApi';
import { ArrowRight } from './Icons';

function Thumb({ project }: { project: Project }) {
  if (project.image) {
    return <img className="card-thumb" src={project.image} alt={`Screenshot of ${project.title}`} loading="lazy" />;
  }
  // No screenshot yet: a typographic tile, so the grid still reads as finished.
  return (
    <div className="card-thumb card-thumb-type" aria-hidden="true">
      <span>{project.title}</span>
    </div>
  );
}

export default function Projects({ projects }: { projects: Project[] }) {
  return (
    <section id="work" className="band" aria-labelledby="work-h">
      <div className="container section">
        <div className="section-head">
          <h2 id="work-h">Selected work</h2>
          <p className="muted">{projects.length} projects, from UX to full-stack.</p>
        </div>
        <div className="card-grid">
          {projects.map((p, i) => (
            <article key={p.title} className="card">
              <Thumb project={p} />
              <div className="card-body">
                <div className="card-meta">
                  <span className="tag">{p.kind}</span>
                  <span className="num">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <h3>{p.title}</h3>
                <p className="muted grow">{p.description}</p>
                <a className="text-link" href={p.url} target="_blank" rel="noreferrer">
                  {p.link_label ?? 'View on GitHub'} <ArrowRight width={16} height={16} />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
