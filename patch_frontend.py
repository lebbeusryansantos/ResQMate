import re

# 1. customer-request.js
cr_path = 'frontend/js/customer-request.js'
with open(cr_path, 'r', encoding='utf-8') as f:
    cr_content = f.read()

cr_content = cr_content.replace('submitButton.textContent = "Submitting...";', 'submitButton.textContent = "Processing...";')

with open(cr_path, 'w', encoding='utf-8') as f:
    f.write(cr_content)

# 2. admin-distributions.js
ad_path = 'frontend/js/admin-distributions.js'
with open(ad_path, 'r', encoding='utf-8') as f:
    ad_content = f.read()

ad_content = ad_content.replace('saveDistribution.textContent = "Saving...";', 'saveDistribution.textContent = "Processing...";')

with open(ad_path, 'w', encoding='utf-8') as f:
    f.write(ad_content)

# 3. staff-requests.js
sr_path = 'frontend/js/staff-requests.js'
with open(sr_path, 'r', encoding='utf-8') as f:
    sr_content = f.read()

# I need to add disable logic to submitDocumentation
# Find: const formData = new FormData();
# Insert above it: 
# const submitBtn = document.getElementById('submitDocumentation');
# if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Processing...'; }
sr_content = sr_content.replace(
    'const formData = new FormData();',
    """const submitBtnDoc = document.getElementById('submitDocumentation');
        const originalText = submitBtnDoc ? submitBtnDoc.textContent : 'Submit Documentation';
        if (submitBtnDoc) {
            submitBtnDoc.disabled = true;
            submitBtnDoc.textContent = 'Processing...';
        }

        const formData = new FormData();"""
)

# In the finally block, restore it. Wait, submitDocumentation doesn't have a finally block!
# Let's add it. Wait, I can just replace the try/catch end.
# Find: 
#     } catch (error) {
#
#         console.error(error);
#
#         showToast(
#             error.message ||
#             "Upload failed.",
#             false
#         );
#     }

old_catch = """    } catch (error) {

        console.error(error);

        showToast(
            error.message ||
            "Upload failed.",
            false
        );
    }"""

new_catch = """    } catch (error) {

        console.error(error);

        showToast(
            error.message ||
            "Upload failed.",
            false
        );
    } finally {
        if (submitBtnDoc) {
            submitBtnDoc.disabled = false;
            submitBtnDoc.textContent = originalText;
        }
    }"""

sr_content = sr_content.replace(old_catch, new_catch)

with open(sr_path, 'w', encoding='utf-8') as f:
    f.write(sr_content)

print("Frontend JS patched successfully")
