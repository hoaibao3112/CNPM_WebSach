function setupDropdownHover(selector) {
  const dropdown = document.querySelector(selector);
  if (dropdown) {
    dropdown.addEventListener('mouseenter', () => {
      dropdown.querySelector('.dropdown-content').style.display = 'block';
    });
    dropdown.addEventListener('mouseleave', () => {
      dropdown.querySelector('.dropdown-content').style.display = 'none';
    });
  }
}
document.addEventListener('DOMContentLoaded', () => {
  setupDropdownHover('.publisher-dropdown');
  setupDropdownHover('.category-top-dropdown');
});