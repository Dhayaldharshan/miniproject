import os

def update_app_js():
    files = ['frontend/app.js', 'app.js']

    old_input_listener = """    if (elements.authSignInEmail) {
        elements.authSignInEmail.addEventListener('input', () => clearFieldError(elements.authSignInEmail, elements.errorSignInEmail));
    }"""

    new_input_listener = """    if (elements.authSignInEmail) {
        elements.authSignInEmail.addEventListener('input', () => {
            clearFieldError(elements.authSignInEmail, elements.errorSignInEmail);
            const val = elements.authSignInEmail.value.trim().toLowerCase();
            if (elements.authSignInAccountType) {
                if (val.includes('coord') || val.includes('officer')) {
                    elements.authSignInAccountType.value = 'COORDINATOR';
                } else if (val.includes('citizen') || val.includes('public') || val.includes('volunteer')) {
                    elements.authSignInAccountType.value = 'PUBLIC';
                } else if (val.includes('admin') || val.includes('commander')) {
                    elements.authSignInAccountType.value = 'ADMIN';
                }
            }
        });
    }

    // Quick-Fill Demo / Test Credentials Handlers
    document.querySelectorAll('.auth-demo-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const email = chip.dataset.email;
            const password = chip.dataset.password;
            const role = chip.dataset.role;

            clearAllAuthErrors();
            if (elements.authSignInEmail) {
                elements.authSignInEmail.value = email;
            }
            if (elements.authSignInPassword) {
                elements.authSignInPassword.value = password;
            }
            if (elements.authSignInAccountType && role) {
                elements.authSignInAccountType.value = role;
            }
        });
    });"""

    old_catch = """            } catch (error) {
                if (error.message === 'BACKEND_OFFLINE' || error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
                    showAuthAlert('Unable to connect to backend service. Please ensure server is running on port 8080.', 'error');
                } else {
                    showAuthAlert(error.message, 'error');
                }
            }"""

    new_catch = """            } catch (error) {
                if (error.message === 'BACKEND_OFFLINE' || error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
                    showAuthAlert('Unable to connect to backend service. Please ensure server is running on port 8080.', 'error');
                } else if (error.message.includes('Role mismatch') || error.message.includes('Selected account type')) {
                    const match = error.message.match(/authorized role \\(?'?([A-Za-z]+)'?\\)?/i) || error.message.match(/Authorized: ([A-Za-z]+)/i);
                    if (match && match[1] && elements.authSignInAccountType) {
                        const targetRole = match[1].toUpperCase();
                        elements.authSignInAccountType.value = targetRole;
                        showAuthAlert(`Account has ${targetRole} clearance. We've switched Account Type to ${targetRole} for you. Click Sign In to proceed.`, 'info');
                    } else {
                        showAuthAlert(error.message, 'error');
                    }
                } else {
                    showAuthAlert(error.message, 'error');
                }
            }"""

    for path in files:
        if not os.path.exists(path):
            continue
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()

        if old_input_listener in content:
            content = content.replace(old_input_listener, new_input_listener)
        if old_catch in content:
            content = content.replace(old_catch, new_catch)

        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {path}")

update_app_js()

