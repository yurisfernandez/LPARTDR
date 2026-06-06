// Smooth scroll to form
function scrollToForm() {
    document.getElementById('evaluacion').scrollIntoView({ behavior: 'smooth' });
}

// Form logic
let currentStep = 1;
let isSubmittingLead = false;

const leadsApiEndpoint = window.LEADS_API_ENDPOINT || 'http://localhost:3000/api/leads';
const leadsApiKey = window.LEADS_API_KEY || '';

function nextStep(step) {
    if (validateStep(step)) {
        // Special rule for step 1: if they select 'no' (en negro), we might want to stop them or warn them.
        if (step === 1) {
            const isEnBlanco = document.querySelector('input[name="enBlanco"]:checked').value;
            if (isEnBlanco === 'no') {
                document.getElementById('msg-negro').classList.remove('hidden');
                // Optional: Stop them from proceeding. In this implementation we'll let them proceed but warn them.
                // return; 
            } else {
                document.getElementById('msg-negro').classList.add('hidden');
            }
        }

        // Special rule for step 2: if > 18 months, warn them but proceed.
        if (step === 2) {
            const tiempo = document.querySelector('input[name="tiempo"]:checked').value;
            if (tiempo === 'mas18') {
                document.getElementById('msg-mas18').classList.remove('hidden');
            } else {
                document.getElementById('msg-mas18').classList.add('hidden');
            }
        }

        document.getElementById(`step${step}`).classList.remove('active');
        document.getElementById(`step${step + 1}`).classList.add('active');
    }
}

function prevStep(step) {
    document.getElementById(`step${step}`).classList.remove('active');
    document.getElementById(`step${step - 1}`).classList.add('active');
}

function validateStep(step) {
    let isValid = true;
    
    if (step === 1) {
        const checked = document.querySelector('input[name="enBlanco"]:checked');
        if (!checked) {
            document.getElementById('error-enblanco').style.display = 'block';
            isValid = false;
        } else {
            document.getElementById('error-enblanco').style.display = 'none';
        }
    }
    
    if (step === 2) {
        const checked = document.querySelector('input[name="tiempo"]:checked');
        if (!checked) {
            document.getElementById('error-tiempo').style.display = 'block';
            isValid = false;
        } else {
            document.getElementById('error-tiempo').style.display = 'none';
        }
    }

    return isValid;
}

function showFinalError(message) {
    const error = document.getElementById('error-final');
    error.textContent = message;
    error.style.display = 'block';
}

function showSuccessState() {
    document.getElementById('step3').classList.remove('active');
    document.getElementById('step-success').classList.add('active');
}

// Handle Form Submission
document.getElementById('leadForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    if (isSubmittingLead) {
        return;
    }
    
    const nombre = document.getElementById('nombre').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const lesion = document.getElementById('lesion').value.trim();
    const enBlanco = document.querySelector('input[name="enBlanco"]:checked')?.value;
    const tiempo = document.querySelector('input[name="tiempo"]:checked')?.value;

    if (!nombre || !telefono || !lesion) {
        showFinalError('Por favor, completá todos los campos.');
        return;
    }

    if (!enBlanco || !tiempo) {
        showFinalError('Por favor, completá todas las preguntas del formulario.');
        return;
    }
    document.getElementById('error-final').style.display = 'none';

    const submitBtn = document.querySelector('.btn-submit');
    const originalText = submitBtn.innerText;
    submitBtn.innerText = 'Enviando...';
    submitBtn.disabled = true;
    isSubmittingLead = true;

    try {
        const response = await fetch(leadsApiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Internal-Api-Key': leadsApiKey
            },
            body: JSON.stringify({
                nombre,
                telefono,
                lesion,
                enBlanco,
                tiempo,
                source: 'landing-art'
            })
        });

        if (!response.ok) {
            throw new Error('Lead request failed');
        }

        showSuccessState();
    } catch (error) {
        showFinalError('No pudimos enviar tus datos. Intentá nuevamente en unos minutos.');
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
        isSubmittingLead = false;
    }
});

// Dynamic form interactions for better UX
document.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        // Auto advance to next step when a radio button is clicked for smoother UX
        // Only if it's not the last step
        const parentStep = e.target.closest('.form-step');
        if (parentStep.id === 'step1') {
            setTimeout(() => nextStep(1), 300);
        } else if (parentStep.id === 'step2') {
            setTimeout(() => nextStep(2), 300);
        }
    });
});
