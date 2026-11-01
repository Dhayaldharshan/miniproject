const fs = require('fs');

const formListenersCode = `
    // ==========================================================================
    // PUBLIC EMERGENCY INCIDENT REPORT FORM SUBMISSION
    // ==========================================================================
    if (elements.publicReportForm) {
        elements.publicReportForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (elements.publicReportErrorBox) elements.publicReportErrorBox.style.display = 'none';
            if (elements.publicReportSuccessBox) elements.publicReportSuccessBox.style.display = 'none';
            if (elements.errorPublicRegionName) elements.errorPublicRegionName.style.display = 'none';

            const regionName = elements.publicRegionName ? elements.publicRegionName.value.trim() : '';
            if (!regionName) {
                if (elements.errorPublicRegionName) elements.errorPublicRegionName.style.display = 'block';
                if (elements.publicRegionName) elements.publicRegionName.focus();
                return;
            }

            const disasterType = elements.publicDisasterType ? elements.publicDisasterType.value : 'Flood';
            const severity = elements.publicSeverity ? parseInt(elements.publicSeverity.value, 10) : 3;
            const population = (elements.publicPopulation && elements.publicPopulation.value.trim() !== '') 
                ? parseInt(elements.publicPopulation.value.trim(), 10) : 0;
            const accessible = elements.publicAccessibility ? (elements.publicAccessibility.value === 'true') : true;
            const description = elements.publicDescription ? elements.publicDescription.value.trim() : '';

            // Collect selected assistance checkboxes
            const assistance = [];
            const checkboxes = elements.publicReportForm.querySelectorAll('input[name="publicAssistance"]:checked');
            checkboxes.forEach(cb => assistance.push(cb.value));

            // Loading state
            if (elements.publicSubmitBtnText) {
                elements.publicSubmitBtnText.innerHTML = '<span class="spinner" style="margin-right: 8px;"></span> Submitting Report...';
            }
            if (elements.publicSubmitBtn) elements.publicSubmitBtn.disabled = true;

            try {
                const response = await ResqApi.submitPublicReport({
                    regionName,
                    disasterType,
                    severity,
                    population,
                    accessible,
                    description,
                    requiredAssistance: assistance
                });

                // Show success only after backend confirms successful saving
                if (elements.publicReportSuccessBox) {
                    const assistanceNames = {
                        FOOD: 'Food Relief Kits',
                        MEDICAL: 'Medical Relief Kits',
                        TEAMS: 'Rescue Teams',
                        SHELTERS: 'Shelters'
                    };
                    const selectedLabels = assistance.map(k => assistanceNames[k] || k).join(', ') || 'General Monitoring (No immediate supplies)';
                    const details = '<strong>Assigned Region #' + response.regionId + ':</strong> ' + escapeHtml(response.regionName) +
                        ' | <strong>Disaster:</strong> ' + escapeHtml(response.disasterType || disasterType) +
                        ' | <strong>Severity Level:</strong> ' + response.severity + '/5' +
                        ' | <strong>Road Access:</strong> ' + (response.accessible ? 'Open' : 'Blocked') +
                        ' | <strong>Required Assistance:</strong> ' + escapeHtml(selectedLabels) +
                        '. Field Coordinators & Incident Command have received this alert.';
                    
                    if (elements.publicSuccessDetails) {
                        elements.publicSuccessDetails.innerHTML = details;
                    }
                    elements.publicReportSuccessBox.style.display = 'flex';
                }

                // Reset form
                elements.publicReportForm.reset();
                if (elements.publicDisasterType) elements.publicDisasterType.value = 'Flood';
                if (elements.publicSeverity) elements.publicSeverity.value = '4';
                if (elements.publicAccessibility) elements.publicAccessibility.value = 'true';

                showToast('Emergency incident report #' + response.regionId + ' submitted successfully.');
            } catch (err) {
                console.error('Failed to submit public report:', err);
                if (elements.publicReportErrorBox) {
                    if (elements.publicReportErrorMessage) {
                        elements.publicReportErrorMessage.textContent = err.message === 'BACKEND_OFFLINE'
                            ? 'Unable to submit report: Backend service is currently offline. Please ensure the server is running on port 8080.'
                            : (err.message || 'Failed to submit report. Please check input parameters and try again.');
                    }
                    elements.publicReportErrorBox.style.display = 'flex';
                }
            } finally {
                if (elements.publicSubmitBtnText) {
                    elements.publicSubmitBtnText.textContent = 'Submit Emergency Report';
                }
                if (elements.publicSubmitBtn) elements.publicSubmitBtn.disabled = false;
            }
        });
    }

    if (elements.publicReportNewBtn) {
        elements.publicReportNewBtn.addEventListener('click', () => {
            if (elements.publicReportSuccessBox) elements.publicReportSuccessBox.style.display = 'none';
            if (elements.publicRegionName) elements.publicRegionName.focus();
        });
    }

    if (elements.publicRegionName) {
        elements.publicRegionName.addEventListener('input', () => {
            if (elements.errorPublicRegionName) elements.errorPublicRegionName.style.display = 'none';
        });
    }
`;

function injectListeners(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('PUBLIC EMERGENCY INCIDENT REPORT FORM SUBMISSION')) {
        const marker = '// Boot Session on startup';
        content = content.replace(marker, formListenersCode + '\n    ' + marker);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Injected public report listeners into ${filePath}`);
    } else {
        console.log(`Listeners already present in ${filePath}`);
    }
}

injectListeners('frontend/app.js');
injectListeners('app.js');

