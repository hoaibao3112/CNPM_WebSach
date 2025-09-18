async function loadHeader() {
    try {
        const response = await fetch("components/header.html");
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.text();
        const container = document.getElementById("load-header");
        if (!container) {
            console.error("Không tìm thấy #load-header trong trang!");
            return;
        }

        container.innerHTML = data;
        // Tải file header.js
        const script = document.createElement("script");
        script.src = "js/header.js";
        script.onload = () => {
            console.log("header.js đã load thành công!");

            // Gọi trực tiếp các hàm khi header đã được chèn
            if (typeof checkLoginStatus === "function") checkLoginStatus();
            if (typeof setupDropdownHover === "function") {
                setupDropdownHover('.publisher-dropdown');
                setupDropdownHover('.category-top-dropdown');         
            }
            if (typeof updateCartCount == "function") updateCartCount();
            if (typeof setupLogout === "function") setupLogout();
        };
        script.onerror = () => console.error("Không load được header.js!");
        document.body.appendChild(script);

    } catch (error) {
        console.error("Không thể load header:", error);
    }
}

document.addEventListener('DOMContentLoaded', loadHeader);
