var API_BASE_URL =
    window.location.hostname === "127.0.0.1" ||
        window.location.hostname === "localhost"
        ? "http://127.0.0.1:8000"
        : "https://resqmate-backend.onrender.com";

var API_URL = `${API_BASE_URL}/users`;

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

        allUsers = users;
        renderUsers(users);

    } catch (error) {
        console.error("Failed to load users", error);
    }
}

/* ===========================
   RENDER USERS
=========================== */
function renderUsers(users) {

    usersTableBody.innerHTML = "";

    if (users.length === 0) {
        document.getElementById(
            "emptyUsersMessage"
        ).style.display = "block";
        return;
    }

    document.getElementById(
        "emptyUsersMessage"
    ).style.display = "none";

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
                        onclick="editUser(
                            ${user.user_id},
                            '${user.full_name.replace(/'/g, "\\'")}',
                            '${user.email}',
                            '${user.phone_number || ""}',
                            '${user.role}'
                        )">
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

    document.getElementById(
        "userFirstName"
    ).value = "";

    document.getElementById(
        "userLastName"
    ).value = "";

    document.getElementById(
        "userEmail"
    ).value = "";

    document.getElementById(
        "userPhone"
    ).value = "";

    document.getElementById(
        "userPassword"
    ).value = "";

    document.getElementById(
        "userRole"
    ).value = "community_user";

    modal.classList.add("active");
});

/* ===========================
   SAVE USER
=========================== */
document.getElementById(
    "saveUserBtn"
).addEventListener("click", async () => {

    const firstName =
        document.getElementById(
            "userFirstName"
        ).value.trim();

    const lastName =
        document.getElementById(
            "userLastName"
        ).value.trim();

    const email =
        document.getElementById(
            "userEmail"
        ).value.trim();

    const phone =
        document.getElementById(
            "userPhone"
        ).value.trim();

    const password =
        document.getElementById(
            "userPassword"
        ).value.trim();

    const role =
        document.getElementById(
            "userRole"
        ).value;

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
                        password:
                            password ||
                            "ResQMate2024!",
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
window.editUser = function (
    id,
    fullName,
    email,
    phone,
    role
) {

    editingUserId = id;

    document.getElementById(
        "userModalTitle"
    ).textContent = "Edit User";

    const parts = fullName.split(" ");
    const firstName = parts[0];
    const lastName = parts.slice(1).join(" ");

    document.getElementById(
        "userFirstName"
    ).value = firstName;

    document.getElementById(
        "userLastName"
    ).value = lastName;

    document.getElementById(
        "userEmail"
    ).value = email;

    document.getElementById(
        "userPhone"
    ).value = phone;

    document.getElementById(
        "userRole"
    ).value = role;

    document.getElementById(
        "userPassword"
    ).value = "";

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