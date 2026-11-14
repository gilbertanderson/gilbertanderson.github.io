import type { ToolGroup } from '../client/siteApi';

export default function Tools({ groups }: { groups: ToolGroup[] }) {
  return (
    <section id="tools" className="band band-white" aria-labelledby="tools-h">
      <div className="container section">
        <h2 id="tools-h">Tools &amp; experience</h2>
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
      </div>
    </section>
  );
}
