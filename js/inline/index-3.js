    (function () {
      var tpl = document.getElementById('dj-contacto-tpl');
      if (!tpl) return;
      var section = tpl.content.firstElementChild.cloneNode(true);
      var placed = false;

      function addNavLink() {
        var nav = document.querySelector('#root header nav');
        if (!nav || nav.querySelector('a[href="#contacto"]')) return;
        var link = document.createElement('a');
        link.href = '#contacto';
        link.className = 'hover:text-[#F8F6F0] transition-colors';
        link.textContent = 'Contacto';
        nav.appendChild(link);
      }

      function attach() {
        var form = document.getElementById('dj-contact-form');
        var btn = document.getElementById('dj-submit');
        var status = document.getElementById('dj-status');
        var nameEl = document.getElementById('dj-name');
        var emailEl = document.getElementById('dj-email');
        var msgEl = document.getElementById('dj-message');
        var hpEl = document.getElementById('dj-website');
        if (!form) return;

        function setStatus(kind, text) {
          status.className = 'dj-status' + (kind ? ' dj-' + kind : '');
          status.textContent = text;
        }
        // Base de la API de contacto. window.__API_BASE__ permite cambiarlo sin
        // tocar el bundle; en GitHub Pages la API vive en otro origen.
        var API_BASE = (typeof window !== 'undefined' && window.__API_BASE__) || 'https://api.djlabs.cl';
        function contactEndpoint() {
          // En local el proxy sirve /contact sin CORS; en produccion, la API.
          var host = location.hostname;
          var local = host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';
          return local ? '/contact' : API_BASE.replace(/\/+$/, '') + '/contact';
        }
        // En un hosting estatico (GitHub Pages) no hay /contact: caemos a WhatsApp.
        function setWaFallback(prefix) {
          status.className = 'dj-status dj-err';
          status.textContent = prefix + ' ';
          var a = document.createElement('a');
          a.className = 'dj-wa-link';
          a.href = 'https://wa.me/56988068917';
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.textContent = 'Escríbenos por WhatsApp';
          status.appendChild(a);
        }
        function mark(el, bad) {
          el.classList.toggle('dj-bad', !!bad);
        }

        form.addEventListener('submit', function (event) {
          event.preventDefault();
          var name = nameEl.value.trim();
          var email = emailEl.value.trim();
          var message = msgEl.value.trim();
          mark(nameEl, false); mark(emailEl, false); mark(msgEl, false);

          var error = '';
          if (!name) {
            error = 'Para responderte, dinos tu nombre.';
            mark(nameEl, true);
          } else if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            error = 'Necesitamos un correo v\u00e1lido para responderte. Rev\u00edsalo con calma.';
            mark(emailEl, true);
          } else if (!message) {
            error = 'Por favor, escribe tu mensaje para que podamos ayudarte.';
            mark(msgEl, true);
          } else if (message.length > 5000) {
            error = 'Tu mensaje es m\u00e1s largo de lo que podemos recibir (m\u00e1ximo 5000 caracteres). \u00bfPodr\u00edas resumirlo un poco?';
            mark(msgEl, true);
          }
          if (error) { setStatus('err', error); return; }

          btn.disabled = true;
          var label = btn.textContent;
          btn.textContent = 'Enviando\u2026';
          setStatus('', '');

          fetch(contactEndpoint(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ name: name, email: email, message: message, website: hpEl.value })
          }).then(function (response) {
            return response.json().catch(function () { return {}; }).then(function (json) {
              return { ok: response.ok, status: response.status, json: json };
            });
          }).then(function (result) {
            if (result.json && result.json.success) {
              form.reset();
              setStatus('ok', (result.json.data && result.json.data.message) ||
                'Gracias por escribirnos. Recibimos tu mensaje y te responderemos a la brevedad.');
            } else if (result.status === 429) {
              setStatus('err', (result.json && result.json.error && result.json.error.message) ||
                'Recibimos varios mensajes en poco tiempo. Espera unos minutos e intenta de nuevo, por favor.');
            } else if (result.status === 404 || result.status === 405) {
              setWaFallback('Este formulario no está disponible en este hosting, pero puedes escribirnos directo:');
            } else {
              setStatus('err', (result.json && result.json.error && result.json.error.message) ||
                'No pudimos enviar tu mensaje ahora. Revisa lo escrito e int\u00e9ntalo nuevamente.');
            }
          }).catch(function () {
            setWaFallback('No pudimos conectar con el servidor de contacto, pero puedes escribirnos directo:');
          }).then(function () {
            btn.disabled = false;
            btn.textContent = label;
          });
        });
      }

      function place() {
        if (placed) return;
        var footer = document.querySelector('#root footer');
        var root = document.getElementById('root');
        if (footer && footer.parentNode) {
          footer.parentNode.insertBefore(section, footer);
          placed = true;
        } else if (root && root.children.length) {
          root.appendChild(section);
          placed = true;
        }
        if (placed) { attach(); addNavLink(); }
      }

      var tries = 0;
      var timer = setInterval(function () {
        place();
        if (placed || ++tries > 200) clearInterval(timer);
      }, 50);
      place();
    })();
  