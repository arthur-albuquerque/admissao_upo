// App Logic for CTI Admission Form

// --- State Management & Autosave ---
const STORAGE_KEY = 'upo_admission_form_data';
const STORAGE_KEY_REAV = 'upo_reavaliacao_data';

function saveToLocal() {
    const data = {};

    // Helper to extract form data
    const extractFormData = (formId) => {
        const form = document.getElementById(formId);
        if (!form) return;
        const formData = new FormData(form);
        for (const [key, value] of formData.entries()) {
            if (data[key]) {
                if (!Array.isArray(data[key])) data[key] = [data[key]];
                data[key].push(value);
            } else {
                data[key] = value;
            }
        }
    };

    extractFormData('admissionForm');
    extractFormData('clinicalForm');

    // Separate logic for Reavaliacao
    const reavData = {};
    const extractReavData = () => {
        const form = document.getElementById('reavaliacaoForm');
        if (!form) return;
        const formData = new FormData(form);
        for (const [key, value] of formData.entries()) {
            if (reavData[key]) {
                if (!Array.isArray(reavData[key])) reavData[key] = [reavData[key]];
                reavData[key].push(value);
            } else {
                reavData[key] = value;
            }
        }
        reavData._last_saved = new Date().toISOString();
    };
    extractReavData();

    // Also save specific UI states that aren't inputs
    const checkClexane = document.getElementById('check_clexane');
    const negaAlergia = document.getElementById('nega_alergia');
    const imcDisplay = document.getElementById('imc_display');
    const checkTot = document.getElementById('check_tot');
    const checkPvp = document.getElementById('check_pvp');
    const checkPam = document.getElementById('check_pam');

    if (checkClexane) data._ui_clexane = checkClexane.checked;
    if (negaAlergia) data._ui_nega_alergia = negaAlergia.checked;
    if (imcDisplay) data._ui_imc = imcDisplay.textContent;
    if (checkTot) data._ui_tot = checkTot.checked;
    if (checkPvp) data._ui_pvp = checkPvp.checked;
    if (checkPam) data._ui_pam = checkPam.checked;

    // New UI States
    const clinNegaAlergia = document.getElementById('clin_nega_alergia');
    const clinNegaMeds = document.getElementById('clin_nega_meds');
    const surgNegaMeds = document.getElementById('surg_nega_meds');

    if (clinNegaAlergia) data._ui_clin_nega_alergia = clinNegaAlergia.checked;
    if (clinNegaMeds) data._ui_clin_nega_meds = clinNegaMeds.checked;
    if (surgNegaMeds) data._ui_surg_nega_meds = surgNegaMeds.checked;

    data._last_saved = new Date().toISOString();

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    localStorage.setItem(STORAGE_KEY_REAV, JSON.stringify(reavData));
}

function loadFromLocal() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
        const data = JSON.parse(raw);
        console.log('Restoring data from', data._last_saved);

        const forms = ['admissionForm', 'clinicalForm'];
        forms.forEach(formId => {
            const form = document.getElementById(formId);
            if (!form) return;

            Object.keys(data).forEach(key => {
                if (key.startsWith('_ui_')) return;

                const input = form.elements[key];
                if (!input) return;

                // Handle Checkboxes/Radios vs Text
                if (input instanceof RadioNodeList || (input.length > 1 && input[0].type !== 'select-one')) {
                    const values = Array.isArray(data[key]) ? data[key] : [data[key]];
                    Array.from(input).forEach(radio => {
                        if (values.includes(radio.value)) {
                            radio.checked = true;
                        }
                    });
                } else if (input.type === 'checkbox') {
                    input.checked = !!data[key];
                } else {
                    input.value = data[key];
                }
            });
        });

        // UI Specifics - Surgical
        if (data._ui_clexane) {
            const el = document.getElementById('check_clexane');
            if (el) {
                el.checked = true;
                toggleClexane(el);
            }
        }
        if (data._ui_nega_alergia) {
            const el = document.getElementById('nega_alergia');
            if (el) {
                el.checked = true;
                toggleAllergyInput(el);
            }
        }
        if (data._ui_imc) {
            const disp = document.getElementById('imc_display');
            if (disp) {
                disp.textContent = data._ui_imc;
                if (data._ui_imc !== '-') disp.classList.add('highlight');
            }
        }

        // UI Specifics - Clinical
        if (data._ui_tot) {
            const el = document.getElementById('check_tot');
            if (el) {
                el.checked = true;
                toggleVAD(el);
            }
        }
        if (data._ui_pvp) {
            const el = document.getElementById('check_pvp');
            if (el) {
                el.checked = true;
                toggleClinPVP(el);
            }
        }
        if (data._ui_pam) {
            const el = document.getElementById('check_pam');
            if (el) {
                el.checked = true;
                toggleClinPAM(el);
            }
        }

        if (data._ui_clin_nega_alergia) {
            const el = document.getElementById('clin_nega_alergia');
            if (el) {
                el.checked = true;
                toggleClinAllergy(el);
            }
        }
        if (data._ui_clin_nega_meds) {
            const el = document.getElementById('clin_nega_meds');
            if (el) {
                el.checked = true;
                toggleClinMeds(el);
            }
        }
        if (data._ui_surg_nega_meds) {
            const el = document.getElementById('surg_nega_meds');
            if (el) {
                el.checked = true;
                toggleSurgMeds(el);
            }
        }

        // Load Reavaliacao Data
        const rawReav = localStorage.getItem(STORAGE_KEY_REAV);
        if (rawReav) {
            try {
                const data = JSON.parse(rawReav);
                const form = document.getElementById('reavaliacaoForm');
                if (form) {
                    Object.keys(data).forEach(key => {
                        if (key.startsWith('_')) return;
                        const input = form.elements[key];
                        if (!input) return;

                        // Handle Checkboxes/Radios vs Text
                        if (input instanceof RadioNodeList || (input.length > 1 && input[0].type !== 'select-one')) {
                            const values = Array.isArray(data[key]) ? data[key] : [data[key]];
                            Array.from(input).forEach(radio => {
                                if (values.includes(radio.value)) {
                                    radio.checked = true;
                                }
                            });
                        } else if (input.type === 'checkbox') {
                            input.checked = !!data[key];
                        } else {
                            input.value = data[key];
                        }
                    });
                }
            } catch (e) {
                console.error('Error loading reav save', e);
            }
        }

    } catch (e) {
        console.error('Error loading save', e);
    }
}

// --- Clinical Specific ---
function toggleVAD(checkbox) {
    const vadDiv = document.getElementById('vad_selection');
    if (checkbox.checked) {
        vadDiv.classList.remove('hidden');
    } else {
        vadDiv.classList.add('hidden');
        document.getElementsByName('clin_vad').forEach(r => r.checked = false);
    }
}

function toggleClinPVP(checkbox) {
    const div = document.getElementById('clin_pvp_detail');
    if (checkbox.checked) {
        div.classList.remove('hidden');
    } else {
        div.classList.add('hidden');
        document.getElementById('clin_pvp_loc').value = '';
    }
}

function toggleClinPAM(checkbox) {
    const div = document.getElementById('clin_pam_detail');
    if (checkbox.checked) {
        div.classList.remove('hidden');
    } else {
        div.classList.add('hidden');
        document.getElementById('clin_pam_loc').value = '';
    }
}

function toggleClinDreno(checkbox) {
    const div = document.getElementById('clin_dreno_detail');
    if (checkbox.checked) {
        div.classList.remove('hidden');
    } else {
        div.classList.add('hidden');
        document.getElementById('clin_dreno_loc').value = '';
    }
}
function toggleSurgPVP(checkbox) {
    const el = document.getElementById('inv_pvp_loc');
    if (checkbox.checked) {
        el.classList.remove('hidden');
    } else {
        el.classList.add('hidden');
        el.value = '';
    }
}

function toggleSurgPAM(checkbox) {
    const el = document.getElementById('inv_pam_loc');
    if (checkbox.checked) {
        el.classList.remove('hidden');
    } else {
        el.classList.add('hidden');
        el.value = '';
    }
}

window.toggleVAD = toggleVAD;
window.toggleClinPVP = toggleClinPVP;
window.toggleClinPAM = toggleClinPAM;
window.toggleClinDreno = toggleClinDreno;
window.toggleSurgPVP = toggleSurgPVP;
window.toggleSurgPAM = toggleSurgPAM;

function toggleClinAllergy(checkbox) {
    const detailInput = document.getElementById('clin_alergia_detalhe');
    if (checkbox.checked) {
        detailInput.value = 'Nega';
        detailInput.classList.add('hidden');
    } else {
        detailInput.value = '';
        detailInput.classList.remove('hidden');
        detailInput.focus();
    }
    saveToLocal();
}

function toggleClinMeds(checkbox) {
    const detailInput = document.getElementById('clin_meds_habituais');
    if (checkbox.checked) {
        detailInput.value = 'Nego uso';
        detailInput.classList.add('hidden');
    } else {
        detailInput.value = '';
        detailInput.classList.remove('hidden');
        detailInput.focus();
    }
    saveToLocal();
}

function toggleSurgMeds(checkbox) {
    const detailInput = document.getElementById('meds_habituais');
    if (checkbox.checked) {
        detailInput.value = 'Nego uso';
        detailInput.classList.add('hidden');
    } else {
        detailInput.value = '';
        detailInput.classList.remove('hidden');
        detailInput.focus();
    }
    saveToLocal();
}

window.toggleClinAllergy = toggleClinAllergy;
window.toggleClinMeds = toggleClinMeds;
window.toggleSurgMeds = toggleSurgMeds;
// --- Toast System ---
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span> ${message}`;
    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}


// --- Initialize ---
// --- View Navigation ---
function navigateTo(viewId) {
    document.querySelectorAll('.view').forEach(el => {
        el.classList.add('hidden');
    });
    const target = document.getElementById(viewId);
    if (target) {
        target.classList.remove('hidden');
    }
    window.scrollTo(0, 0);
}

function resumeSession() {
    const rawAdm = localStorage.getItem(STORAGE_KEY);
    const rawReav = localStorage.getItem(STORAGE_KEY_REAV);

    if (!rawAdm && !rawReav) {
        showToast('Nenhum rascunho encontrado', 'warning');
        return;
    }

    // Determine target based on user choice if both exist
    // Determine target based on user choice if both exist
    if (rawAdm && rawReav) {
        document.getElementById('restoreModal').classList.add('open');
    } else if (rawAdm) {
        restoreAdmission(rawAdm);
    } else {
        navigateTo('view-reavaliacao');
        loadFromLocal();
        showToast('Reavaliação restaurada', 'success');
    }
}

function closeRestoreModal() {
    document.getElementById('restoreModal').classList.remove('open');
}

function confirmRestore(type) {
    closeRestoreModal();
    if (type === 'admission') {
        const rawAdm = localStorage.getItem(STORAGE_KEY);
        if (rawAdm) restoreAdmission(rawAdm);
    } else {
        navigateTo('view-reavaliacao');
        loadFromLocal();
        showToast('Reavaliação restaurada', 'success');
    }
}
window.closeRestoreModal = closeRestoreModal;
window.confirmRestore = confirmRestore;

function restoreAdmission(raw) {
    try {
        const data = JSON.parse(raw);
        if (data.clin_leito || data.clin_hora || data.inst_neuro) {
            navigateTo('view-clinical');
        } else {
            navigateTo('view-surgical');
        }
        loadFromLocal();
        showToast('Sessão restaurada', 'success');
    } catch (e) {
        showToast('Erro ao carregar rascunho', 'error');
    }
}

// Make globally available for HTML onclicks
window.navigateTo = navigateTo;
window.resumeSession = resumeSession;

function generateClinicalSummary() {
    const form = document.getElementById('clinicalForm');
    const formData = new FormData(form);
    const data = {};
    for (const [key, value] of formData.entries()) {
        if (data[key]) {
            if (!Array.isArray(data[key])) data[key] = [data[key]];
            data[key].push(value);
        } else {
            data[key] = value;
        }
    }

    // Validation: "Há Instabilidade?"
    const instabilityFields = [
        { name: 'inst_neuro', label: 'Neurológica' },
        { name: 'inst_hemo', label: 'Hemodinâmica' },
        { name: 'inst_vent', label: 'Ventilatória' },
        { name: 'inst_dor', label: 'Dor Forte' }
    ];

    let missing = [];
    instabilityFields.forEach(field => {
        if (!data[field.name]) {
            missing.push(field.label);
            // Highlight the item
            const radios = document.getElementsByName(field.name);
            if (radios.length > 0) {
                const container = radios[0].closest('.instability-item');
                if (container) {
                    container.classList.add('highlight-error');
                    setTimeout(() => container.classList.remove('highlight-error'), 3000);
                }
            }
        }
    });

    if (missing.length > 0) {
        showToast(`Preencha Instabilidade: ${missing.join(', ')}`, 'warning');
        return;
    }

    const leito = data.clin_leito || 'N/I';
    const hora = data.clin_hora || '--:--';
    const rawDate = data.clin_data || '';

    // Helper: Format Date dd/mm
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}`;
    };
    const dateFormatted = formatDate(rawDate);

    // Instability String - Logic Grouping
    const formatInst = (val, label) => {
        if (val === 'Não') {
            if (label.toLowerCase() === 'dor forte') return `+ Sem dor forte`;
            return `+ ${label} ok`;
        }
        if (val === 'Sim') {
            if (label.toLowerCase() === 'dor forte') return `- Dor forte`;
            return `- Instabilidade ${label.toLowerCase()}`;
        }
        return null;
    };

    const positives = [];
    const negatives = [];

    const items = [
        { val: data.inst_hemo, label: 'Hemodinâmica' },
        { val: data.inst_neuro, label: 'Neurológica' },
        { val: data.inst_vent, label: 'Ventilatória' },
        { val: data.inst_dor, label: 'Dor forte' }
    ];

    items.forEach(item => {
        const res = formatInst(item.val, item.label);
        if (res) {
            if (res.startsWith('+')) positives.push(res);
            else negatives.push(res);
        }
    });

    let instStr = positives.join('\n');
    if (positives.length > 0 && negatives.length > 0) instStr += '\n\n';
    instStr += negatives.join('\n');

    // Invasions
    let invList = Array.isArray(data.clin_invasao) ? data.clin_invasao : (data.clin_invasao ? [data.clin_invasao] : []);

    // Build detail strings
    let invasionStrings = [];
    invList.forEach(inv => {
        let text = inv;
        if (inv === 'TOT') {
            const vad = data.clin_vad || 'Não inf.';
            text += ` VAD: ${vad}`;
        } else if (inv === 'PVP' && data.clin_pvp_loc) {
            text += ` ${data.clin_pvp_loc}`;
        } else if (inv === 'PAM' && data.clin_pam_loc) {
            text += ` ${data.clin_pam_loc}`;
        } else if (inv === 'Dreno' && data.clin_dreno_loc) {
            text += ` ${data.clin_dreno_loc}`;
        }
        // Prepend date to each invasion
        const itemWithDate = dateFormatted ? `${dateFormatted} ${text}` : text;
        invasionStrings.push(itemWithDate);
    });

    const section3 = `
Orientações:

( ) Admissão
( ) Prescrição
( ) Rx agora
( ) Lab agora
( ) Lab rotina 
( ) Dieta liberada?
( ) Clexane?
( ) Checar reconciliação
( ) Nome do familiar / acompanhante
( ) Coletar TCI
( ) Protocolo de TEV
( ) Parametrização na prescrição 
( ) Check Prontuario fisico`;

    let invStr = invasionStrings.join('\n') || 'Nenhuma invasão';

    const summary = `${leito}\n\n\n${instStr}\n\n${clinAlergias}\n${clinMeds}\n\n${invStr}\n\n\n${section3}`;

    // Clean up empty lines if fields are empty
    const finalSummary = summary.replace(/\n\n\n+/g, '\n\n').trim();

    document.getElementById('summaryText').textContent = finalSummary;

    // Store simplified content for reminder
    const reminderContent = `Leito: ${leito}\n\n${negatives.join('\n')}`;
    document.getElementById('summaryModal').dataset.reminderContent = reminderContent;

    // Reset Modal Buttons (Show all by default for standard summaries)
    const btnCopy = document.getElementById('btnModalCopy');
    const btnDontpad = document.getElementById('btnDontpad');
    if (btnCopy) btnCopy.classList.remove('hidden');
    if (btnDontpad) {
        btnDontpad.classList.remove('hidden');
    }

    // Show/Hide Reminder Button based on instabilities
    const reminderBtn = document.getElementById('reminderButton');
    if (reminderBtn) {
        if (negatives.length > 0) reminderBtn.classList.remove('hidden');
        else reminderBtn.classList.add('hidden');
    }

    document.getElementById('summaryModal').classList.add('open');
}
window.generateClinicalSummary = generateClinicalSummary;

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Default to Home View
    navigateTo('view-home');

    // Set default date/time for Surgical
    const now = new Date();
    const dataAdm = document.getElementById('data_admissao');
    const horaAdm = document.getElementById('hora_admissao');
    if (dataAdm) dataAdm.valueAsDate = now;
    if (horaAdm) horaAdm.value = now.toTimeString().slice(0, 5);

    // Set default values for Clinical
    const clinData = document.getElementById('clin_data');
    const clinHora = document.getElementById('clin_hora');
    if (clinData) clinData.valueAsDate = now;
    if (clinHora) clinHora.value = now.toTimeString().slice(0, 5);

    // Set default values for Reavaliacao
    const reavData = document.getElementById('reav_data');
    const reavHora = document.getElementById('reav_hora');
    if (reavData) reavData.valueAsDate = now;
    if (reavHora) reavHora.value = now.toTimeString().slice(0, 5);

    // Autosave Trigger: Debounced input listener
    let timeout;
    const saveHandler = () => {
        clearTimeout(timeout);
        timeout = setTimeout(saveToLocal, 1000); // Auto-save after 1s of inactivity
    };

    const forms = ['admissionForm', 'clinicalForm', 'reavaliacaoForm'];
    forms.forEach(id => {
        const f = document.getElementById(id);
        if (f) f.addEventListener('input', saveHandler);
    });

    // Network Listeners - Removed as it gives false positives on mobile
    // and the app works fully offline using LocalStorage anyway.

    // Safety: Save immediately when closing/hiding the app
    window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            saveToLocal();
        }
    });
    // Extra safety for iOS
    window.addEventListener('pagehide', () => {
        saveToLocal();
    });
});

// UI: Expand/Collapse Sections
function toggleSection(headerElement) {
    const card = headerElement.parentElement;
    card.classList.toggle('collapsed');
}

// UI: Toggle Allergy Text
function toggleAllergyInput(checkbox) {
    const detailInput = document.getElementById('alergia_detalhe');
    if (checkbox.checked) {
        detailInput.value = 'Nega';
        detailInput.classList.add('hidden');
    } else {
        detailInput.value = '';
        detailInput.classList.remove('hidden');
        detailInput.focus();
    }
    saveToLocal(); // Trigger save state
}

function toggleClexane(checkbox) {
    const dataInput = document.getElementById('heparina_data');
    const horaInput = document.getElementById('heparina_hora');
    dataInput.disabled = !checkbox.checked;
    horaInput.disabled = !checkbox.checked;

    // Set default rounded time when checked
    if (checkbox.checked) {
        if (!dataInput.value) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            dataInput.valueAsDate = tomorrow;
        }
        if (!horaInput.value) {
            horaInput.value = '18:00';
        }
    }
    saveToLocal(); // Trigger save state
}

// Logic: BMI Calculation
function calculateBMI() {
    const weight = parseFloat(document.getElementById('peso').value);
    const height = parseFloat(document.getElementById('altura').value);
    const display = document.getElementById('imc_display');

    if (weight > 0 && height > 0) {
        const bmi = (weight / (height * height)).toFixed(1);
        display.textContent = bmi;
        display.classList.add('highlight');
    } else {
        display.textContent = '-';
        display.classList.remove('highlight');
    }
    // Note: No explicit save here as 'input' event on form handles it
}

// Logic: Generate Summary
function generateSummary() {
    const getValue = (id) => document.getElementById(id)?.value || '';
    const getRadio = (name) => document.querySelector(`input[name="${name}"]:checked`)?.value || '';
    const getChecked = (name) => {
        return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`))
            .map(cb => cb.value)
            .join(', ');
    };

    // Helper: Format Date dd/mm
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}`;
    };

    const rawDate = getValue('data_admissao');
    const dateFormatted = formatDate(rawDate);

    const data = {
        data: dateFormatted,
        leito: getValue('leito_admissao'),
        hora: getValue('hora_admissao'),
        idade: getValue('idade'),
        sexo: getValue('sexo'),
        equipe: getValue('equipe'),
        peso: getValue('peso'),
        altura: getValue('altura'),
        imc: document.getElementById('imc_display').textContent,

        // Section 2
        cirurgia: getValue('cirurgia'),
        info_pre_op: getValue('info_pre_op'),
        duracao_h: document.querySelector('input[name="duracao_h"]')?.value || '',
        duracao_min: document.querySelector('input[name="duracao_min"]')?.value || '',

        // Intra-op
        crist: getValue('cristaloide'),
        col: getValue('coloide'),
        anestesia_tipo: getChecked('anestesia'),
        anestesia_drogas: getValue('anestesia_drogas'),
        sang: getValue('sangramento'),
        diu: getValue('diurese'),
        sds_med: getChecked('sds_med'),
        sds_outros: getValue('sds_outros'),
        transf: getValue('transfusao'),
        bh_outros: getValue('bh_outros'),

        // History
        comorb_list: getChecked('comorb'),
        comorb_outros: getValue('comorb_outros'),
        meds_hab: getValue('meds_habituais'),
        alergias: document.getElementById('nega_alergia').checked ? 'Nega alergia' : `Alergia: ${getValue('alergia_detalhe')}`,
        vad: getRadio('vad'),
        cormack: getValue('cormack'),
        disp_iot: getRadio('disp_iot'),
        bougie: getChecked('bougie'),

        // Other
        atb_nome: getValue('antibiotico'),
        inv_list: getChecked('invasao').split(', ').filter(i => i),
        inv_pam: getValue('inv_pam_loc'),
        inv_pvp: getValue('inv_pvp_loc'),
        drenos: getValue('drenos'),

        // Prophylaxis / Checklist Logic
        dieta: getRadio('dieta'),
        dieta_tempo: getValue('dieta_tempo'),
        clexane_check: document.getElementById('check_clexane').checked,
        heparina_data: getValue('heparina_data'),
        heparina_hora: getValue('heparina_hora'),
        compressor: document.querySelector('input[name="compressor"]:checked'),
        deambular: getRadio('deambular'),

        // Instability (Surgical)
        inst_neuro: getRadio('inst_neuro_surg'),
        inst_hemo: getRadio('inst_hemo_surg'),
        inst_vent: getRadio('inst_vent_surg'),
        inst_dor: getRadio('inst_dor_surg')
    };

    // --- BUILD TEXT ---

    // SECTION 1
    let section1 = `Nome,\n${data.idade} anos`;
    // if (data.leito) section1 += ` | Leito ${data.leito}`; // Removed per request
    if (data.peso) section1 += `\n${data.peso} kg`;
    if (data.altura) section1 += `\n${data.altura} m`;
    if (data.imc && data.imc !== '-') section1 += `\nIMC ${data.imc}`;
    section1 += `\n\nMA: ${data.equipe}\n\n—---------------------------------`;


    // Instability String - New Format (Positives first, then Negatives)
    const positives = [];
    const negatives = [];

    const formatInst = (val, label) => {
        if (val === 'Não') {
            if (label.toLowerCase() === 'dor forte') return `+ Sem dor forte`;
            return `+ ${label} ok`;
        }
        if (val === 'Sim') {
            if (label.toLowerCase() === 'dor forte') return `- Dor forte`;
            return `- Instabilidade ${label.toLowerCase()}`;
        }
        return null;
    };

    const items = [
        { val: data.inst_hemo, label: 'Hemodinâmica' },
        { val: data.inst_neuro, label: 'Neurológica' },
        { val: data.inst_vent, label: 'Ventilatória' },
        { val: data.inst_dor, label: 'Dor forte' }
    ];

    items.forEach(item => {
        const res = formatInst(item.val, item.label);
        if (res) {
            if (res.startsWith('+')) positives.push(res);
            else negatives.push(res);
        }
    });

    let instStr = positives.join('\n');
    if (positives.length > 0 && negatives.length > 0) instStr += '\n\n';
    instStr += negatives.join('\n');

    // (Existing building logic for sections...)
    // I need to make sure I don't break the existing code flow.
    // Let's refactor the final assembly.

    // Antibiotic
    let antibioticLine = data.atb_nome ? `${data.data} ${data.atb_nome}` : '';

    // Invasions
    let invasionsLines = [];
    data.inv_list.forEach(inv => {
        let text = inv;
        if (inv === 'PAM' && data.inv_pam) text += ` ${data.inv_pam}`;
        if (inv === 'PVP' && data.inv_pvp) text += ` ${data.inv_pvp}`;
        invasionsLines.push(`${data.data} ${text}`);
    });

    if (data.drenos) invasionsLines.push(`${data.data} ${data.drenos}`);
    if (antibioticLine) section1 += `\n${antibioticLine}`;
    if (invasionsLines.length > 0) section1 += `\n\n${invasionsLines.join('\n')}`;

    // SECTION 2
    let surgeryLine = `${data.data} PO ${data.cirurgia}`;
    if (data.info_pre_op) surgeryLine += ` (${data.info_pre_op})`;

    let durationStr = '';
    if (data.duracao_h || data.duracao_min) {
        durationStr = `CC ${data.duracao_h || '0'}h`;
        if (data.duracao_min && data.duracao_min !== '0' && data.duracao_min !== '00') durationStr += `${data.duracao_min}`;
    }

    let cristVol = parseInt(data.crist) || 0;
    let colVol = parseInt(data.col) || 0;
    let totalHV = cristVol + colVol;
    let hvStr = totalHV > 0 ? `HV ${totalHV}ml` : '';

    let anestesiaStr = `Anestesia ${data.anestesia_tipo}`;
    if (data.anestesia_drogas) anestesiaStr += ` com ${data.anestesia_drogas}`;

    let medsExit = [];
    if (data.sds_med) medsExit.push(data.sds_med);
    if (data.sds_outros) medsExit.push(data.sds_outros);
    let medsExitStr = medsExit.join(' + ');

    let intraOpLine = [
        durationStr,
        hvStr,
        anestesiaStr,
        `Sangramento ${data.sang || '-'}`,
        `Diurese ${data.diu || '-'}`,
        medsExitStr
    ].filter(s => s).join(' / ');

    let formattedTransf = data.transf;
    if (formattedTransf && !isNaN(formattedTransf) && parseInt(formattedTransf) < 10 && formattedTransf.length === 1) {
        formattedTransf = `0${formattedTransf}`;
    }
    let transfLine = data.transf ? `Hemotransfusões: ${formattedTransf} ${data.data}` : '';

    let section2 = `${surgeryLine}\n${intraOpLine}`;
    if (transfLine) section2 += `\n\n${transfLine}`;
    section2 += `\n—-------------------------------------------------------------------------------------------------------`;

    // History
    let comorbStr = data.comorb_list;
    if (data.comorb_outros) comorbStr += (comorbStr ? `; ${data.comorb_outros}` : data.comorb_outros);
    let section2Part2 = `HPP: ${comorbStr || 'Nega'}\n\nEm uso de: ${data.meds_hab || 'Nega'}`;

    // Allergy & Airway
    let allergyLine = data.alergias;
    let airwayBase = data.vad === 'Sim' ? 'VAD' : 'VA ok';
    let airwayLine = airwayBase;
    if (data.cormack) airwayLine += ` - Cormack ${data.cormack}`;
    let disp = data.disp_iot === 'Videolaringo' ? 'VL' : data.disp_iot;
    if (disp) airwayLine += ` - ${disp}`;
    if (data.bougie && data.bougie.includes('Sim')) airwayLine += ` + Bougie`;

    section2 += `\n${section2Part2}\n\n${allergyLine}\n${airwayLine}`;

    // SECTION 3
    let dietCheck = '( )';
    let dietText = 'Dieta liberada?';
    if (data.dieta && data.dieta.includes('Liberada')) {
        dietCheck = '(x)';
        dietText += ` a partir de ${data.dieta_tempo || ''}`;
    } else if (data.dieta) {
        dietText += ` ${data.dieta}`;
    }

    let clexaneCheck = '( )';
    let clexaneText = 'Clexane?';
    if (data.clexane_check) {
        clexaneCheck = '(x)';
        if (data.heparina_data || data.heparina_hora) {
            clexaneText += ` Iniciar ${formatDate(data.heparina_data)} às ${data.heparina_hora}`;
        }
    } else if (data.compressor) {
        clexaneCheck = '(-)';
        clexaneText += ' não, CPMI';
    }

    let walkCheck = data.deambular === 'Sim' ? '(x)' : '( )';

    let section3 = `
( ) Admissão
( ) Prescrição
( ) Rx agora
( ) Lab agora
( ) Lab rotina 
${dietCheck.replace('(x)', '(x)').replace('( )', '( )')} ${dietText}
${clexaneCheck.replace('(x)', '(x)').replace('( )', '( )')} ${clexaneText}
${walkCheck.replace('(x)', '(x)').replace('( )', '( )')} liberado para deambular?
(x) Checar reconciliação
( ) Nome do familiar / acompanhante
( ) Coletar TCI
( ) Protocolo de TEV
( ) Parametrização na prescrição 
( ) Check Prontuario fisico`;

    let summary = `${section1}\n\n\n${section2}\n\n\n${instStr}\n\n\nOrientações:\n${section3}`;

    document.getElementById('summaryText').textContent = summary.trim();

    // Store simplified content for reminder (Surgical)
    const leitoVal = getValue('leito_admissao') || 'N/I';
    const reminderContentSurg = `Leito: ${leitoVal}\n\n${negatives.join('\n')}`;
    document.getElementById('summaryModal').dataset.reminderContent = reminderContentSurg;

    // Reset Modal Buttons (Show all by default for standard summaries)
    const btnCopy = document.getElementById('btnModalCopy');
    const btnDontpad = document.getElementById('btnDontpad');
    if (btnCopy) btnCopy.classList.remove('hidden');
    if (btnDontpad) btnDontpad.classList.remove('hidden');

    // Show/Hide Reminder Button based on instabilities
    const reminderBtn = document.getElementById('reminderButton');
    if (reminderBtn) {
        if (negatives.length > 0) reminderBtn.classList.remove('hidden');
        else reminderBtn.classList.add('hidden');
    }

    document.getElementById('summaryModal').classList.add('open');
}

function closeModal() {
    document.getElementById('summaryModal').classList.remove('open');
}

function copyToClipboard() {
    const text = document.getElementById('summaryText').textContent;
    navigator.clipboard.writeText(text).then(() => {
        showToast('Texto copiado!', 'success');
        // Close modal after short delay? Optional. 
        // User might want to keep reading.
    });
}

function copyAndOpenDontpad() {
    const text = document.getElementById('summaryText').textContent;
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copiado! Abrindo Dontpad...', 'success');

        let url = 'http://dontpad.com/admissao_upo_cirurgica';
        const isClinical = !document.getElementById('view-clinical').classList.contains('hidden');

        if (isClinical) {
            url = 'http://dontpad.com/admissao_upo_clinica';
        }

        window.open(url, '_blank');
    });
}

function resetForm(formId = 'admissionForm') {
    if (confirm('Tem certeza que deseja limpar os dados deste formulário? Isso também removerá o rascunho salvo.')) {
        const form = document.getElementById(formId);
        if (form) form.reset();

        localStorage.removeItem(STORAGE_KEY);

        const now = new Date();
        if (formId === 'admissionForm') {
            document.getElementById('data_admissao').valueAsDate = now;
            document.getElementById('hora_admissao').value = now.toTimeString().slice(0, 5);
            // leito_admissao is text, so form.reset() handles it. 
            document.getElementById('alergia_detalhe').disabled = false;
            calculateBMI();
        } else if (formId === 'clinicalForm') {
            document.getElementById('clin_data').valueAsDate = now;
            document.getElementById('clin_hora').value = now.toTimeString().slice(0, 5);
            document.getElementById('vad_selection').classList.add('hidden');
            document.getElementById('clin_pvp_detail').classList.add('hidden');
            document.getElementById('clin_pam_detail').classList.add('hidden');
        }

        showToast('Formulário limpo', 'success');
    }
}

// Logic: Calendar Export
function generateCalendarEvent() {
    const minutesInput = prompt("Daqui a quantos minutos você quer ser lembrado?", "30");
    if (!minutesInput) return;

    const minutes = parseFloat(minutesInput);
    if (isNaN(minutes)) return;

    const now = new Date();
    const startDate = new Date(now.getTime() + (minutes * 60 * 1000));
    const endDate = new Date(startDate.getTime() + (30 * 60 * 1000));

    const formatDate = (date) => {
        return date.toISOString().replace(/-|:|\.\d+/g, '');
    };

    const summary = document.getElementById('summaryText').textContent;
    // Use stored simplified content if available, else fallback to full summary
    const content = document.getElementById('summaryModal').dataset.reminderContent || summary;

    const title = `Revisar Paciente (UPO)`;
    const description = `Lembrete de revisão.\n\n${content}`;

    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//UPO//Admissao//PT',
        'BEGIN:VEVENT',
        `UID:${Date.now()}@upo.app`,
        `DTSTAMP:${formatDate(now)}`,
        `DTSTART:${formatDate(startDate)}`,
        `DTEND:${formatDate(endDate)}`,
        `SUMMARY:${title}`,
        `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'lembrete_upo.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Lembrete criado!', 'success');
}
// Logic: Check Reavaliacao
function checkReavaliacao() {
    const getValue = (id) => document.getElementById(id)?.value || 'N/I';
    const getRadio = (name) => document.querySelector(`input[name="${name}"]:checked`)?.value || 'Não';

    const leito = getValue('reav_leito');

    // Instability Logic
    const negatives = [];

    // Helper to format instability text
    const formatInst = (val, label) => {
        if (val === 'Sim') {
            return `- Instabilidade ${label.toLowerCase()}`;
        }
        return null;
    };

    const instItems = [
        { val: getRadio('reav_inst_neuro'), label: 'Neurológica' },
        { val: getRadio('reav_inst_hemo'), label: 'Hemodinâmica' },
        { val: getRadio('reav_inst_vent'), label: 'Ventilatória' },
        { val: getRadio('reav_inst_dor'), label: 'Dor forte' }
    ];

    instItems.forEach(item => {
        const res = formatInst(item.val, item.label);
        if (res) negatives.push(res);
    });

    if (negatives.length > 0) {
        // Show modal with reminder button
        // We reuse summaryModal but hide the main text area or show simplified text
        const summary = `Leito: ${leito}\n\n${negatives.join('\n')}`;

        document.getElementById('summaryText').textContent = summary.trim();
        document.getElementById('summaryModal').dataset.reminderContent = summary.trim();

        // Show reminder button
        const reminderBtn = document.getElementById('reminderButton');
        if (reminderBtn) reminderBtn.classList.remove('hidden');

        document.getElementById('summaryModal').classList.add('open');
    } else {
        // No instability, show toast
        showToast('Paciente estável. Nenhuma instabilidade marcada.', 'success');
    }
}
window.checkReavaliacao = checkReavaliacao;

// Logic: Check Reavaliacao Status (Show/Hide Reminder Button in Form)
function checkReavStatus() {
    const getRadio = (name) => document.querySelector(`input[name="${name}"]:checked`)?.value;
    const items = ['reav_inst_neuro', 'reav_inst_hemo', 'reav_inst_vent', 'reav_inst_dor'];

    let hasInstability = false;
    items.forEach(name => {
        if (getRadio(name) === 'Sim') hasInstability = true;
    });

    const btn = document.getElementById('btnReavReminder');
    if (btn) {
        if (hasInstability) btn.classList.remove('hidden');
        else btn.classList.add('hidden');
    }
}
window.checkReavStatus = checkReavStatus;

// Logic: Open Reavaliacao Reminder Modal
function openReavReminder() {
    const getValue = (id) => document.getElementById(id)?.value || 'N/I';
    const getRadio = (name) => document.querySelector(`input[name="${name}"]:checked`)?.value || 'Não';

    const leito = getValue('reav_leito');

    // Instability Logic
    const negatives = [];

    const formatInst = (val, label) => {
        if (val === 'Sim') return `- Instabilidade ${label.toLowerCase()}`;
        return null;
    };

    const instItems = [
        { val: getRadio('reav_inst_neuro'), label: 'Neurológica' },
        { val: getRadio('reav_inst_hemo'), label: 'Hemodinâmica' },
        { val: getRadio('reav_inst_vent'), label: 'Ventilatória' },
        { val: getRadio('reav_inst_dor'), label: 'Dor forte' }
    ];

    instItems.forEach(item => {
        const res = formatInst(item.val, item.label);
        if (res) negatives.push(res);
    });

    const summary = `Leito: ${leito}\n\n${negatives.join('\n')}`;
    document.getElementById('summaryText').textContent = summary.trim();
    document.getElementById('summaryModal').dataset.reminderContent = summary.trim();

    // HIDE Copy and Dontpad buttons
    const btnCopy = document.getElementById('btnModalCopy');
    const btnDontpad = document.getElementById('btnDontpad');
    if (btnCopy) btnCopy.classList.add('hidden');
    if (btnDontpad) btnDontpad.classList.add('hidden');

    // Show Reminder Button (Force show since we only get here if there is instability)
    const reminderBtn = document.getElementById('reminderButton');
    if (reminderBtn) reminderBtn.classList.remove('hidden');

    document.getElementById('summaryModal').classList.add('open');
}
window.openReavReminder = openReavReminder;

// Logic: Check Reavaliacao Status (Show/Hide Reminder Button in Form)
function checkReavStatus() {
    const getRadio = (name) => document.querySelector(`input[name="${name}"]:checked`)?.value;
    const items = ['reav_inst_neuro', 'reav_inst_hemo', 'reav_inst_vent', 'reav_inst_dor'];

    let hasInstability = false;
    items.forEach(name => {
        if (getRadio(name) === 'Sim') hasInstability = true;
    });

    const btn = document.getElementById('btnReavReminder');
    if (btn) {
        if (hasInstability) btn.classList.remove('hidden');
        else btn.classList.add('hidden');
    }
}
window.checkReavStatus = checkReavStatus;

// Logic: Open Reavaliacao Reminder Modal
function openReavReminder() {
    const getValue = (id) => document.getElementById(id)?.value || 'N/I';
    const getRadio = (name) => document.querySelector(`input[name="${name}"]:checked`)?.value || 'Não';

    const leito = getValue('reav_leito');

    // Instability Logic
    const negatives = [];

    const formatInst = (val, label) => {
        if (val === 'Sim') return `- Instabilidade ${label.toLowerCase()}`;
        return null;
    };

    const instItems = [
        { val: getRadio('reav_inst_neuro'), label: 'Neurológica' },
        { val: getRadio('reav_inst_hemo'), label: 'Hemodinâmica' },
        { val: getRadio('reav_inst_vent'), label: 'Ventilatória' },
        { val: getRadio('reav_inst_dor'), label: 'Dor forte' }
    ];

    instItems.forEach(item => {
        const res = formatInst(item.val, item.label);
        if (res) negatives.push(res);
    });

    const summary = `Leito: ${leito}\n\n${negatives.join('\n')}`;
    document.getElementById('summaryText').textContent = summary.trim();
    document.getElementById('summaryModal').dataset.reminderContent = summary.trim();

    // HIDE Copy and Dontpad buttons
    const btnCopy = document.getElementById('btnModalCopy');
    const btnDontpad = document.getElementById('btnDontpad');
    if (btnCopy) btnCopy.classList.add('hidden');
    if (btnDontpad) btnDontpad.classList.add('hidden');

    // Show Reminder Button (Force show since we only get here if there is instability)
    const reminderBtn = document.getElementById('reminderButton');
    if (reminderBtn) reminderBtn.classList.remove('hidden');

    document.getElementById('summaryModal').classList.add('open');
}
window.openReavReminder = openReavReminder;
