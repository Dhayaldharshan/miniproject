const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'frontend', 'app.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add elements mapping
const targetElements = `        errorPublicRegionName: document.getElementById('errorPublicRegionName'),`;
const newElements = `        errorPublicRegionName: document.getElementById('errorPublicRegionName'),
        // Public Assistance Resource Cards & Quantities
        assistFoodCheck: document.getElementById('assistFoodCheck'),
        assistMedCheck: document.getElementById('assistMedCheck'),
        assistTeamsCheck: document.getElementById('assistTeamsCheck'),
        assistSheltersCheck: document.getElementById('assistSheltersCheck'),
        assistanceItemFood: document.getElementById('assistanceItemFood'),
        assistanceItemMed: document.getElementById('assistanceItemMed'),
        assistanceItemTeams: document.getElementById('assistanceItemTeams'),
        assistanceItemShelters: document.getElementById('assistanceItemShelters'),
        qtyContainerFood: document.getElementById('qtyContainerFood'),
        qtyContainerMed: document.getElementById('qtyContainerMed'),
        qtyContainerTeams: document.getElementById('qtyContainerTeams'),
        qtyContainerShelters: document.getElementById('qtyContainerShelters'),
        qtyFoodInput: document.getElementById('qtyFoodInput'),
        qtyMedInput: document.getElementById('qtyMedInput'),
        qtyTeamsInput: document.getElementById('qtyTeamsInput'),
        qtySheltersInput: document.getElementById('qtySheltersInput'),
        errorQtyFood: document.getElementById('errorQtyFood'),
        errorQtyMed: document.getElementById('errorQtyMed'),
        errorQtyTeams: document.getElementById('errorQtyTeams'),
        errorQtyShelters: document.getElementById('errorQtyShelters'),`;

if (!content.includes(targetElements)) {
    console.error('Target elements string not found!');
    process.exit(1);
}
content = content.replace(targetElements, newElements);

// 2. Replace the Public Emergency Incident Report Form block
const startMarker = `    // ==========================================================================\n    // PUBLIC EMERGENCY INCIDENT REPORT FORM SUBMISSION\n    // ==========================================================================`;
const endMarker = `    // Boot Session on startup`;

// Support both CRLF and LF
const startRegex = /\/\/\s*={10,}\s*\r?\n\s*\/\/\s*PUBLIC EMERGENCY INCIDENT REPORT FORM SUBMISSION\s*\r?\n\s*\/\/\s*={10,}/;
const endRegex = /\/\/\s*Boot Session on startup/;

const startMatch = content.match(startRegex);
const endMatch = content.match(endRegex);

if (!startMatch || !endMatch) {
    console.error('Could not find start or end markers for public report block');
    process.exit(1);
}

const startIndex = startMatch.index;
const endIndex = endMatch.index;

const newPublicReportBlock = `    // ==========================================================================
    // PUBLIC EMERGENCY INCIDENT REPORT FORM & ASSISTANCE QUANTITIES
    // ==========================================================================
    const assistanceConfigs = [
        {
            key: 'FOOD',
            name: 'Food Relief Kits',
            unit: 'kits',
            check: elements.assistFoodCheck,
            item: elements.assistanceItemFood,
            container: elements.qtyContainerFood,
            input: elements.qtyFoodInput,
            error: elements.errorQtyFood
        },
        {
            key: 'MEDICAL',
            name: 'Medical Relief Kits',
            unit: 'kits',
            check: elements.assistMedCheck,
            item: elements.assistanceItemMed,
            container: elements.qtyContainerMed,
            input: elements.qtyMedInput,
            error: elements.errorQtyMed
        },
        {
            key: 'TEAMS',
            name: 'Rescue Teams',
            unit: 'teams',
            check: elements.assistTeamsCheck,
            item: elements.assistanceItemTeams,
            container: elements.qtyContainerTeams,
            input: elements.qtyTeamsInput,
            error: elements.errorQtyTeams
        },
        {
            key: 'SHELTERS',
            name: 'Shelters',
            unit: 'people',
            check: elements.assistSheltersCheck,
            item: elements.assistanceItemShelters,
            container: elements.qtyContainerShelters,
            input: elements.qtySheltersInput,
            error: elements.errorQtyShelters
        }
    ];

    function resetAssistanceQuantities() {
        assistanceConfigs.forEach(cfg => {
            if (cfg.check) cfg.check.checked = false;
            if (cfg.container) cfg.container.style.display = 'none';
            if (cfg.item) cfg.item.classList.remove('is-selected');
            if (cfg.input) {
                cfg.input.value = '';
                cfg.input.classList.remove('input-invalid');
            }
            if (cfg.error) cfg.error.style.display = 'none';
        });
    }

    // Bind change listeners to toggle quantity inputs
    assistanceConfigs.forEach(cfg => {
        if (cfg.check) {
            cfg.check.addEventListener('change', () => {
                if (cfg.check.checked) {
                    if (cfg.container) cfg.container.style.display = 'block';
                    if (cfg.item) cfg.item.classList.add('is-selected');
                    if (cfg.input) {
                        cfg.input.focus();
                    }
                } else {
                    if (cfg.container) cfg.container.style.display = 'none';
                    if (cfg.item) cfg.item.classList.remove('is-selected');
                    if (cfg.input) {
                        cfg.input.value = '';
                        cfg.input.classList.remove('input-invalid');
                    }
                    if (cfg.error) cfg.error.style.display = 'none';
                }
            });
        }

        if (cfg.input) {
            cfg.input.addEventListener('input', () => {
                const val = cfg.input.value.trim();
                const num = Number(val);
                if (val !== '' && !isNaN(num) && Number.isInteger(num) && num > 0) {
                    cfg.input.classList.remove('input-invalid');
                    if (cfg.error) cfg.error.style.display = 'none';
                }
            });
        }
    });

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

            // Validate quantities for each selected resource
            let hasValidationError = false;
            let firstInvalidInput = null;

            assistanceConfigs.forEach(cfg => {
                if (cfg.check && cfg.check.checked) {
                    const val = cfg.input ? cfg.input.value.trim() : '';
                    const num = Number(val);
                    if (!val || isNaN(num) || !Number.isInteger(num) || num <= 0) {
                        hasValidationError = true;
                        if (cfg.input) cfg.input.classList.add('input-invalid');
                        if (cfg.error) {
                            cfg.error.textContent = \`Please enter a positive whole number (min 1) for \${cfg.name}.\`;
                            cfg.error.style.display = 'block';
                        }
                        if (!firstInvalidInput && cfg.input) {
                            firstInvalidInput = cfg.input;
                        }
                    } else {
                        if (cfg.input) cfg.input.classList.remove('input-invalid');
                        if (cfg.error) cfg.error.style.display = 'none';
                    }
                } else {
                    if (cfg.error) cfg.error.style.display = 'none';
                    if (cfg.input) cfg.input.classList.remove('input-invalid');
                }
            });

            if (hasValidationError) {
                if (firstInvalidInput) {
                    firstInvalidInput.focus();
                }
                return;
            }

            // Collect selected assistance keys
            const assistance = [];
            assistanceConfigs.forEach(cfg => {
                if (cfg.check && cfg.check.checked) {
                    assistance.push(cfg.key);
                }
            });

            // Collect exact quantities
            const foodQuantity = (elements.assistFoodCheck && elements.assistFoodCheck.checked && elements.qtyFoodInput)
                ? parseInt(elements.qtyFoodInput.value.trim(), 10) : 0;
            const medicineQuantity = (elements.assistMedCheck && elements.assistMedCheck.checked && elements.qtyMedInput)
                ? parseInt(elements.qtyMedInput.value.trim(), 10) : 0;
            const rescueTeamsQuantity = (elements.assistTeamsCheck && elements.assistTeamsCheck.checked && elements.qtyTeamsInput)
                ? parseInt(elements.qtyTeamsInput.value.trim(), 10) : 0;
            const shelterPeopleQuantity = (elements.assistSheltersCheck && elements.assistSheltersCheck.checked && elements.qtySheltersInput)
                ? parseInt(elements.qtySheltersInput.value.trim(), 10) : 0;

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
                    requiredAssistance: assistance,
                    foodQuantity,
                    medicineQuantity,
                    rescueTeamsQuantity,
                    shelterPeopleQuantity
                });

                // Show success only after backend confirms successful saving
                if (elements.publicReportSuccessBox) {
                    const assistanceDetailsList = [];
                    if (foodQuantity > 0) assistanceDetailsList.push(\`Food Relief Kits (\${foodQuantity.toLocaleString()} kits)\`);
                    if (medicineQuantity > 0) assistanceDetailsList.push(\`Medical Relief Kits (\${medicineQuantity.toLocaleString()} kits)\`);
                    if (rescueTeamsQuantity > 0) assistanceDetailsList.push(\`Rescue Teams (\${rescueTeamsQuantity.toLocaleString()} teams)\`);
                    if (shelterPeopleQuantity > 0) assistanceDetailsList.push(\`Shelters (\${shelterPeopleQuantity.toLocaleString()} people)\`);

                    const selectedLabels = assistanceDetailsList.length > 0
                        ? assistanceDetailsList.join(', ')
                        : (assistance.length > 0 ? assistance.join(', ') : 'General Monitoring (No immediate supplies)');

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
                resetAssistanceQuantities();
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
            resetAssistanceQuantities();
            if (elements.publicRegionName) elements.publicRegionName.focus();
        });
    }

    if (elements.publicRegionName) {
        elements.publicRegionName.addEventListener('input', () => {
            if (elements.errorPublicRegionName) elements.errorPublicRegionName.style.display = 'none';
        });
    }

    `;

content = content.substring(0, startIndex) + newPublicReportBlock + content.substring(endIndex);

// Normalize to CRLF as in original file
content = content.replace(/\r?\n/g, '\r\n');

fs.writeFileSync(filePath, content, 'utf8');
const rootAppPath = path.join(__dirname, '..', 'app.js');
fs.writeFileSync(rootAppPath, content, 'utf8');
console.log('Successfully updated frontend/app.js and root app.js!');

