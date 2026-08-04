(function () {
  var DISMISS_KEY = "five-things-install-banner-dismissed";

  function isIosSafari() {
    var ua = window.navigator.userAgent;
    var isIos = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    var isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
    return isIos && isSafari;
  }

  function isStandalone() {
    return (
      window.navigator.standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches
    );
  }

  function dismissed() {
    try {
      return window.localStorage.getItem(DISMISS_KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  function dismiss() {
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch (e) {
      // localStorage unavailable (private mode, etc.) — banner just won't persist dismissal
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!isIosSafari() || isStandalone() || dismissed()) return;

    var banner = document.querySelector(".install-banner");
    if (!banner) return;

    banner.classList.add("is-visible");

    var dismissButton = banner.querySelector(".install-banner-dismiss");
    if (dismissButton) {
      dismissButton.addEventListener("click", function () {
        banner.classList.remove("is-visible");
        dismiss();
      });
    }
  });
})();
