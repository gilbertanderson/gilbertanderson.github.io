export default function Header({ name }: { name: string }) {
  return (
    <header className="site-header">
      <nav className="container nav" aria-label="Main">
        <a className="wordmark" href="#top">{name}</a>
        <div className="nav-links">
          <a href="#work">Work</a>
          <a href="#experience">Experience</a>
          <a href="#tools">Skills</a>
          <a className="btn btn-accent btn-sm" href="#contact">Get in touch</a>
        </div>
      </nav>
    </header>
  );
}
