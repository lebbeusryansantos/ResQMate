document.addEventListener("DOMContentLoaded", () => {
    
    const textareas = document.querySelectorAll("textarea");

    const getFormContainer = (textarea) => {
        return textarea.closest('form') || textarea.closest('.modal-content') || textarea.closest('.request-modal-card') || document.body;
    };

    const validateContainer = (container, showErrorFor = null) => {
        const containerTextareas = container.querySelectorAll("textarea");
        let anyInvalid = false;

        containerTextareas.forEach(textarea => {
            const val = textarea.value;
            const length = val.trim().length;
            const isVisible = textarea.offsetWidth > 0 || textarea.offsetHeight > 0;
            
            let isRequired = textarea.hasAttribute('required') || 
                             textarea.id === 'adminFeedback' || 
                             textarea.id === 'deliveryRemarks' ||
                             textarea.id === 'feedbackText' ||
                             textarea.id === 'details' ||
                             textarea.id === 'specificAddress';
                             
            if (textarea.id === 'landmark') isRequired = false;

            let isInvalid = false;
            if (isVisible) {
                if (isRequired) {
                    isInvalid = length < 30;
                } else {
                    isInvalid = length > 0 && length < 30;
                }
            }

            const counter = textarea.nextElementSibling;
            if (counter && counter.classList.contains('char-counter')) {
                counter.textContent = `${length}/30 minimum characters`;
                if (isInvalid && length > 0) {
                    counter.style.color = "#dc3545"; // Red
                } else {
                    counter.style.color = "#6c757d"; // Muted
                }
            }

            if (showErrorFor === textarea && isInvalid) {
                textarea.style.border = "2px solid #dc3545";
            } else if (!isInvalid) {
                textarea.style.border = "";
            }

            if (isInvalid) anyInvalid = true;
        });

        // Now find buttons in this container
        const buttons = Array.from(container.querySelectorAll('button')).filter(btn => {
            return btn.type === 'submit' || 
                   btn.classList.contains('rq-btn-primary') || 
                   btn.classList.contains('rq-btn-approve') || 
                   btn.id === 'submitFeedbackBtn' || 
                   btn.classList.contains('btn-primary') ||
                   btn.id === 'submitRequestBtn';
        });

        buttons.forEach(btn => {
            // Exceptions: Don't disable reject buttons if it's just admin feedback missing.
            if (btn.classList.contains('rq-btn-reject') || btn.textContent.toLowerCase().includes('reject')) {
                return; // Rejections don't need these textareas
            }
            if (btn.classList.contains('rejection-cancel-btn') || btn.textContent.toLowerCase().includes('cancel') || btn.textContent.toLowerCase().includes('close')) {
                return;
            }
            
            if (anyInvalid) {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
            } else {
                btn.disabled = false;
                btn.style.opacity = '';
                btn.style.cursor = '';
            }
        });
    };

    textareas.forEach(textarea => {
        const container = getFormContainer(textarea);
        textarea.addEventListener("input", () => validateContainer(container));
        textarea.addEventListener("blur", () => validateContainer(container, textarea));
        
        // Initial check
        validateContainer(container);
        
        // Also run a poll just for dynamic visibility changes (e.g. priority select)
        setInterval(() => validateContainer(container), 500);
    });
});
