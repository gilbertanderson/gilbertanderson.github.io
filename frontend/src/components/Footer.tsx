export default function Footer({ name }: { name: string }) {
  return (
    <footer className="site-footer">
      <div className="footer-row">
        <p>© {new Date().getFullYear()} {name}</p>
        <p>Built with React, TypeScript &amp; FastAPI · Hosted on GitHub Pages</p>
      </div>
    </footer>
  );
}
