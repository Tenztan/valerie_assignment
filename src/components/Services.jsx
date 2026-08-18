export default function Services() {
  return (
<section className="services" id="services">
<div className="container">
<header className="services-head gsap-reveal">
<div className="section-label">Service</div>
<h2 className="display services-title">
            Intelligent AI Solutions for<br />
            Modern Businesses
          </h2>
<p className="copy services-copy">
            We deliver advanced artificial intelligence services designed to automate processes, analyze data<br />
            intelligently, and help organizations make faster, more accurate decisions.
          </p>
</header>
<div className="service-grid">
<article className="service-card gsap-reveal">
<img alt="" src="/assets/img_1.png"/>
<div className="service-card-copy">
<h3>AI Automation</h3>
<p>Automating workflows to improve efficiency and reduce operational complexity.</p>
</div>
</article>
<article className="service-card gsap-reveal">
<img alt="" src="/assets/img_2.png"/>
<div className="service-card-copy">
<h3>Data Intelligence &amp; Analytics</h3>
<p>Transforming data into actionable insights for smarter decision making.</p>
</div>
</article>
<article className="service-card gsap-reveal">
<img alt="" src="/assets/img.png"/>
<div className="service-card-copy">
<h3>Predictive AI Solutions</h3>
<p>Forecasting trends and outcomes using advanced machine learning models.</p>
</div>
</article>
</div>
</div>
</section>
  );
}
