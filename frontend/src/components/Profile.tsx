import type { Link, Site } from '../client/siteApi';
import { ArrowDown } from './Icons';

export default function Profile({ site, links }: { site: Site; links: Link[] }) {
  return (
    <section id="top" className="card profile" aria-labelledby="name-h">
      <div className="banner">
        {site.banner ? <img src={site.banner} alt="" /> : null}
      </div>
      {site.avatar ? <img className="avatar" src={site.avatar} alt={`Photo of ${site.name}`} /> : null}
      <div className="profile-body">
        <h1 id="name-h">{site.name}</h1>
        <p className="profile-title">{site.title}</p>
        <p className="muted">{site.headline}</p>
        <div className="actions">
          <a className="btn btn-primary" href="#contact">Contact</a>
          {site.resume ? (
            <a className="btn btn-outline" href={site.resume} download>
              Resume <ArrowDown width={16} height={16} />
            </a>
          ) : null}
          {links.map((l) => (
            <a key={l.label} className="btn btn-outline" href={l.url} target="_blank" rel="noreferrer">{l.label}</a>
          ))}
        </div>
      </div>
    </section>
  );
}
