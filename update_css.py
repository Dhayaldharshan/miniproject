import os

demo_css = """
/* Quick-Fill Verified Test Accounts */
.auth-demo-accounts {
    margin-top: 16px;
    padding: 12px 14px;
    background: #1D2028;
    border: 1px dashed #3A3F4E;
    border-radius: 8px;
}

.auth-demo-header {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: #9EA3B0;
    margin-bottom: 8px;
}

.auth-demo-grid {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.auth-demo-chip {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 7px 10px;
    background: #252832;
    border: 1px solid #323644;
    border-radius: 6px;
    color: #E2E8F0;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
    width: 100%;
    box-sizing: border-box;
}

.auth-demo-chip:hover {
    background: #2A2E3A;
    border-color: #DC3545;
    transform: translateX(2px);
}

.chip-badge {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    padding: 2px 6px;
    border-radius: 4px;
    letter-spacing: 0.5px;
}

.chip-badge.admin {
    background: rgba(220, 53, 69, 0.2);
    color: #FF6B7B;
    border: 1px solid rgba(220, 53, 69, 0.4);
}

.chip-badge.coordinator {
    background: rgba(14, 165, 233, 0.2);
    color: #38BDF8;
    border: 1px solid rgba(14, 165, 233, 0.4);
}

.chip-badge.public {
    background: rgba(40, 167, 69, 0.2);
    color: #4ADE80;
    border: 1px solid rgba(40, 167, 69, 0.4);
}

.chip-email {
    font-family: monospace;
    font-size: 11px;
    color: #CBD5E1;
}
"""

for path in ['frontend/style.css', 'style.css']:
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        target = "/* ==========================================================================\n   15. RESPONSIVE ADAPTATIONS"
        if target in content and ".auth-demo-accounts" not in content:
            content = content.replace(target, demo_css + "\n" + target)
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated {path}")
        else:
            print(f"Target not found or already updated in {path}")

