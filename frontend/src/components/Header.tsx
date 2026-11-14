export default function Header({ name }: { name: string }) {
  return (
    <header className="site-header">
      <nav className="nav" aria-label="Main">
        <a className="wordmark" href="#top">{name}</a>
        <div className="nav-links">
          <a href="#about">About</a>
          <a href="#experience">Experience</a>
          <a href="#work">Projects</a>
          <a href="#tools">Skills</a>
        </div>
      </nav>
    </header>
  );
}
