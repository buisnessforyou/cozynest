/* Cookie Consent — shared across all pages (PECR / UK GDPR compliant) */
(function() {
  // Inject modal HTML if not already present
  if (document.getElementById('cookieModal')) return;

  var modalHTML = '<div id="cookieModal" style="display:none;position:fixed;inset:0;z-index:4000;background:rgba(30,20,10,.52);backdrop-filter:blur(4px);align-items:center;justify-content:center;padding:24px;">'
    + '<div style="background:#FAF7F2;border-radius:10px;max-width:520px;width:100%;box-shadow:0 24px 80px rgba(30,20,10,.22);overflow:hidden;">'
    + '<div style="background:#2C1A0E;padding:28px 36px;">'
    + '<p style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#C4785A;margin-bottom:10px;">Your privacy</p>'
    + '<h2 style="font-family:\'Cormorant Garamond\',serif;font-size:1.6rem;font-weight:300;color:#FAF7F2;line-height:1.2;">Cookie Preferences</h2>'
    + '</div>'
    + '<div style="padding:28px 36px;">'
    + '<p style="font-size:14px;color:#4A3728;line-height:1.75;margin-bottom:24px;">We use cookies to improve your browsing experience, personalise content, and help us understand how people use our site \u2014 so we can keep making it better for you. For full details, see our <a href="/privacy.html#cookies" style="color:#C4785A;">Cookie Policy</a>.</p>'
    + '<div style="display:flex;flex-direction:column;gap:16px;margin-bottom:28px;">'
    + '<label style="display:flex;align-items:flex-start;gap:14px;padding:16px;background:#F5F0E8;border:1px solid #EDE5D8;border-radius:8px;cursor:default;">'
    + '<input type="checkbox" checked disabled style="margin-top:3px;accent-color:#C4785A;flex-shrink:0;">'
    + '<div><div style="font-size:13px;font-weight:500;color:#2C1A0E;margin-bottom:3px;">Essential cookies <span style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#8A7A6E;margin-left:6px;">Always on</span></div>'
    + '<div style="font-size:12px;color:#8A7A6E;line-height:1.5;">Required for the site to function — cart, checkout, and security.</div></div></label>'
    + '<label style="display:flex;align-items:flex-start;gap:14px;padding:16px;background:#F5F0E8;border:1px solid #EDE5D8;border-radius:8px;cursor:pointer;">'
    + '<input type="checkbox" id="cookieAnalytics" style="margin-top:3px;accent-color:#C4785A;flex-shrink:0;">'
    + '<div><div style="font-size:13px;font-weight:500;color:#2C1A0E;margin-bottom:3px;">Analytics cookies</div>'
    + '<div style="font-size:12px;color:#8A7A6E;line-height:1.5;">Help us understand which pages are most popular so we can improve your experience.</div></div></label>'
    + '<label style="display:flex;align-items:flex-start;gap:14px;padding:16px;background:#F5F0E8;border:1px solid #EDE5D8;border-radius:8px;cursor:pointer;">'
    + '<input type="checkbox" id="cookiePersonalisation" style="margin-top:3px;accent-color:#C4785A;flex-shrink:0;">'
    + '<div><div style="font-size:13px;font-weight:500;color:#2C1A0E;margin-bottom:3px;">Personalisation cookies</div>'
    + '<div style="font-size:12px;color:#8A7A6E;line-height:1.5;">Allow us to remember your preferences and tailor product selections to your taste.</div></div></label>'
    + '</div>'
    + '<div style="display:flex;gap:10px;flex-wrap:wrap;">'
    + '<button id="cookieAcceptAllBtn" style="flex:1;padding:13px;background:#C4785A;color:#FAF7F2;border:none;border-radius:2px;cursor:pointer;font-family:\'DM Sans\',sans-serif;font-size:11px;letter-spacing:.14em;text-transform:uppercase;">Accept all</button>'
    + '<button id="cookieSaveBtn" style="flex:1;padding:13px;background:#2C1A0E;color:#FAF7F2;border:none;border-radius:2px;cursor:pointer;font-family:\'DM Sans\',sans-serif;font-size:11px;letter-spacing:.14em;text-transform:uppercase;">Save preferences</button>'
    + '<button id="cookieRejectBtn" style="padding:13px 20px;background:none;color:#4A3728;border:1px solid #EDE5D8;border-radius:2px;cursor:pointer;font-family:\'DM Sans\',sans-serif;font-size:11px;letter-spacing:.12em;text-transform:uppercase;">Essential only</button>'
    + '</div></div></div></div>';

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  var modal = document.getElementById('cookieModal');
  var acceptAllBtn = document.getElementById('cookieAcceptAllBtn');
  var saveBtn = document.getElementById('cookieSaveBtn');
  var rejectBtn = document.getElementById('cookieRejectBtn');

  function openCookieModal(isAutoShow) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    if (isAutoShow) {
      document.getElementById('cookieAnalytics').checked = false;
      document.getElementById('cookiePersonalisation').checked = false;
    } else {
      var prefs = JSON.parse(localStorage.getItem('snugspot_cookies') || '{}');
      document.getElementById('cookieAnalytics').checked = prefs.analytics !== false;
      document.getElementById('cookiePersonalisation').checked = prefs.personalisation !== false;
    }
  }

  function closeCookieModal() {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }

  // Footer "Cookie Preferences" link
  var link = document.getElementById('cookiePrefLink');
  if (link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      openCookieModal(false);
    });
  }

  function updateGtagConsent(analytics) {
    if (typeof gtag === 'function') {
      gtag('consent', 'update', { analytics_storage: analytics ? 'granted' : 'denied' });
    }
  }

  acceptAllBtn.addEventListener('click', function() {
    localStorage.setItem('snugspot_cookies', JSON.stringify({ analytics: true, personalisation: true }));
    updateGtagConsent(true);
    closeCookieModal();
  });

  saveBtn.addEventListener('click', function() {
    var a = document.getElementById('cookieAnalytics').checked;
    localStorage.setItem('snugspot_cookies', JSON.stringify({
      analytics: a,
      personalisation: document.getElementById('cookiePersonalisation').checked
    }));
    updateGtagConsent(a);
    closeCookieModal();
  });

  rejectBtn.addEventListener('click', function() {
    localStorage.setItem('snugspot_cookies', JSON.stringify({ analytics: false, personalisation: false }));
    updateGtagConsent(false);
    closeCookieModal();
  });

  // Auto-show on first visit if no cookie choice has been made
  if (localStorage.getItem('snugspot_cookies') === null) {
    openCookieModal(true);
  }
})();
