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

    const data = {
        data: getValue('data_admissao'),
        hora: getValue('hora_admissao'),
        idade: getValue('idade'),
        sexo: getValue('sexo'),
        imc: document.getElementById('imc_display').textContent,
        peso: getValue('peso'),
        alergias: document.getElementById('nega_alergia').checked ? 'Nega' : getValue('alergia_detalhe'),
        cirurgia: getValue('cirurgia'),
        equipe: getValue('equipe'),
        meds_hab: getValue('meds_habituais'),
        comorb_list: getChecked('comorb'),
        comorb_outros: getValue('comorb_outros'),

        // Peri-Op
        vad: getRadio('vad'),
        cormack: getValue('cormack'),
        disp_iot: getRadio('disp_iot'),
        bougie: getChecked('bougie') ? 'Sim' : '',

        atb_nome: getValue('antibiotico'),
        atb_hora: getValue('atb_hora'),
        atb_conduta: getRadio('conduta_atb'),

        anestesia_tipo: getChecked('anestesia'),
        anestesia_drogas: getValue('anestesia_drogas'),

        sds_med: getChecked('sds_med'),
        sds_outros: getValue('sds_outros'),

        crist: getValue('cristaloide'),
        col: getValue('coloide'),
        diu: getValue('diurese'),
        sang: getValue('sangramento'),
        transf: getValue('transfusao'),
        bh_outros: getValue('bh_outros'),

        intercorrencias: getValue('intercorrencias'),

        // CTI
        neuro: getRadio('neuro'),
        sv: `PA: ${getValue('sv_pa')} / FC: ${getValue('sv_fc')} / SpO2: ${getValue('sv_spo2')}`,
        inv_pam: getChecked('invasao').includes('PAM') ? `PAM (${getValue('inv_pam_loc')})` : '',
        inv_pvp: getChecked('invasao').includes('PVP') ? `PVP (${getValue('inv_pvp_loc')})` : '',
        drenos: getValue('drenos'),

        // Orientacoes
        cabeceira: getRadio('cabeceira') === 'Limitada' ? `Limitada a ${getValue('cabeceira_graus')}°` : getRadio('cabeceira'),
        deambular: getRadio('deambular'),
        alta_visita: getRadio('alta_visita'),
        mob_esp: getRadio('cuidados_mob') === 'Sim' ? getValue('mob_especificar') : 'Não',
        dieta: getRadio('dieta') === 'Liberada' ? `Liberada após ${getValue('dieta_tempo')}` : getRadio('dieta'),
        compressor: document.querySelector('input[name="compressor"]:checked') ? 'Sim' : 'Não',
        heparina: (getValue('heparina_data') || getValue('heparina_hora')) ? `Iniciar ${getValue('heparina_data')} às ${getValue('heparina_hora')}` : 'Não prescrito',
        clinica: getRadio('clinica_medica')
    };

    // Clean Invasions string to remove PAM/PVP general labels if locations are specified
    // A simpler approach for valid listing:
    let invs = getChecked('invasao').split(', ').filter(i => i !== 'PAM' && i !== 'PVP');
    if (data.inv_pam) invs.unshift(data.inv_pam);
    if (data.inv_pvp) invs.unshift(data.inv_pvp);
    const invasionsStr = invs.join(', ') || 'Ausentes';

    // Construct refined Text
    let summary = `*ADMISSÃO CTI PÓS-OPERATÓRIO*
📅 ${data.data} às ${data.hora}

*ID:* ${data.idade}a, ${data.sexo} | IMC: ${data.imc}
*Proc:* ${data.cirurgia}
*Equipe:* ${data.equipe}

*Antecedentes:* ${data.comorb_list} ${data.comorb_outros ? `(${data.comorb_outros})` : ''}
*Meds Habituais:* ${data.meds_hab || '-'}
*Alergias:* ${data.alergias}

*INTRA-OPERATÓRIO*
*Via Aérea:* ${data.vad} ${data.cormack ? `(Cormack ${data.cormack})` : ''}
- Disp: ${data.disp_iot || '-'} ${data.bougie ? '(+Bougie)' : ''}

*Anestesia:* ${data.anestesia_tipo}
- Drogas: ${data.anestesia_drogas || '-'}

*ATB:* ${data.atb_nome || '-'} (Última: ${data.atb_hora || '-'})
- Conduta: ${data.atb_conduta || '-'}

*Saída de Sala:* ${data.sds_med} ${data.sds_outros ? `+ ${data.sds_outros}` : ''}

*Balanço:*
- Crist: ${data.crist || '-'} / Col: ${data.col || '-'}
- Diurese: ${data.diu || '-'} | Sang: ${data.sang || '-'}
- Transfusão: ${data.transf || '0'}
${data.bh_outros ? `- Outros: ${data.bh_outros}` : ''}

*Intercorrências:* ${data.intercorrencias || 'Nenhuma'}

*ADMISSÃO*
*Neuro:* ${data.neuro || '-'}
*Sinais:* ${data.sv}
*Invasões:* ${invasionsStr}
*Drenos:* ${data.drenos || 'Ausentes'}

*ORIENTAÇÕES*
- Cabeceira: ${data.cabeceira || '-'}
- Deambular (12-24h): ${data.deambular || '-'}
- Visita Alta: ${data.alta_visita || '-'}
- Mob. Esp.: ${data.mob_esp}
- Dieta: ${data.dieta || '-'}
- Compressor: ${data.compressor}
- Heparina: ${data.heparina}
- Acomp. CM: ${data.clinica || '-'}`;

    document.getElementById('summaryText').textContent = summary.replace(/^\s*[\r\n]/gm, ''); // Trim empty lines
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
