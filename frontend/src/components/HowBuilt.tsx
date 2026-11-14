import type { HowBuilt as HowBuiltData } from '../client/siteApi';

export default function HowBuilt({ data, repo }: { data: HowBuiltData; repo?: string }) {
  return (
    <section id="built" className="card pad" aria-labelledby="built-h">
      <h2 id="built-h">{data.heading}</h2>
      {data.blurb ? <p className="muted">{data.blurb}</p> : null}
      <ul className="role-points">
        {data.points.map((p) => <li key={p}>{p}</li>)}
      </ul>
      {repo ? <a className="text-link" href={repo} target="_blank" rel="noreferrer">View the source</a> : null}
    </section>
  );
}
