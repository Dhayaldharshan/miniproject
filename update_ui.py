import os

def update_index_files():
    files = ['frontend/index.html', 'index.html']
    
    old_block = """                    <div class="auth-form-group">
                        <label class="auth-form-label" for="authSignInEmail">Admin ID or Email Address</label>
                        <input type="text" id="authSignInEmail" name="authSignInEmail" class="auth-input" placeholder="e.g. admin@crisis-sync.gov or usr-admin-01" autocomplete="username" spellcheck="false" required>
                        <div id="errorSignInEmail" class="auth-field-error">Please enter your Admin ID or email address.</div>
                    </div>"""

    new_block = """                    <div class="auth-form-group">
                        <label class="auth-form-label" for="authSignInEmail">Email Address or User ID</label>
                        <input type="text" id="authSignInEmail" name="authSignInEmail" class="auth-input" placeholder="e.g. admin@crisis-sync.gov, coordinator@crisis-sync.gov, citizen@crisis-sync.gov" autocomplete="username" spellcheck="false" required>
                        <div id="errorSignInEmail" class="auth-field-error">Please enter your email address or User ID.</div>
                    </div>"""

    old_btn = """                    <button type="submit" id="authSignInBtn" class="auth-submit-btn">
                        <span id="signInBtnText">Sign In</span>
                    </button>"""

    new_btn = """                    <button type="submit" id="authSignInBtn" class="auth-submit-btn">
                        <span id="signInBtnText">Sign In</span>
                    </button>

                    <!-- Verified Quick-Fill Credentials For Easy Role Testing -->
                    <div class="auth-demo-accounts">
                        <div class="auth-demo-header">Verified System Test Accounts (Click to Fill):</div>
                        <div class="auth-demo-grid">
                            <button type="button" class="auth-demo-chip" data-role="ADMIN" data-email="admin@crisis-sync.gov" data-password="Admin@123" title="Click to fill Admin credentials">
                                <span class="chip-badge admin">ADMIN</span>
                                <span class="chip-email">admin@crisis-sync.gov</span>
                            </button>
                            <button type="button" class="auth-demo-chip" data-role="COORDINATOR" data-email="coordinator@crisis-sync.gov" data-password="Coordinator@123" title="Click to fill Coordinator credentials">
                                <span class="chip-badge coordinator">COORDINATOR</span>
                                <span class="chip-email">coordinator@crisis-sync.gov</span>
                            </button>
                            <button type="button" class="auth-demo-chip" data-role="PUBLIC" data-email="citizen@crisis-sync.gov" data-password="Citizen@123" title="Click to fill Public credentials">
                                <span class="chip-badge public">PUBLIC</span>
                                <span class="chip-email">citizen@crisis-sync.gov</span>
                            </button>
                        </div>
                    </div>"""

    for fpath in files:
        if not os.path.exists(fpath):
            continue
        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # normalize line endings for replacement
        content = content.replace(old_block, new_block)
        content = content.replace(old_btn, new_btn)
        
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {fpath}")

update_index_files()

