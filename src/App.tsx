const PERSONA_HUES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4"];

export default function App() {
  return (
    <>
      <header className="site-head">
        <svg width="36" height="22" viewBox="0 0 40 24" aria-hidden="true">
          {PERSONA_HUES.map((hue, i) => (
            <circle key={hue} cx={6 + i * 7} cy="12" r="5.5" fill={hue} stroke="#fff" strokeWidth="1.4" />
          ))}
        </svg>
        <span className="word">SMIT</span>
      </header>

      <main>
        <section className="hero">
          <div className="wrap">
            <p className="eyebrow">UI/UX Designer</p>
            <h1>Design work, and the thinking behind it.</h1>
            <p className="standfirst">
              This site is being rebuilt. In the meantime, the project below is live and
              explorable in full.
            </p>
          </div>
        </section>

        <section className="work">
          <div className="wrap">
            <h2>Selected work</h2>
            <a className="card" href="/care-personas/">
              <div className="dots" aria-hidden="true">
                {PERSONA_HUES.map((hue) => (
                  <span key={hue} style={{ background: hue }} />
                ))}
              </div>
              <h3>Care Personas</h3>
              <p>
                Two animation-first explainers applying precision-persona segmentation to
                health-system design: a complexity-screened GP&ndash;specialist pipeline, and a
                preference-matched family GP model. Scroll-driven person-figure theatres, a live
                scenario model, and a one-page executive summary.
              </p>
              <span className="go">View the project &rarr;</span>
            </a>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <p>
            Placeholder landing page &mdash; replace with the exported portfolio design.{" "}
            <a href="/care-personas/">Care Personas</a> is the live project in this repository.
          </p>
        </div>
      </footer>
    </>
  );
}
