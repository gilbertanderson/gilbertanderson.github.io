import type { Role } from '../client/siteApi';

export default function Experience({ roles, resume }: { roles: Role[]; resume?: string | null }) {
  return (
    <section id="experience" className="band" aria-labelledby="exp-h">
      <div className="container section">
        <div className="section-head">
          <h2 id="exp-h">Experience</h2>
          {resume ? (
            <a className="text-link" href={resume} download>Full resume (.docx)</a>
          ) : null}
        </div>
        <ol className="roles">
          {roles.map((r) => (
            <li key={`${r.company}-${r.period}`} className="role">
              <p className="role-period num">{r.period}</p>
              <div>
                <h3>{r.title}</h3>
                <p className="role-company">{r.company}</p>
                <ul className="role-points">
                  {r.highlights.map((h) => <li key={h}>{h}</li>)}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
