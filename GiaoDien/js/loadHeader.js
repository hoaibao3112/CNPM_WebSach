async function loadHeader() {
    try {
        const response = await fetch("components/header.html");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.text();
        document.getElementById("load-header").innerHTML = data;
    } catch (error) {
        console.error("Không thể load header:", error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadHeader()
});