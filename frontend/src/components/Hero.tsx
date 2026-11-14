import type { Link, Site } from '../client/siteApi';
import { ArrowDown, ArrowUpRight } from './Icons';

export default function Hero({ site, links }: { site: Site; links: Link[] }) {
  const github = links.find((l) => l.label === 'GitHub');

  return (
    <section id="top" className="container hero">
      <p className="eyebrow">{site.title}</p>
      <h1>{site.headline}</h1>
      {site.bio ? <p className="lede">{site.bio}</p> : null}
      <div className="actions">
        <a className="btn btn-dark" href="#work">See my work <ArrowDown /></a>
        {github ? (
          <a className="btn btn-outline" href={github.url} target="_blank" rel="noreferrer">
            GitHub <ArrowUpRight width={16} height={16} />
          </a>
        ) : null}
      </div>
    </section>
  );
}
