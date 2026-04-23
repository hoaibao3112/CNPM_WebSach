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
        placeholder.innerHTML = '';
        return;
      }
    } catch (e) {}

    tryFetch([
      'components/footer.html',
      './components/footer.html'
    ])
      .then(function (html) {
        placeholder.innerHTML = html;
        
        // Manual execution of script tags because innerHTML doesn't run them
        var scripts = placeholder.querySelectorAll('script');
        scripts.forEach(function(oldScript) {
            var newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
            newScript.appendChild(document.createTextNode(oldScript.innerHTML));
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
      })
      .catch(function (err) {
        console.error('Failed to load footer:', err);
      });
  }

  // Run on DOMContentLoaded so pages that include this script late still work
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadFooter);
  } else {
    loadFooter();
  }
})();

