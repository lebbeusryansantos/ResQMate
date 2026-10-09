import re

file_path = 'frontend/js/admin-requests.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace modalLocation textContent logic
content = re.sub(
    r'document\.getElementById\("modalLocation"\)\.textContent = request\.location_name \|\| "—";',
    r'''const fullLocation = request.specific_address ? `${request.specific_address}, ${request.location_name || ""}` : request.location_name || "—";
    document.getElementById("modalLocation").textContent = fullLocation;''',
    content
)

# Replace the pending status display logic for adminFeedbackRow
old_pending_logic = """        if (adminFeedbackRow) {
            adminFeedbackRow.classList.remove("d-none");
            adminFeedbackRow.style.display = "flex";
            adminFeedbackTextarea.value = "";
        }"""
new_pending_logic = """        if (adminFeedbackRow) {
            adminFeedbackRow.style.display = "none";
            adminFeedbackTextarea.value = "";
        }"""
content = content.replace(old_pending_logic, new_pending_logic)

# Replace the isPriorityChanged logic to toggle adminFeedbackRow
old_priority_logic = """            const isPriorityChanged = currentSelectedPriority !== originalPriority;

            if (isPriorityChanged) {"""
new_priority_logic = """            const isPriorityChanged = currentSelectedPriority !== originalPriority;

            if (adminFeedbackRow) {
                adminFeedbackRow.style.display = isPriorityChanged ? "flex" : "none";
            }

            if (isPriorityChanged) {"""
content = content.replace(old_priority_logic, new_priority_logic)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
