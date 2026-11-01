const fs = require('fs');

const cssToAdd = `
/* ==========================================================================
   PUBLIC EMERGENCY REPORTING PANEL (Graphite + Crimson)
   ========================================================================== */
.public-report-panel {
    max-width: 860px;
    margin: 0 auto 30px auto;
    background-color: #252832 !important;
    border: 1px solid #323644 !important;
    border-radius: var(--radius-md);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3) !important;
}

.public-report-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.form-row-2 {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
}

@media (max-width: 680px) {
    .form-row-2 {
        grid-template-columns: 1fr;
        gap: 14px;
    }
}

.required-star {
    color: #DC3545;
    font-weight: bold;
    margin-left: 2px;
}

.optional-tag, .form-hint {
    color: #9EA3B0;
    font-weight: normal;
    font-size: 12px;
    margin-left: 6px;
}

.form-textarea {
    min-height: 84px;
    resize: vertical;
    line-height: 1.5;
}

.assistance-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin-top: 6px;
}

@media (max-width: 680px) {
    .assistance-grid {
        grid-template-columns: 1fr;
    }
}

.assistance-card {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 16px;
    background-color: #1F222B;
    border: 1px solid #3A3F4E;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.18s ease;
    user-select: none;
}

.assistance-card:hover {
    border-color: rgba(220, 53, 69, 0.5);
    background-color: #242835;
}

.assistance-card:has(.assistance-checkbox:checked) {
    border-color: #DC3545;
    background: rgba(220, 53, 69, 0.12);
}

.assistance-checkbox {
    margin-top: 3px;
    accent-color: #DC3545;
    width: 18px;
    height: 18px;
    cursor: pointer;
    flex-shrink: 0;
}

.assistance-card-body {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.assistance-card-header {
    display: flex;
    align-items: center;
    gap: 8px;
}

.assistance-icon {
    font-size: 18px;
}

.assistance-title {
    font-weight: 600;
    font-size: 14px;
    color: #FFFFFF;
}

.assistance-desc {
    font-size: 12px;
    color: #9EA3B0;
    line-height: 1.4;
}

/* Visibility Control: When in Public Mode, hide Admin/Coordinator Panels completely */
.role-public .admin-coordinator-only-nav,
.role-public .coordinator-only-nav,
.role-public #view-dashboard,
.role-public #view-regions,
.role-public #view-requests,
.role-public #view-inventory,
.role-public #view-teams,
.role-public #view-shelters,
.role-public #view-roads,
.role-public .public-mode-banner {
    display: none !important;
}

.role-public #view-public-report {
    display: block !important;
}

.role-admin .public-only-nav,
.role-coordinator .public-only-nav,
.role-admin #view-public-report,
.role-coordinator #view-public-report {
    display: none !important;
}
`;

function appendCss(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('PUBLIC EMERGENCY REPORTING PANEL')) {
        content += '\n' + cssToAdd;
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Appended public report CSS to ${filePath}`);
    } else {
        console.log(`Public report CSS already present in ${filePath}`);
    }
}

appendCss('frontend/style.css');
appendCss('style.css');
console.log('CSS files updated successfully!');

