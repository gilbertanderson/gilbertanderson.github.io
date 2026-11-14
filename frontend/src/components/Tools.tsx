import type { ToolGroup } from '../client/siteApi';

function Groups({ groups }: { groups: ToolGroup[] }) {
  return (
    <div className="tool-grid">
      {groups.map((g) => (
        <div key={g.group} className="tool-group">
          <h3>{g.group}</h3>
          <ul className="chips">
            {g.items.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default function Tools({ groups, credentials }: { groups: ToolGroup[]; credentials?: ToolGroup[] }) {
  return (
    <section id="tools" className="band band-white" aria-labelledby="tools-h">
      <div className="container section">
        <h2 id="tools-h">Skills</h2>
        <Groups groups={groups} />
        {credentials?.length ? (
          <>
            <h2 id="cred-h" className="subhead">Education &amp; certifications</h2>
            <Groups groups={credentials} />
          </>
        ) : null}
      </div>
    </section>
  );
}
