var API_BASE_URL = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost" ? "http://127.0.0.1:8000" : "https://resqmate-backend.onrender.com";
document.addEventListener(
    "DOMContentLoaded",
    loadNotifications
);

function getAuthHeaders() {
    const userData = JSON.parse(
        localStorage.getItem("user") || "{}"
    );

    return {
        "Authorization": `Bearer ${userData.token || ""}`,
        "Content-Type": "application/json"
    };
}

async function loadNotifications() {

    const user =
        JSON.parse(
            localStorage.getItem("user")
        );

    if (!user) {

        window.location.href =
            "../landingpage.html";

        return;
    }

    const notificationList =
        document.getElementById(
            "notificationList"
        );

    try {

        const response = await fetch(
            `${API_BASE_URL}/requests/user/${user.user_id}`,
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );

        if (!response.ok) {

            throw new Error(
                "Failed to load notifications."
            );
        }

        const requests =
            await response.json();

        displayNotifications(
            requests,
            user.user_id
        );

    }
    catch (error) {

        console.error(
            "Notification Error:",
            error
        );

        notificationList.innerHTML = `
            <div class="empty-notifications">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <h3>Unable to Load Notifications</h3>
                <p>Please make sure the server is running.</p>
            </div>
        `;
    }
}


function displayNotifications(
    requests,
    userId
) {

    const notificationList =
        document.getElementById(
            "notificationList"
        );

    notificationList.innerHTML = "";

    const updatedRequests =
        (requests || []).filter(request => {

            const status =
                request.status
                    ? request.status.toLowerCase()
                    : "pending";

            return status !== "pending";
        });

    if (updatedRequests.length === 0) {

        notificationList.innerHTML = `
            <div class="empty-notifications">
                <i class="fa-regular fa-bell-slash"></i>
                <h3>No data yet</h3>
                <p>You currently have no request updates.</p>
            </div>
        `;

        return;
    }

    const readNotifications =
        getReadNotifications(userId);

    updatedRequests.forEach(request => {

        const status =
            request.status
                ? request.status.toLowerCase()
                : "pending";

        const type =
            request.assistance_type
                ? capitalize(
                    request.assistance_type
                )
                : "General";

        const requestId =
            request.request_id;

        const date =
            request.date_requested
                ? new Date(
                    request.date_requested
                ).toLocaleDateString(
                    "en-US",
                    {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                    }
                )
                : "";

        const notificationId =
            `${requestId}-${status}`;

        const isRead =
            readNotifications.includes(
                notificationId
            );

        const notification =
            createNotification(
                type,
                requestId,
                status,
                date,
                notificationId,
                isRead,
                request.rejection_reason
            );

        notificationList.innerHTML +=
            notification;
    });

    setupReadNotifications(userId);
}

function createNotification(
    type,
    requestId,
    status,
    date,
    notificationId,
    isRead,
    reason
) {

    let title = "";
    let message = "";
    let icon = "";

    switch (status) {

        case "processing":
        case "approved":

            title =
                "Request Approved";

            message =
                `Your ${type.toLowerCase()} assistance request #${requestId} has been approved.`;

            icon =
                "fa-circle-check";

            break;


        case "completed":

            title =
                "Request Completed";

            message =
                `Your ${type.toLowerCase()} assistance request #${requestId} has been completed.`;

            icon =
                "fa-circle-check";

            break;


        case "cancelled":

            title =
                "Request Cancelled";

            message =
                `Your ${type.toLowerCase()} assistance request #${requestId} has been cancelled.`;
            
            if (reason) {
                message += `<br><span style="color: #ef4444; font-size: 0.9em; margin-top: 4px; display: inline-block;">Reason: ${reason}</span>`;
            }

            icon =
                "fa-circle-xmark";

            break;

        case "rejected":

            title =
                "Request Rejected";

            message =
                `Your ${type.toLowerCase()} assistance request #${requestId} was rejected.`;

            if (reason) {
                message += `<br><span style="color: #ef4444; font-size: 0.9em; margin-top: 4px; display: inline-block;">Reason: ${reason}</span>`;
            }

            icon =
                "fa-circle-xmark";

            break;


        case "pending":

        default:

            title =
                "Request Received";

            message =
                `Your ${type.toLowerCase()} assistance request #${requestId} is currently pending.`;

            icon =
                "fa-clock";

            break;
    }

    const unreadClass =
        isRead ? "" : "unread";

    const unreadDot =
        isRead
            ? ""
            : `<div class="unread-dot"></div>`;

    return `
        <div
            class="notification-item ${unreadClass}"
            data-notification-id="${notificationId}"
        >

            <div class="notification-icon ${status}">
                <i class="fa-solid ${icon}"></i>
            </div>

            <div class="notification-content">

                <div class="notification-title">
                    ${title}
                </div>

                <div class="notification-message">
                    ${message}
                </div>

                <div class="notification-date">
                    ${date}
                </div>

            </div>

            ${unreadDot}

        </div>
    `;
}


function setupReadNotifications(userId) {

    const notifications =
        document.querySelectorAll(
            ".notification-item"
        );

    notifications.forEach(
        notification => {

            notification.addEventListener(
                "click",
                () => {

                    const notificationId =
                        notification.dataset
                            .notificationId;

                    markNotificationAsRead(
                        userId,
                        notificationId
                    );

                    notification.classList.remove(
                        "unread"
                    );

                    const dot =
                        notification.querySelector(
                            ".unread-dot"
                        );

                    if (dot) {
                        dot.remove();
                    }
                }
            );
        }
    );
}


function markNotificationAsRead(
    userId,
    notificationId
) {

    const storageKey =
        `resqmate_read_notifications_${userId}`;

    let readNotifications =
        JSON.parse(
            localStorage.getItem(
                storageKey
            )
        ) || [];

    if (
        !readNotifications.includes(
            notificationId
        )
    ) {

        readNotifications.push(
            notificationId
        );

        localStorage.setItem(
            storageKey,
            JSON.stringify(
                readNotifications
            )
        );
    }
}


function getReadNotifications(userId) {

    const storageKey =
        `resqmate_read_notifications_${userId}`;

    return JSON.parse(
        localStorage.getItem(
            storageKey
        )
    ) || [];
}


function markAllAsRead(userId) {

    const notifications =
        document.querySelectorAll(
            ".notification-item"
        );

    let readNotifications =
        getReadNotifications(userId);

    notifications.forEach(
        notification => {

            const notificationId =
                notification.dataset
                    .notificationId;

            if (
                !readNotifications.includes(
                    notificationId
                )
            ) {

                readNotifications.push(
                    notificationId
                );
            }

            notification.classList.remove(
                "unread"
            );

            const dot =
                notification.querySelector(
                    ".unread-dot"
                );

            if (dot) {
                dot.remove();
            }
        }
    );

    const storageKey =
        `resqmate_read_notifications_${userId}`;

    localStorage.setItem(
        storageKey,
        JSON.stringify(
            readNotifications
        )
    );
}


function capitalize(text) {

    return text.charAt(0).toUpperCase() +
        text.slice(1).toLowerCase();
}


const markAllReadButton =
    document.getElementById(
        "markAllRead"
    );

if (markAllReadButton) {

    markAllReadButton.addEventListener(
        "click",
        () => {

            const user =
                JSON.parse(
                    localStorage.getItem("user")
                );

            if (!user) {
                return;
            }

            markAllAsRead(
                user.user_id
            );
        }
    );
}