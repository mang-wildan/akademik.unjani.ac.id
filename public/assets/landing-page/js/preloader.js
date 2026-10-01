(function () {
  const body = document.body;
  const preloader = document.getElementById("landing-preloader");
  const lottieHost = document.getElementById("landing-preloader-lottie");

  if (!body || !preloader || !lottieHost) return;

  body.classList.add("preloader-active");

  let lottieInstance = null;
  if (window.lottie && typeof window.lottie.loadAnimation === "function") {
    lottieInstance = window.lottie.loadAnimation({
      container: lottieHost,
      renderer: "svg",
      loop: true,
      autoplay: true,
      path: "/assets/landing-page/json/Cloud%20loading.json",
    });
  }

  let hasHidden = false;
  const hidePreloader = function () {
    if (hasHidden) return;
    hasHidden = true;

    preloader.classList.add("is-hidden");
    preloader.setAttribute("aria-hidden", "true");
    body.classList.remove("preloader-active");

    if (lottieInstance && typeof lottieInstance.destroy === "function") {
      lottieInstance.destroy();
    }

    window.setTimeout(function () {
      if (preloader && preloader.parentNode) {
        preloader.parentNode.removeChild(preloader);
      }
    }, 520);
  };

  window.addEventListener(
    "load",
    function () {
      window.setTimeout(hidePreloader, 260);
    },
    { once: true }
  );

  window.setTimeout(hidePreloader, 7000);
})();
