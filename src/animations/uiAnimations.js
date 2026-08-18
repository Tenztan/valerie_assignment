import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Remove the initial CSS hidden state once GSAP has taken control.
    gsap.set(".gsap-reveal", { opacity: 1, y: 0 });

    if (!reduceMotion) {
      gsap.from(".hero-label", {
        y: 14,
        opacity: 0,
        duration: .7,
        delay: .15,
        ease: "power3.out"
      });

      gsap.from(".technology", {
        y: 36,
        opacity: 0,
        duration: 1,
        delay: .12,
        ease: "power3.out"
      });

      gsap.from([".hero-left", ".hero-right"], {
        y: 24,
        opacity: 0,
        duration: .85,
        delay: .28,
        stagger: .12,
        ease: "power3.out"
      });

      gsap.utils.toArray(".gsap-reveal").forEach((el) => {
        gsap.from(el, {
          y: 38,
          opacity: 0,
          duration: .9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            once: true
          }
        });
      });
    }

    gsap.to(".metric-fill", {
      width: (i, el) => el.dataset.value + "%",
      duration: 1.2,
      delay: .5,
      stagger: .12,
      ease: "power3.out"
    });

    const featureItems = [...document.querySelectorAll(".feature-item")];
    const featureListWrap = document.querySelector(".feature-list-wrap");
    const featureDots = [...document.querySelectorAll(".feature-dot")];

    function activateCapability(index) {
      const safeIndex = Math.max(0, Math.min(index, featureItems.length - 1));
      const nextItem = featureItems[safeIndex];

      featureItems.forEach((item, i) => {
        const active = i === safeIndex;
        item.classList.toggle("active", active);
        if (active) item.setAttribute("aria-current", "step");
        else item.removeAttribute("aria-current");
      });

      if (!reduceMotion) {
        gsap.fromTo(
          nextItem,
          { scale: .985, y: 4 },
          { scale: 1, y: 0, duration: .34, ease: "power2.out", overwrite: true }
        );
      }

      // Keep the selected capability visible inside the scrollable list.
      const top = nextItem.offsetTop;
      const bottom = top + nextItem.offsetHeight;
      const visibleTop = featureListWrap.scrollTop;
      const visibleBottom = visibleTop + featureListWrap.clientHeight;

      if (top < visibleTop + 12 || bottom > visibleBottom - 12) {
        nextItem.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "nearest"
        });
      }
    }

    featureItems.forEach((item, index) => {
      item.addEventListener("click", () => activateCapability(index));
      item.setAttribute("role", "button");
      item.setAttribute("tabindex", "0");
      item.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activateCapability(index);
        }
      });
    });

    // The five dots are ready for your future PNG carousel.
    featureDots.forEach((dot) => {
      dot.addEventListener("click", () => {
        featureDots.forEach((item) => {
          item.classList.remove("active");
          item.setAttribute("aria-pressed", "false");
        });
        dot.classList.add("active");
        dot.setAttribute("aria-pressed", "true");

        if (!reduceMotion) {
          gsap.fromTo(dot, { scale: .8 }, { scale: 1, duration: .25, ease: "back.out(2)" });
        }
      });
    });

    activateCapability(0);

    // Active nav state follows the section currently in view.
    const sectionMap = [
      ["home", "home"],
      ["about", "about"],
      ["features", "features"],
      ["services", "services"]
    ];

    sectionMap.forEach(([sectionId, navId]) => {
      ScrollTrigger.create({
        trigger: "#" + sectionId,
        start: "top center",
        end: "bottom center",
        onToggle(self) {
          if (!self.isActive) return;
          document.querySelectorAll(".nav-link").forEach(link => link.classList.remove("active"));
          const target = [...document.querySelectorAll(".nav-link")].find(link =>
            link.getAttribute("href") === "#" + navId
          );
          if (target) target.classList.add("active");
        }
      });
    });
