// Check if on login page or call page
const isLoginPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
const isCallPage = window.location.pathname.endsWith('call.html');

if (isLoginPage) {
    // Login page logic
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (email.includes('@netsurfdirect.com') && password === 'Invorto2025') {
            localStorage.setItem('loggedIn', 'true');
            window.location.href = 'call.html';
        } else {
            errorMessage.textContent = 'Invalid email or password. Only @netsurfdirect.com emails are allowed.';
        }
    });
} else if (isCallPage) {
    // Check if logged in
    if (!localStorage.getItem('loggedIn')) {
        window.location.href = 'index.html';
    }

    // Call page logic
    const callForm = document.getElementById('callForm');
    const messageDiv = document.getElementById('message');
    const signoutBtn = document.getElementById('signoutBtn');

    callForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const phone = document.getElementById('phone').value;

        // Additional validation: exactly 10 digits
        if (phone.length !== 10 || !/^\d{10}$/.test(phone)) {
            messageDiv.textContent = 'Please enter exactly 10 digits.';
            messageDiv.style.color = 'red';
            return;
        }

        // Send to webhook
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
                messageDiv.textContent = 'Call initiated successfully.';
                messageDiv.style.color = 'green';
            } else {
                throw new Error('Webhook failed');
            }
        })
        .catch(error => {
            messageDiv.textContent = 'Servers are busy. Please try again later.';
            messageDiv.style.color = 'red';
        });
    });

    signoutBtn.addEventListener('click', function() {
        localStorage.removeItem('loggedIn');
        window.location.href = 'index.html';
    });
}