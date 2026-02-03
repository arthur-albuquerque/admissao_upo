// App Logic for CTI Admission Form

// --- State Management & Autosave ---
const STORAGE_KEY = 'upo_admission_form_data';

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

    data._last_saved = new Date().toISOString();

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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
window.toggleVAD = toggleVAD;
window.toggleClinPVP = toggleClinPVP;
window.toggleClinPAM = toggleClinPAM;

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

// --- Offline Detector ---
function updateOnlineStatus() {
    const badge = document.getElementById('offlineBadge');
    if (navigator.onLine) {
        badge.classList.remove('visible');
    } else {
        badge.classList.add('visible');
    }
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
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
        try {
            const data = JSON.parse(raw);
            // Decide which view to open based on available data
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
    } else {
        showToast('Nenhum rascunho encontrado', 'warning');
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

    // Instabilities
    const instStr = [
        `Neurológica: ${data.inst_neuro || '-'}`,
        `Hemodinâmica: ${data.inst_hemo || '-'}`,
        `Ventilatória: ${data.inst_vent || '-'}`,
        `Dor Forte: ${data.inst_dor || '-'}`
    ].join(' | ');

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
        }
        invasionStrings.push(text);
    });

    let invStr = invasionStrings.join(', ') || 'Nenhuma';

    const summary = `*ADMISSÃO CLÍNICA*\n` +
        `${leito} | ${dateFormatted} | ${hora}\n` +
        `—----------------------------------\n` +
        `INSTABILIDADE:\n${instStr}\n` +
        `—----------------------------------\n` +
        `INVASÕES: ${invStr}\n`;

    document.getElementById('summaryText').textContent = summary.trim();
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

    // Autosave Trigger: Debounced input listener
    let timeout;
    const saveHandler = () => {
        clearTimeout(timeout);
        timeout = setTimeout(saveToLocal, 1000); // Auto-save after 1s of inactivity
    };

    const forms = ['admissionForm', 'clinicalForm'];
    forms.forEach(id => {
        const f = document.getElementById(id);
        if (f) f.addEventListener('input', saveHandler);
    });

    // Network Listeners
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus(); // Check on load

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
        detailInput.disabled = true;
    } else {
        detailInput.value = '';
        detailInput.disabled = false;
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
    if (data.leito) section1 += ` | Leito ${data.leito}`;
    if (data.peso) section1 += `\n${data.peso} kg`;
    if (data.altura) section1 += `\n${data.altura} m`;
    if (data.imc && data.imc !== '-') section1 += `\nIMC ${data.imc}`;
    section1 += `\n\nEquipe: ${data.equipe}\n\n—---------------------------------`;


    // Instability String
    const instStr = [
        `Neurológica: ${data.inst_neuro || '-'}`,
        `Hemodinâmica: ${data.inst_hemo || '-'}`,
        `Ventilatória: ${data.inst_vent || '-'}`,
        `Dor Forte: ${data.inst_dor || '-'}`
    ].join(' | ');

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
        `Cristaloide: ${data.crist || '0'}ml`,
        `Coloide: ${data.col || '0'}ml`,
        `Sangramento: ${data.sang || '-'}`,
        `Diurese: ${data.diu || '-'}`,
        anestesiaStr,
        medsExitStr
    ].filter(s => s).join('\n');

    let transfLine = data.transf ? `Hemotransfusões: ${data.transf} ${data.data}` : '';

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
(  ) Admissão
(  ) Prescrição
(  ) Rx agora
(  ) Lab agora
(  ) Lab rotina 
${dietCheck} ${dietText}
${clexaneCheck} ${clexaneText}
${walkCheck} deambular em 12h
(x) Checar reconciliação
(  ) Nome do familiar / acompanhante
(  ) Coletar TCI
(  ) Protocolo de TEV
(  ) Parametrização na prescrição 
(  ) Check Prontuario fisico`;

    let summary = `${section1}\n\n\n\n${section2}\n\n\nINSTABILIDADE:\n${instStr}\n\n\n${section3}`;

    document.getElementById('summaryText').textContent = summary.trim();
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
    const hours = prompt("Daqui a quantas horas você quer ser lembrado?", "2");
    if (!hours) return;

    const now = new Date();
    const startDate = new Date(now.getTime() + (parseFloat(hours) * 60 * 60 * 1000));
    const endDate = new Date(startDate.getTime() + (30 * 60 * 1000));

    const formatDate = (date) => {
        return date.toISOString().replace(/-|:|\.\d+/g, '');
    };

    const summary = document.getElementById('summaryText').textContent;
    const title = `Revisar Paciente (UPO)`;
    const description = `Lembrete de revisão.\n\n${summary}`;

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
