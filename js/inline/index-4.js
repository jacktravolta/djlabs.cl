    // Section reveal animations: staggered fade/slide-in via IntersectionObserver.
    (function () {
      if (!('IntersectionObserver' in window)) return;
      var seen = new WeakSet();
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var box = en.target.querySelector(':scope > div');
          if (box) box.classList.add('dj-in');
          io.unobserve(en.target);
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
      function prep() {
        var secs = document.querySelectorAll('#root section');
        for (var i = 0; i < secs.length; i++) {
          var sec = secs[i];
          if (seen.has(sec)) continue;
          var box = sec.querySelector(':scope > div');
          if (!box) continue;
          seen.add(sec);
          box.classList.add('dj-anim');
          io.observe(sec);
        }
      }
      document.documentElement.classList.add('dj-anim-on');
      prep();
      var n = 0;
      var t = setInterval(function () {
        prep();
        if (++n > 40) clearInterval(t);
      }, 500);
    })();
  