// Reusable footer loader: fetch components/footer.html and inject into #load-footer
(function () {
  function tryFetch(paths) {
    // Try each path sequentially until one succeeds
    return paths.reduce(function (prevPromise, path) {
      return prevPromise.catch(function () {
        return fetch(path).then(function (res) {
          if (!res.ok) throw new Error('fetch ' + path + ' failed: ' + res.status);
          return res.text();
        });
      });
    }, Promise.reject());
  }

  function loadFooter() {
    var placeholder = document.getElementById('load-footer');
    if (!placeholder) return;

    // Don't inject footer on the login page(s)
    try {
      var path = window.location.pathname || '';
      if (path.endsWith('login.html')) {
        // ensure placeholder is empty if present
        placeholder.innerHTML = '';
        return;
      }
    } catch (e) {
      // ignore — if window isn't available for some reason, continue
    }

    // Try common relative locations in case pages are nested or opened differently
    tryFetch([
      'components/footer.html', // usual path for pages in GiaoDien/
      './components/footer.html' // alternative relative path
    ])
      .then(function (html) {
        // If Shadow DOM is available, use it to isolate footer styles
        try {
          if (placeholder.attachShadow) {
            var shadow = placeholder.attachShadow({ mode: 'open' });

            // Inject the footer HTML
            var container = document.createElement('div');
            container.innerHTML = html;
            shadow.appendChild(container);
            return;
          }
        } catch (e) {
          // continue to fallback
          console.warn('Shadow DOM injection failed, falling back to normal injection.', e);
        }

        // Fallback: normal DOM injection
        placeholder.innerHTML = html;
      })
      .catch(function (err) {
        console.error('Failed to load footer from components/footer:', err);
        // graceful fallback: show a minimal footer so page isn't blank
        placeholder.innerHTML = '<footer class="site-footer"><div style="padding:16px;text-align:center;background:#333;color:#fff;">Footer failed to load. Serve the site via a static server for best results.</div></footer>';
      });
  }

  // Run on DOMContentLoaded so pages that include this script late still work
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadFooter);
  } else {
    loadFooter();
  }
})();

