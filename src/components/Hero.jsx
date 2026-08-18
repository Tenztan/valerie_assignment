export default function Hero() {
  return (
<section className="hero" id="home">
<div className="container">
<nav aria-label="Main navigation" className="hero-nav">
<a aria-label="SkyAI home" className="brand" href="#home">
<span aria-hidden="true" className="brand-mark"><span></span><span></span></span>
<span>SkyAI</span>
</a>
<div className="nav-links">
<a className="nav-link active" href="#home">Home</a>
<a className="nav-link" href="#about">About</a>
<a className="nav-link" href="#features">Feature</a>
<a className="nav-link" href="#services">Service</a>
<a className="nav-link" href="#services">Blog</a>
</div>
<div className="nav-actions">
<div aria-label="Search" className="search-pill">
<span>Search Your Item</span>
<span aria-hidden="true" className="search-icon"></span>
</div>
<button aria-label="Profile" className="profile-btn" type="button">
<svg aria-hidden="true" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24">
<circle cx="12" cy="8" r="3.5"></circle>
<path d="M5.2 20c.8-4 3.3-6 6.8-6s6 2 6.8 6"></path>
</svg>
</button>
</div>
</nav>
<div className="hero-stage">
<div className="section-label hero-label">Artificial intelligence</div>
<h1 className="technology">TECHNOLOGY</h1>
<div className="hero-left">
<p className="hero-intro">
              Advanced technology designed to power intelligent automation, data driven insights,
              and smarter digital experiences across modern industries.
            </p>
<a className="button" href="#about">Get Started Now</a>
<div aria-label="Performance metrics" className="hero-metrics">
<div className="metric">
<div className="metric-name">Efficiency</div>
<div className="metric-track"><div className="metric-fill" data-value="84"></div></div>
</div>
<div className="metric">
<div className="metric-name">Security</div>
<div className="metric-track"><div className="metric-fill" data-value="80"></div></div>
</div>
<div className="metric">
<div className="metric-name">Reliability</div>
<div className="metric-track"><div className="metric-fill" data-value="70"></div></div>
</div>
</div>
</div>
<aside className="hero-right">
<p className="hero-tagline">Accelerating Digital<br />Transformation</p>
<svg aria-hidden="true" className="circuit-line" fill="none" viewBox="0 0 280 50">
<path d="M0 28H178L207 0H280" stroke="white" strokeWidth="2"></path>
</svg>
<div className="hero-card">
<img alt="Long exposure light trails" src="/assets/img_4.png"/>
</div>
<div className="hero-stats">
<div className="stat">
<strong>98%</strong>
<span>Accuracy Increase</span>
</div>
<div className="stat">
<strong>150+</strong>
<span>Processed Client</span>
</div>
</div>
</aside>
</div>
</div>
</section>
  );
}
