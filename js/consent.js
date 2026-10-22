/**
 * Analytics consent for stoll.studio sites
 *
 * Analytics only load after an explicit "yes". The site defines
 * window.loadAnalytics() (its own IDs) and renders the bar markup:
 *
 *   <div class="consent-bar" data-consent-bar hidden> ...
 *     <button data-consent="denied">  <button data-consent="granted">
 *   </div>
 *   <a href="#" data-consent-open>Cookie settings</a>   (reopens the bar)
 *
 * The choice is kept in localStorage under "consent-analytics".
 */
(function() {
  'use strict';

  var KEY = 'consent-analytics';
  var COOKIE_PATTERN = /^(_ga|_gid|_gat|_clck|_clsk|CLID|ANONCHK|MR|MUID|SM)/;

  function getChoice() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function setChoice(value) {
    try { localStorage.setItem(KEY, value); } catch (e) {}
  }

  // Remove first-party analytics cookies on every domain level they may be set on
  function clearAnalyticsCookies() {
    var parts = location.hostname.split('.');
    var domains = [''];
    for (var i = 0; i < parts.length - 1; i++) {
      domains.push('; domain=.' + parts.slice(i).join('.'));
    }
    var cookies = document.cookie.split(';');
    for (var c = 0; c < cookies.length; c++) {
      var name = cookies[c].split('=')[0].trim();
      if (!COOKIE_PATTERN.test(name)) continue;
      for (var d = 0; d < domains.length; d++) {
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + domains[d];
      }
    }
  }

  function init() {
    var bar = document.querySelector('[data-consent-bar]');
    if (!bar) return;

    function show() {
      bar.hidden = false;
      document.body.style.paddingBottom = bar.offsetHeight + 'px';
    }

    function hide() {
      bar.hidden = true;
      document.body.style.paddingBottom = '';
    }

    document.addEventListener('click', function(e) {
      var target = e.target.closest ? e.target.closest('[data-consent], [data-consent-open]') : null;
      if (!target) return;

      if (target.hasAttribute('data-consent-open')) {
        e.preventDefault();
        show();
        return;
      }

      var choice = target.getAttribute('data-consent');
      var previous = getChoice();
      setChoice(choice);
      hide();

      if (choice === 'granted') {
        if (typeof window.loadAnalytics === 'function') window.loadAnalytics();
      } else {
        clearAnalyticsCookies();
        // Scripts already running can't be unloaded, so start clean
        if (previous === 'granted') location.reload();
      }
    });

    if (!getChoice()) show();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
