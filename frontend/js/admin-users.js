var API_BASE_URL =
    window.location.hostname === "127.0.0.1" ||
        window.location.hostname === "localhost"
        ? "http://127.0.0.1:8000"
        : "https://resqmate-backend.onrender.com";

var API_URL = `${API_BASE_URL}/users`;

let currentPage = 1;
const itemsPerPage = 8;

function setupPagination(dataArray, renderCallback) {
    const prevBtn = document.getElementById("prevPageBtn");
    const nextBtn = document.getElementById("nextPageBtn");
    const indicator = document.getElementById("pageIndicator");
    
    const totalPages = Math.ceil(dataArray.length / itemsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;
    
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const slicedData = dataArray.slice(startIdx, endIdx);
    
    if (prevBtn) {
        prevBtn.disabled = currentPage === 1;
        prevBtn.style.cursor = currentPage === 1 ? "not-allowed" : "pointer";
        if (currentPage === 1) prevBtn.classList.add("disabled-btn");
        else prevBtn.classList.remove("disabled-btn");
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.style.cursor = currentPage === totalPages ? "not-allowed" : "pointer";
        if (currentPage === totalPages) nextBtn.classList.add("disabled-btn");
        else nextBtn.classList.remove("disabled-btn");
    }
    
    if (indicator) {
        indicator.textContent = `Page ${currentPage} of ${totalPages}`;
    }
    
    renderCallback(slicedData);
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("prevPageBtn")?.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            if (typeof updatePagination === "function") updatePagination();
        }
    });
    
    document.getElementById("nextPageBtn")?.addEventListener("click", () => {
        currentPage++;
        if (typeof updatePagination === "function") updatePagination();
    });
});


const usersTableBody = document.getElementById("usersTableBody");
const modal = document.getElementById("userModal");

let editingUserId = null;
let allUsers = [];

function getAuthHeaders() {
    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );

    return {
        "Authorization": `Bearer ${user.token || ""}`,
        "Content-Type": "application/json"
    };
}

/* ===========================
   LOAD USERS
=========================== */
async function loadUsers() {
    try {
        const response = await fetch(API_URL, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error("Failed to load users");
        }

        const users = await response.json();
        
        // Sort users by ID ascending
        users.sort((a, b) => parseInt(a.user_id) - parseInt(b.user_id));

        allUsers = users;
        renderUsers(users);

    } catch (error) {
        console.error("Failed to load users", error);
    }
}

/* ===========================
   RENDER USERS
=========================== */
let currentData = [];
function renderUsers(users) {
    currentData = users;
    currentPage = 1;
    setupPagination(currentData, renderUsersDOM);
}

function updatePagination() {
    setupPagination(currentData, renderUsersDOM);
}

function renderUsersDOM(users) {

    usersTableBody.innerHTML = "";

    if (users.length === 0) {
        usersTableBody.innerHTML = `<tr><td colspan="12" class="text-center" style="text-align:center;padding:30px;color:#9ca3af;">No matching records found.</td></tr>`;
        const emptyMsg = document.getElementById("emptyUsersMessage");
        if (emptyMsg) emptyMsg.style.display = "none";
        return;
    }

    const emptyMsg = document.getElementById("emptyUsersMessage");
    if (emptyMsg) emptyMsg.style.display = "none";

    users.forEach(user => {

        const roleClass =
            user.role === "admin"
                ? "rq-badge-admin"
                : user.role === "staff"
                    ? "rq-badge-staff"
                    : "rq-badge-community";

        const roleText =
            user.role === "admin"
                ? "ADMIN"
                : user.role === "staff"
                    ? "STAFF"
                    : "USER";

        usersTableBody.innerHTML += `
            <tr data-role="${user.role}">
                <td>${user.user_id}</td>
                <td>${user.full_name}</td>
                <td>${user.email}</td>
                <td>${user.phone_number || "—"}</td>
                <td>
                    <span class="rq-badge ${roleClass}">
                        ${roleText}
                    </span>
                </td>
                <td>
                    <button
                        class="rq-btn-edit"
                        onclick="editUser(${user.user_id})">
                        Edit
                    </button>

                    <button
                        class="rq-btn-delete"
                        onclick="deleteUser(${user.user_id})">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    });
}

/* ===========================
   ADD USER
=========================== */
document.getElementById(
    "addUserBtn"
).addEventListener("click", () => {

    editingUserId = null;

    document.getElementById(
        "userModalTitle"
    ).textContent = "Add New User";

    document.getElementById("userFirstName").value = "";
    document.getElementById("userLastName").value = "";
    document.getElementById("userEmail").value = "";
    document.getElementById("userPhone").value = "";
    document.getElementById("userEmergencyContactName").value = "";
    document.getElementById("userEmergencyContactNumber").value = "";
    document.getElementById("userDob").value = "";
    document.getElementById("userCalculatedAge").textContent = "Age: --";
    document.getElementById("userPassword").value = "";
    document.getElementById("userRole").value = "community_user";
    modal.classList.add("active");
});

/* ===========================
   REAL-TIME PHONE VALIDATION
=========================== */
const userPhoneInput = document.getElementById("userPhone");
if (userPhoneInput) {
    userPhoneInput.addEventListener("input", function (e) {
        this.value = this.value.replace(/\D/g, '');
        if (this.value.length > 11) {
            this.value = this.value.slice(0, 11);
        }
    });
}

const adminEmergencyPhoneInput = document.getElementById("userEmergencyContactNumber");
if (adminEmergencyPhoneInput) {
    adminEmergencyPhoneInput.addEventListener("input", function (e) {
        this.value = this.value.replace(/\D/g, '');
        if (this.value.length > 11) {
            this.value = this.value.slice(0, 11);
        }
    });
}

const adminUserDob = document.getElementById("userDob");
const adminCalculatedAge = document.getElementById("userCalculatedAge");
if (adminUserDob) {
    adminUserDob.addEventListener("change", () => {
        if (adminUserDob.value && adminCalculatedAge) {
            const birthDate = new Date(adminUserDob.value);
            const todayDate = new Date();
            let age = todayDate.getFullYear() - birthDate.getFullYear();
            const m = todayDate.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && todayDate.getDate() < birthDate.getDate())) {
                age--;
            }
            adminCalculatedAge.textContent = `Age: ${age}`;
        } else if (adminCalculatedAge) {
            adminCalculatedAge.textContent = "Age: --";
        }
    });
}

/* ===========================
   SAVE USER
=========================== */
document.getElementById(
    "saveUserBtn"
).addEventListener("click", async () => {

    const firstName = document.getElementById("userFirstName").value.trim();
    const lastName = document.getElementById("userLastName").value.trim();
    const email = document.getElementById("userEmail").value.trim();
    const phone = document.getElementById("userPhone").value.trim();
    const emergencyContactName = document.getElementById("userEmergencyContactName").value.trim();
    const emergencyContactNumber = document.getElementById("userEmergencyContactNumber").value.trim();
    const dob = document.getElementById("userDob").value;
    const password = document.getElementById("userPassword").value.trim();
    const role = document.getElementById("userRole").value;

    if (!firstName || !lastName || !email || !phone) {
        alert(
            "Please fill in First Name, Last Name, Email, and Phone Number."
        );
        return;
    }

    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(phone)) {
        alert("Phone number must be exactly 11 digits, start with 09, and contain no letters or spaces.");
        return;
    }
    if (emergencyContactNumber && !phoneRegex.test(emergencyContactNumber)) {
        alert("Emergency contact number must be exactly 11 digits, start with 09, and contain no letters or spaces.");
        return;
    }

    const saveBtn =
        document.getElementById(
            "saveUserBtn"
        );

    const originalText =
        saveBtn.textContent;

    saveBtn.disabled = true;
    saveBtn.textContent = "Processing...";

    try {

        if (!editingUserId) {

            const res = await fetch(
                `${API_URL}/create`,
                {
                    method: "POST",
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        first_name: firstName,
                        last_name: lastName,
                        email,
                        phone_number: phone,
                        emergency_contact_name: emergencyContactName,
                        emergency_contact_number: emergencyContactNumber,
                        password: password || "ResQMate2024!",
                        role
                    })
                }
            );

            if (!res.ok) {
                const err =
                    await res.json();

                alert(
                    err.detail ||
                    "Failed to create user."
                );
                return;
            }

        } else {

            const firstNameValue = firstName;
            const lastNameValue = lastName;

            const res = await fetch(
                `${API_URL}/${editingUserId}`,
                {
                    method: "PUT",
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        first_name: firstNameValue,
                        last_name: lastNameValue,
                        email,
                        phone_number: phone,
                        emergency_contact_name: emergencyContactName,
                        emergency_contact_number: emergencyContactNumber,
                        role,
                        password
                    })
                }
            );

            if (!res.ok) {
                const err =
                    await res.json();

                alert(
                    err.detail ||
                    "Failed to update user."
                );
                return;
            }
        }

        modal.classList.remove(
            "active"
        );
        
        alert("User successfully " + (editingUserId ? "updated" : "created") + "!");

        loadUsers();

    } catch (error) {

        console.error(error);

        alert(
            "Request failed. Is the backend running?"
        );

    } finally {

        saveBtn.disabled = false;
        saveBtn.textContent =
            originalText;
    }
});

/* ===========================
   EDIT USER
=========================== */
window.editUser = function(id) {
    editingUserId = id;
    
    const user = allUsers.find(u => u.user_id === id);
    if (!user) return;

    document.getElementById("userModalTitle").textContent = "Edit User";

    const parts = user.full_name.split(" ");
    const firstName = parts[0];
    const lastName = parts.slice(1).join(" ");

    document.getElementById("userFirstName").value = firstName || "";
    document.getElementById("userLastName").value = lastName || "";
    document.getElementById("userEmail").value = user.email || "";
    document.getElementById("userPhone").value = user.phone_number || "";
    document.getElementById("userEmergencyContactName").value = user.emergency_contact_name || "";
    document.getElementById("userEmergencyContactNumber").value = user.emergency_contact_number || "";
    document.getElementById("userRole").value = user.role || "community_user";
    
    if (user.dob) {
        document.getElementById("userDob").value = user.dob.split('T')[0];
        const birthDate = new Date(user.dob);
        const todayDate = new Date();
        let age = todayDate.getFullYear() - birthDate.getFullYear();
        const m = todayDate.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && todayDate.getDate() < birthDate.getDate())) {
            age--;
        }
        document.getElementById("userCalculatedAge").textContent = `Age: ${age}`;
    } else {
        document.getElementById("userDob").value = "";
        document.getElementById("userCalculatedAge").textContent = "Age: --";
    }

    document.getElementById("userPassword").value = "";

    modal.classList.add(
        "active"
    );
};

/* ===========================
   DELETE USER
=========================== */
window.deleteUser = async function (
    userId
) {

    if (
        !confirm(
            "Delete this user? This cannot be undone."
        )
    ) return;

    try {

        const response =
            await fetch(
                `${API_URL}/${userId}`,
                {
                    method: "DELETE",
                    headers:
                        getAuthHeaders()
                }
            );

        if (!response.ok) {

            const error =
                await response.json();

            alert(
                error.detail ||
                "Failed to delete user."
            );

            return;
        }

        loadUsers();

    } catch (error) {

        console.error(error);

        alert(
            "Failed to delete user."
        );
    }
};

/* ===========================
   SEARCH + FILTER
=========================== */
document.getElementById(
    "userSearch"
).addEventListener(
    "input",
    applyFilters
);

document.getElementById(
    "roleFilter"
)?.addEventListener(
    "change",
    applyFilters
);

function applyFilters() {

    const search =
        document
            .getElementById(
                "userSearch"
            )
            .value
            .toLowerCase();

    const role =
        document
            .getElementById(
                "roleFilter"
            )?.value || "all";

    const filtered =
        allUsers.filter(user => {

            const matchSearch =
                user.full_name
                    .toLowerCase()
                    .includes(search) ||
                user.email
                    .toLowerCase()
                    .includes(search);

            const matchRole =
                role === "all" ||
                user.role === role;

            return (
                matchSearch &&
                matchRole
            );
        });

    renderUsers(filtered);
}

/* ===========================
   CLOSE MODAL
=========================== */
document
    .getElementById(
        "closeUserModal"
    )
    .addEventListener(
        "click",
        () =>
            modal.classList.remove(
                "active"
            )
    );

document
    .getElementById(
        "cancelUserModal"
    )
    .addEventListener(
        "click",
        () =>
            modal.classList.remove(
                "active"
            )
    );

modal.addEventListener(
    "click",
    e => {
        if (e.target === modal) {
            modal.classList.remove(
                "active"
            );
        }
    }
);

/* ===========================
   INITIAL LOAD
=========================== */
loadUsers();
