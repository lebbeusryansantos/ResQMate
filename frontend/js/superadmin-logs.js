document.addEventListener("DOMContentLoaded", () => {
    // Check Superadmin Role
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.role !== "superadmin") {
        alert("Access Denied: Super Admin role required.");
        window.location.href = "../index.html";
        return;
    }

    const logsTableBody = document.querySelector("#logsTable tbody");
    const searchLog = document.getElementById("searchLog");
    const roleFilter = document.getElementById("roleFilter");
    const rowsPerPageSelect = document.getElementById("rowsPerPage");
    
    const prevPageBtn = document.getElementById("prevPageBtn");
    const nextPageBtn = document.getElementById("nextPageBtn");
    const pageIndicator = document.getElementById("pageIndicator");

    let allLogs = [];
    let filteredLogs = [];
    let currentPage = 1;
    let itemsPerPage = 10;

    loadLogs();

    async function loadLogs() {
        try {
            const response = await fetch(`${API_URL}/audit_logs`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.status === 401 || response.status === 403) {
                alert("Unauthorized");
                window.location.href = "../index.html";
                return;
            }
            
            const logs = await response.json();
            allLogs = logs;
            applyFilters();
        } catch (error) {
            console.error("Failed to load audit logs", error);
        }
    }

    function applyFilters() {
        const query = searchLog.value.toLowerCase().trim();
        const role = roleFilter.value;

        filteredLogs = allLogs.filter(log => {
            const matchSearch = log.action_description.toLowerCase().includes(query) || 
                                log.user_name.toLowerCase().includes(query) ||
                                String(log.user_id).includes(query);
            const matchRole = (role === 'all' || log.user_role === role);
            return matchSearch && matchRole;
        });

        currentPage = 1;
        renderDOM();
    }

    function renderDOM() {
        logsTableBody.innerHTML = "";

        const totalFiltered = filteredLogs.length;
        const totalPages = Math.ceil(totalFiltered / itemsPerPage);
        
        if (totalFiltered === 0) {
            logsTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #6b7280; padding: 20px;">No matching records found</td></tr>`;
            pageIndicator.textContent = `Showing 0 to 0 of 0 entries`;
            prevPageBtn.disabled = true;
            nextPageBtn.disabled = true;
            return;
        }

        const startIndex = (currentPage - 1) * itemsPerPage;
        let endIndex = startIndex + itemsPerPage;
        if (endIndex > totalFiltered) endIndex = totalFiltered;

        const paginated = filteredLogs.slice(startIndex, endIndex);

        paginated.forEach(log => {
            const roleClass = log.user_role === 'admin' ? 'role-admin' :
                              log.user_role === 'staff' ? 'role-staff' :
                              log.user_role === 'superadmin' ? 'role-super' : 'role-user';
                              
            let formattedDate = "N/A";
            if (log.timestamp) {
                const dateObj = new Date(log.timestamp + "Z"); // SQLite usually returns UTC string
                formattedDate = dateObj.toLocaleString();
                if (formattedDate === "Invalid Date") {
                     const dateObj2 = new Date(log.timestamp);
                     formattedDate = dateObj2.toLocaleString();
                }
            }

            logsTableBody.innerHTML += `
                <tr>
                    <td>#${log.id}</td>
                    <td>#${log.user_id}</td>
                    <td><strong>${log.user_name}</strong></td>
                    <td><span class="role-badge ${roleClass}">${log.user_role.replace('_', ' ').toUpperCase()}</span></td>
                    <td>${log.action_description}</td>
                    <td>${formattedDate}</td>
                </tr>
            `;
        });

        pageIndicator.textContent = `Showing ${startIndex + 1} to ${endIndex} of ${totalFiltered} entries`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;
    }

    searchLog.addEventListener("input", applyFilters);
    roleFilter.addEventListener("change", applyFilters);
    
    rowsPerPageSelect.addEventListener("change", (e) => {
        itemsPerPage = parseInt(e.target.value);
        currentPage = 1;
        renderDOM();
    });

    prevPageBtn.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            renderDOM();
        }
    });

    nextPageBtn.addEventListener("click", () => {
        const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderDOM();
        }
    });
});
