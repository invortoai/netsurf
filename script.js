/**
* Page detection is DOM-based to work reliably on GitHub Pages project paths.
* No logic relies on window.location.pathname.
*/

// Detect pages by presence of key elements
const loginForm = document.getElementById('loginForm');
const callForm = document.getElementById('callForm');

// -------------------- Login Page Logic --------------------
if (loginForm) {
   const emailInput = document.getElementById('email');
   const passwordInput = document.getElementById('password');
   const errorMessage = document.getElementById('errorMessage');

   // Defensive: ensure required inputs exist
   if (!emailInput || !passwordInput) {
       // Cannot proceed without required inputs
   } else {
       // Helper to handle login attempts consistently (manual or auto)
       const handleLoginAttempt = (emailRaw, passwordRaw) => {
           const email = (emailRaw || '').trim();
           const password = (passwordRaw || '').trim();
           const valid =
               email.toLowerCase().endsWith('@netsurfdirect.com') &&
               password === 'Invorto2025';

           if (valid) {
               localStorage.setItem('loggedIn', 'true');
               // Relative redirect works on GitHub Pages under /netsurf/
               window.location.href = 'call.html';
               return;
           }

           if (errorMessage) {
               errorMessage.textContent = 'Invalid email or password. Only @netsurfdirect.com emails are allowed.';
           }
       };

       // Attach submit listener unconditionally
       loginForm.addEventListener('submit', (e) => {
           e.preventDefault();
           handleLoginAttempt(emailInput.value, passwordInput.value);
       });

       // Auto-login via URL params: ?email=...&password=...
       try {
           const urlParams = new URLSearchParams(window.location.search);
           const emailParam = urlParams.get('email');
           const passwordParam = urlParams.get('password');

           if (emailParam && passwordParam) {
               emailInput.value = emailParam;
               passwordInput.value = passwordParam;
               // Run same validation/redirect logic (do NOT call form.submit())
               handleLoginAttempt(emailParam, passwordParam);
           }
       } catch (_) {
           // Ignore URL parsing issues gracefully
       }
   }
}

// -------------------- Call Page Logic --------------------
if (callForm) {
   // Guard: must be logged in
   if (localStorage.getItem('loggedIn') !== 'true') {
       window.location.href = 'index.html';
       // Stop further execution on this page
   } else {
       const messageDiv = document.getElementById('message');
       const signoutBtn = document.getElementById('signoutBtn');
       const phoneInput = document.getElementById('phone');

       // Hardened auth checks to defeat back/forward cache
       const ensureAuth = () => {
           if (localStorage.getItem('loggedIn') !== 'true') {
               window.location.replace('index.html');
           }
       };
       // Keep URL stable without adding new history entries
       try { history.replaceState(null, '', 'call.html'); } catch (e) {}
       // Re-run auth check when page is restored or becomes visible
       window.addEventListener('pageshow', ensureAuth);
       document.addEventListener('visibilitychange', () => {
           if (document.visibilityState === 'visible') ensureAuth();
       });

       // Defensive: ensure form and phone input exist
       if (callForm && phoneInput) {
           callForm.addEventListener('submit', function (e) {
               e.preventDefault();
               const phone = (phoneInput.value || '').trim();

               // Additional validation: exactly 10 digits
               if (phone.length !== 10 || !/^\d{10}$/.test(phone)) {
                   if (messageDiv) {
                       messageDiv.textContent = 'Please enter exactly 10 digits.';
                       messageDiv.style.color = 'red';
                   }
                   return;
               }

               // Send to webhook (unchanged)
               const payload = {
                   "number": phone,
                   "call_attempted": "No",
                   "PCAP": "netsurf"
               };

               fetch('https://n8n.srv743759.hstgr.cloud/webhook/netsurf', {
                   method: 'POST',
                   headers: {
                       'Content-Type': 'application/json'
                   },
                   body: JSON.stringify(payload)
               })
               .then(response => {
                   if (response.ok) {
                       if (messageDiv) {
                           messageDiv.textContent = 'Call initiated successfully.';
                           messageDiv.style.color = 'green';
                       }
                   } else {
                       throw new Error('Webhook failed');
                   }
               })
               .catch(() => {
                   if (messageDiv) {
                       messageDiv.textContent = 'Servers are busy. Please try again later.';
                       messageDiv.style.color = 'red';
                   }
               });
           });
       }

       if (signoutBtn) {
           signoutBtn.addEventListener('click', function () {
               localStorage.removeItem('loggedIn');
               // Use replace so protected page isn't kept in history
               window.location.replace('index.html');
           });
       }
   }
}