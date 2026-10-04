// Core logic and operations for app
var API_BASE_URL = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost" ? "http://127.0.0.1:8000" : "https://resqmate-backend.onrender.com";
document.addEventListener('DOMContentLoaded', () => {
    // Select the form - assuming it's the first form on the page since index.html is currently empty
    const form = document.querySelector('form');

    if (form) {
        form.addEventListener('submit', function (event) {
            let isValid = true;

            // Clear previous error messages
            const existingErrors = form.querySelectorAll('.error-message');
            existingErrors.forEach(error => error.remove());

            // Get all inputs that might be required
            const requiredFields = form.querySelectorAll('input[required], textarea[required], select[required]');

            requiredFields.forEach(field => {
                if (field.value.trim() === '') {
                    isValid = false;

                    // Create dynamic error message element
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'error-message';
                    errorDiv.style.color = 'red';
                    errorDiv.style.fontSize = '0.875em';
                    errorDiv.style.marginTop = '4px';
                    errorDiv.innerText = 'This field is required.';

                    // Insert error message just below the input field
                    field.parentNode.insertBefore(errorDiv, field.nextSibling);
                }
            });

            // Prevent default submission if any required fields are empty
            if (!isValid) {
                event.preventDefault();
            }
        });
    }
});

// Phase 3: Search and Filter implementation
document.addEventListener('DOMContentLoaded', () => {
    // Replace these selectors with the actual IDs/classes used in HTML
    const searchInput = document.getElementById('searchBar');
    const statusSelect = document.getElementById('statusFilter');
    const tableBody = document.querySelector('table tbody');

    if (searchInput && statusSelect && tableBody) {
        const filterTable = () => {
            const searchQuery = searchInput.value.toLowerCase().trim();
            const statusFilter = statusSelect.value.toLowerCase().trim();

            // Iterate through all table rows
            const rows = tableBody.querySelectorAll('tr');

            rows.forEach(row => {
                const rowText = row.textContent.toLowerCase();

                // For a more specific status check, you might want to target a specific column:
                // e.g., const statusCellText = row.querySelector('.status-cell').textContent.toLowerCase();
                // Here, we're assuming the status text exists somewhere in the row or we check a specific data attribute.
                // As a generic fallback, we check if the row's text content includes the status, 
                // or if the status filter is empty/"all"

                const matchesSearch = rowText.includes(searchQuery);
                const matchesStatus = statusFilter === '' || statusFilter === 'all' || rowText.includes(statusFilter);

                // Hide rows that do not match both conditions
                if (matchesSearch && matchesStatus) {
                    row.style.display = ''; // Show row
                } else {
                    row.style.display = 'none'; // Hide row
                }
            });
        };

        // Listen for user input on the search bar
        searchInput.addEventListener('input', filterTable);

        // Listen for changes on the status filter dropdown
        statusSelect.addEventListener('change', filterTable);
    }
});

// Phase 3: AJAX Form Submission
document.addEventListener('DOMContentLoaded', () => {
    const assistanceForm = document.getElementById('assistance-form');

    if (assistanceForm) {
        assistanceForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            // Package the input values into a JSON object
            const payload = {
                category: assistanceForm.elements['category']?.value || document.getElementById('category')?.value,
                location: assistanceForm.elements['location']?.value || document.getElementById('location')?.value,
                priority: assistanceForm.elements['priority']?.value || document.getElementById('priority')?.value,
                details: assistanceForm.elements['details']?.value || document.getElementById('details')?.value
            };

            try {
                const response = await fetch(`${API_BASE_URL}/requests/create`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    alert('Request submitted successfully!');
                    assistanceForm.reset(); // Optional: reset form after success
                } else {
                    alert('Failed to submit request. Please try again.');
                }
            } catch (error) {
                console.error('Error submitting form:', error);
                alert('An error occurred while submitting the request.');
            }
        });
    }
});
