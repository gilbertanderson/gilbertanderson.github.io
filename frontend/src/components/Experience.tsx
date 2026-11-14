import type { Role } from '../client/siteApi';

export default function Experience({ roles, resume }: { roles: Role[]; resume?: string | null }) {
  return (
    <section id="experience" className="card pad" aria-labelledby="exp-h">
      <div className="card-head">
        <h2 id="exp-h">Experience</h2>
        {resume ? <a className="text-link" href={resume} download>Full resume (.docx)</a> : null}
      </div>
      <ol className="roles">
        {roles.map((r) => (
          <li key={`${r.company}-${r.period}`} className="role">
            <div className="logo" aria-hidden="true">{r.company.charAt(0)}</div>
            <div>
              <h3>{r.title}</h3>
              <p className="role-company">{r.company}</p>
              <p className="role-period muted">{r.period}</p>
              <ul className="role-points">
                {r.highlights.map((h) => <li key={h}>{h}</li>)}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
