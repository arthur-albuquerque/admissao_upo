// App Logic for CTI Admission Form

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Set default date/time to now
    const now = new Date();
    document.getElementById('data_admissao').valueAsDate = now;
    document.getElementById('hora_admissao').value = now.toTimeString().slice(0, 5);
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
        hora: getValue('hora_admissao'),
        idade: getValue('idade'),
        sexo: getValue('sexo'),
        equipe: getValue('equipe'),
        peso: getValue('peso'), // Added peso for section1 logic
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
        bh_outros: getValue('bh_outros'), // Not used in example but available

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
        inv_list: getChecked('invasao').split(', ').filter(i => i), // Array
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
        deambular: getRadio('deambular')
    };

    // --- BUILD TEXT ---

    // SECTION 1
    // Nome placeholder
    // Age
    // Peso (if exists)
    // MA: Equipe
    let section1 = `Nome,\n${data.idade} anos`;
    if (data.peso) {
        section1 += `\n${data.peso} kg`;
    }
    if (data.altura) {
        section1 += `\n${data.altura} m`;
    }
    if (data.imc && data.imc !== '-') {
        section1 += `\nIMC ${data.imc}`;
    }
    section1 += `\n\nMA: ${data.equipe}\n\n—---------------------------------`;

    // Antibiotic
    let antibioticLine = data.atb_nome ? `${data.data} ${data.atb_nome}` : '';

    // Invasions
    // Map Invasions to "Date Item"
    let invasionsLines = [];

    // Process known invasions with locals
    data.inv_list.forEach(inv => {
        let text = inv;
        if (inv === 'PAM' && data.inv_pam) text += ` (${data.inv_pam})`;
        if (inv === 'PVP' && data.inv_pvp) text += ` (${data.inv_pvp})`;
        invasionsLines.push(`${data.data} ${text}`);
    });

    // Drains
    if (data.drenos) {
        invasionsLines.push(`${data.data} ${data.drenos}`);
    }
    // CVD is in inv_list usually if checked, or separate? 
    // In index.html CVD is a checkbox value="CVD" in 'invasao', so it's covered by inv_list.

    section1 += antibioticLine ? `\n${antibioticLine}` : '';
    if (invasionsLines.length > 0) section1 += `\n\n${invasionsLines.join('\n')}`;


    // SECTION 2
    // Date PO Surgery (InfoPreOp)
    let surgeryLine = `${data.data} PO ${data.cirurgia}`;
    if (data.info_pre_op) surgeryLine += ` (${data.info_pre_op})`;

    // IntraOp Details
    // 05:00 CC / HV 1000ml / Anestesia ...
    let durationStr = '';
    if (data.duracao_h || data.duracao_min) {
        durationStr = `CC ${data.duracao_h || '0'}h`;
        if (data.duracao_min && data.duracao_min !== '0' && data.duracao_min !== '00') {
            durationStr += `${data.duracao_min}`;
        }
    }

    // HV calculation
    let cristVol = parseInt(data.crist) || 0;
    let colVol = parseInt(data.col) || 0;
    let totalHV = cristVol + colVol;
    let hvStr = totalHV > 0 ? `HV ${totalHV}ml` : ''; // Or separate if needed, example shows sum? "HV 1000ml"

    // Anesthesia
    let anestesiaStr = `Anestesia ${data.anestesia_tipo}`;
    if (data.anestesia_drogas) anestesiaStr += ` com ${data.anestesia_drogas}`;

    // Meds Saida Sala
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

    // Transfusions
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

    // Airway Logic
    let airwayBase = data.vad === 'Sim' ? 'VAD' : 'VA ok';
    let airwayLine = airwayBase;

    if (data.cormack) {
        airwayLine += ` - Cormack ${data.cormack}`;
    }

    let disp = data.disp_iot === 'Videolaringo' ? 'VL' : data.disp_iot;
    if (disp) {
        // Use " - " separator or " com "? Example shows " - VL"
        // Previous request: "VAD - Cormack II com VL + bougie"
        // Current request example: "VA ok - VL + bougie"
        // Let's use " - " as separator if Cormack is present, or append to base?
        // Let's standardize on " - " for the device part to match the requested example
        airwayLine += ` - ${disp}`;
    }

    if (data.bougie && data.bougie.includes('Sim')) {
        airwayLine += ` + Bougie`;
    }

    section2 += `\n${section2Part2}\n\n${allergyLine}\n${airwayLine}`;


    // SECTION 3 - Checklist
    // Logic for Dieta
    let dietCheck = '( )';
    let dietText = 'Dieta liberada?';
    if (data.dieta && data.dieta.includes('Liberada')) {
        dietCheck = '(x)';
        dietText += ` a partir de ${data.dieta_tempo || ''}`;
    } else if (data.dieta) {
        dietText += ` ${data.dieta}`;
    }

    // Logic for Clexane/Heparin/Compressor
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

    // Logic for Deambular
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

    // Final Assembly
    // Using explicit newlines for spacing as requested
    let summary = `${section1}\n\n\n\n${section2}\n\n\n${section3}`;

    document.getElementById('summaryText').textContent = summary.trim();
    document.getElementById('summaryModal').classList.add('open');
}

function closeModal() {
    document.getElementById('summaryModal').classList.remove('open');
}

function copyToClipboard() {
    const text = document.getElementById('summaryText').textContent;
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.querySelector('.modal-footer .btn-primary');
        const original = btn.textContent;
        btn.textContent = 'Copiado!';
        btn.style.backgroundColor = '#10b981';
        setTimeout(() => {
            btn.textContent = original;
            btn.style.backgroundColor = '';
        }, 2000);
    });
}

function copyAndOpenDontpad() {
    const text = document.getElementById('summaryText').textContent;
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('btnDontpad');
        const original = btn.textContent;
        btn.textContent = 'Colar no Dontpad';
        btn.style.backgroundColor = '#10b981'; // Green for success

        // Open in new tab
        window.open('http://dontpad.com/admissao_upo2026', '_blank');

        setTimeout(() => {
            btn.textContent = original;
            btn.style.backgroundColor = '#3b82f6'; // Revert to original blue
        }, 3000);
    });
}

function resetForm() {
    if (confirm('Tem certeza que deseja limpar todos os dados?')) {
        document.getElementById('admissionForm').reset();
        calculateBMI();

        // Reset defaults
        const now = new Date();
        document.getElementById('data_admissao').valueAsDate = now;
        document.getElementById('hora_admissao').value = now.toTimeString().slice(0, 5);
        document.getElementById('alergia_detalhe').disabled = false;
    }
}

// Logic: Calendar Export
function generateCalendarEvent() {
    const hours = prompt("Daqui a quantas horas você quer ser lembrado?", "2");
    if (!hours) return; // Users cancelled

    const now = new Date();
    const startDate = new Date(now.getTime() + (parseFloat(hours) * 60 * 60 * 1000));
    const endDate = new Date(startDate.getTime() + (30 * 60 * 1000)); // 30 min duration

    const formatDate = (date) => {
        return date.toISOString().replace(/-|:|\.\d+/g, '');
    };

    const name = document.getElementById('section1').innerText.split('\n')[0] || 'Paciente UPO'; // Rough guess or generic
    // Better:
    const dataAdmissao = document.getElementById('data_admissao').value;
    const summary = document.getElementById('summaryText').textContent;

    const title = `Revisar Paciente (UPO)`;
    const description = `Lembrete de revisão.\n\n${summary}`;

    // Build ICS content
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

    // Create Download Link
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'lembrete_upo.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
