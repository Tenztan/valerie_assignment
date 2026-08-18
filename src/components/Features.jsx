export default function Features() {
  return (
<section className="features" id="features">
<div className="container">
<div className="features-head">
<div>
<div className="section-label gsap-reveal">Feature</div>
<h2 className="display features-title gsap-reveal">Built with Powerful<br />AI Capabilities</h2>
</div>
<p className="copy features-copy gsap-reveal">
            Our AI platform is designed with advanced features that help businesses operate smarter,
            faster, and more efficiently through intelligent technology.
          </p>
</div>
<div className="features-body">
<div className="feature-media gsap-reveal">
<div aria-label="Feature image placeholder" className="feature-image">
<img alt="" src="/assets/img_3.png"/>
</div>
<div aria-label="Image slide placeholders" className="feature-dots">
<button aria-label="Image 1" aria-pressed="true" className="feature-dot active" data-slide="0" type="button"></button>
<button aria-label="Image 2" aria-pressed="false" className="feature-dot" data-slide="1" type="button"></button>
<button aria-label="Image 3" aria-pressed="false" className="feature-dot" data-slide="2" type="button"></button>
<button aria-label="Image 4" aria-pressed="false" className="feature-dot" data-slide="3" type="button"></button>
<button aria-label="Image 5" aria-pressed="false" className="feature-dot" data-slide="4" type="button"></button>
</div>
</div>
<div aria-label="AI capabilities" className="feature-list-wrap gsap-reveal" tabIndex="0">
<div className="feature-list">
<article aria-current="step" className="feature-item active" data-index="0">
<h3>Real-Time AI Processing</h3>
<p>Process and analyze data instantly to deliver fast, accurate insights that support timely and informed decision-making.</p>
</article>
<article className="feature-item" data-index="1">
<h3>Scalable AI Architecture</h3>
<p>Scale AI workloads smoothly as your data, users, and business requirements continue to grow.</p>
</article>
<article className="feature-item" data-index="2">
<h3>Advanced Data Security</h3>
<p>Protect sensitive information with secure processing, access controls, and privacy-first data handling.</p>
</article>
<article className="feature-item" data-index="3">
<h3>Customizable AI Models</h3>
<p>Adapt models and intelligent workflows to fit unique products, teams, and operational requirements.</p>
</article>
<article className="feature-item" data-index="4">
<h3>Intelligent Automation</h3>
<p>Automate repetitive processes and coordinate complex workflows with responsive AI-driven actions.</p>
</article>
<article className="feature-item" data-index="5">
<h3>Predictive Analytics</h3>
<p>Discover patterns in your data and forecast outcomes to support better planning and faster decisions.</p>
</article>
<article className="feature-item" data-index="6">
<h3>Seamless API Integration</h3>
<p>Connect AI capabilities with existing products and systems through flexible, integration-ready interfaces.</p>
</article>
<article className="feature-item" data-index="7">
<h3>Continuous Optimization</h3>
<p>Improve performance over time using feedback, monitoring, and adaptive intelligent workflows.</p>
</article>
</div>
<div aria-hidden="true" className="feature-scrollbar"><span></span></div>
</div>
</div>
</div>
</section>
  );
}
