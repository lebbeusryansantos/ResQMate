document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("backToTopBtn");
    if (!btn) return;

    const mainContent = document.querySelector(".main-content") || document.querySelector(".dashboard-container");
    
    function checkScroll() {
        let scrollPos = 0;
        
        if (mainContent && mainContent.scrollTop > 0) {
            scrollPos = mainContent.scrollTop;
        } else {
            scrollPos = window.scrollY || document.documentElement.scrollTop;
        }

        if (scrollPos > 300) {
            btn.classList.add("visible");
        } else {
            btn.classList.remove("visible");
        }
    }

    if (mainContent) {
        mainContent.addEventListener("scroll", checkScroll);
    }
    window.addEventListener("scroll", checkScroll);

    btn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (mainContent) {
            mainContent.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
});
