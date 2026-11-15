import type { Project } from '../client/siteApi';
import { ArrowRight } from './Icons';

function Thumb({ project }: { project: Project }) {
  if (project.image) {
    return <img className="thumb" src={project.image} alt={`Preview of ${project.title}`} loading="lazy" />;
  }
  return <div className="thumb thumb-type" aria-hidden="true"><span>{project.title}</span></div>;
}

function Group({ label, projects }: { label: string; projects: Project[] }) {
  if (!projects.length) return null;
  return (
    <div className="project-group">
      <h3 className="group-label">{label}</h3>
      <ul className="projects">
        {projects.map((p) => (
          <li key={p.title} className="project">
            <Thumb project={p} />
            <div className="project-body">
              <p className="tag">{p.kind}</p>
              <h4>{p.title}</h4>
              <p className="muted">{p.description}</p>
              <a className="text-link" href={p.url} target="_blank" rel="noreferrer">
                {p.link_label ?? 'View on GitHub'} <ArrowRight width={16} height={16} />
              </a>
              {p.article_url ? (
                <a className="text-link" href={p.article_url} target="_blank" rel="noreferrer">
                  Read the write-up <ArrowRight width={16} height={16} />
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Projects({ projects }: { projects: Project[] }) {
  return (
    <section id="work" className="card pad" aria-labelledby="work-h">
      <h2 id="work-h">Projects</h2>
      <Group label="Design work" projects={projects.filter((p) => p.category === 'design')} />
      <Group label="Development work" projects={projects.filter((p) => p.category !== 'design')} />
    </section>
  );
}
