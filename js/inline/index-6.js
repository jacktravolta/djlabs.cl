    // Menu burger: reconstruye el menu mobile con los mismos indices del nav
    // del header, que en movil estan ocultos por "hidden md:flex".
    (function () {
      var BTN = 'dj-burger';
      var MENU = 'dj-menu';
      var BACKDROP = 'dj-menu-backdrop';
      var abierto = false;
      var ultimoFoco = null;
      var overflowOriginal = '';

      function partes() {
        var header = document.querySelector('#root header');
        if (!header) return null;
        var nav = header.querySelector('nav');
        if (!nav) return null;
        // El nav va seguido del contenedor derecho (boton de replay).
        var host = nav.nextElementSibling;
        if (!host || host.tagName !== 'DIV') host = nav.parentElement;
        if (!host) return null;
        return { header: header, nav: nav, host: host };
      }

      function crearBoton() {
        var b = document.createElement('button');
        b.id = BTN;
        b.type = 'button';
        b.setAttribute('aria-label', 'Abrir menú');
        b.setAttribute('aria-expanded', 'false');
        b.setAttribute('aria-controls', MENU);
        b.innerHTML = '<span></span><span></span><span></span>';
        return b;
      }

      function asegurarBoton() {
        var p = partes();
        if (!p) return;
        var btn = document.getElementById(BTN);
        if (!btn) {
          p.host.appendChild(crearBoton());
        } else if (btn.parentNode !== p.host) {
          p.host.appendChild(btn);
        }
      }

      // React puede re-renderizar el header y borrar lo inyectado.
      function asegurarNavContacto() {
        var p = partes();
        if (!p || p.nav.querySelector('a[href="#contacto"]')) return;
        var link = document.createElement('a');
        link.href = '#contacto';
        link.className = 'hover:text-[#F8F6F0] transition-colors';
        link.textContent = 'Contacto';
        p.nav.appendChild(link);
      }

      function indices() {
        var p = partes();
        var out = [];
        if (p) {
          var as = p.nav.querySelectorAll('a');
          for (var i = 0; i < as.length; i++) {
            out.push({
              href: as[i].getAttribute('href') || '#',
              texto: (as[i].textContent || '').trim()
            });
          }
        }
        var tiene = false;
        for (var j = 0; j < out.length; j++) {
          if (out[j].href === '#contacto') { tiene = true; break; }
        }
        if (!tiene) out.push({ href: '#contacto', texto: 'Contacto' });
        return out;
      }

      function panel() {
        var menu = document.getElementById(MENU);
        if (!menu) {
          menu = document.createElement('div');
          menu.id = MENU;
          menu.setAttribute('role', 'dialog');
          menu.setAttribute('aria-modal', 'true');
          menu.setAttribute('aria-label', 'Menú de navegación');
          menu.setAttribute('aria-hidden', 'true');
          menu.innerHTML = '<nav></nav>';
          document.body.appendChild(menu);
        }
        var backdrop = document.getElementById(BACKDROP);
        if (!backdrop) {
          backdrop = document.createElement('div');
          backdrop.id = BACKDROP;
          document.body.appendChild(backdrop);
        }
        return { menu: menu, backdrop: backdrop, nav: menu.querySelector('nav') };
      }

      function llenar(navEl) {
        var items = indices();
        navEl.textContent = '';
        items.forEach(function (item) {
          var a = document.createElement('a');
          a.href = item.href;
          a.textContent = item.texto;
          navEl.appendChild(a);
        });
      }

      function setAbierto(estado, restaurarFoco) {
        var p = panel();
        var btn = document.getElementById(BTN);
        abierto = estado;
        p.menu.classList.toggle('dj-open', estado);
        p.backdrop.classList.toggle('dj-open', estado);
        p.menu.setAttribute('aria-hidden', estado ? 'false' : 'true');
        if (btn) {
          btn.setAttribute('aria-expanded', estado ? 'true' : 'false');
          btn.setAttribute('aria-label', estado ? 'Cerrar menú' : 'Abrir menú');
        }
        if (estado) {
          ultimoFoco = document.activeElement;
          overflowOriginal = document.body.style.overflow;
          document.body.style.overflow = 'hidden';
          llenar(p.nav);
          var primero = p.nav.querySelector('a');
          if (primero) primero.focus();
        } else {
          document.body.style.overflow = overflowOriginal;
          if (restaurarFoco !== false && ultimoFoco && ultimoFoco.focus) {
            ultimoFoco.focus();
          }
        }
      }

      function alternar() {
        setAbierto(!abierto, true);
      }

      document.addEventListener('click', function (event) {
        var btn = document.getElementById(BTN);
        if (btn && btn.contains(event.target)) {
          event.preventDefault();
          alternar();
          return;
        }
        var backdrop = document.getElementById(BACKDROP);
        if (abierto && backdrop && backdrop.contains(event.target)) {
          setAbierto(false, true);
        }
      });

      document.addEventListener('click', function (event) {
        var menu = document.getElementById(MENU);
        if (!abierto || !menu) return;
        var nav = menu.querySelector('nav');
        if (nav && nav.contains(event.target) && event.target.closest('a')) {
          // Cerramos antes del salto al ancla para no bloquear el scroll.
          setAbierto(false, false);
        }
      });

      document.addEventListener('keydown', function (event) {
        if (!abierto) return;
        if (event.key === 'Escape') {
          setAbierto(false, true);
          return;
        }
        if (event.key !== 'Tab') return;
        // Trampa de foco: el foco no puede salir del menu abierto.
        var menu = document.getElementById(MENU);
        var btn = document.getElementById(BTN);
        if (!menu) return;
        var nav = menu.querySelector('nav');
        var foco = [];
        if (btn) foco.push(btn);
        if (nav) {
          var as = nav.querySelectorAll('a');
          for (var i = 0; i < as.length; i++) foco.push(as[i]);
        }
        if (!foco.length) return;
        var primero = foco[0];
        var ultimo = foco[foco.length - 1];
        if (event.shiftKey && document.activeElement === primero) {
          event.preventDefault();
          ultimo.focus();
        } else if (!event.shiftKey && document.activeElement === ultimo) {
          event.preventDefault();
          primero.focus();
        }
      });

      window.addEventListener('resize', function () {
        if (abierto && window.innerWidth >= 768) setAbierto(false, false);
      });

      asegurarBoton();
      asegurarNavContacto();
      var intentos = 0;
      var timer = setInterval(function () {
        asegurarBoton();
        asegurarNavContacto();
        if (++intentos > 60) clearInterval(timer);
      }, 250);

      // Si React reemplaza el header, el boton se vuelve a insertar.
      var root = document.getElementById('root');
      if (root && window.MutationObserver) {
        new MutationObserver(function () {
          asegurarBoton();
          asegurarNavContacto();
        }).observe(root, { childList: true, subtree: true });
      }
    })();
  