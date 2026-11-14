export default function About({ bio }: { bio: string }) {
  return (
    <section id="about" className="card pad" aria-labelledby="about-h">
      <h2 id="about-h">About</h2>
      <p>{bio}</p>
    </section>
  );
}
