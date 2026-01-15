// Subtle animations and interactions
document.addEventListener('DOMContentLoaded', () => {
    // Add staggered fade-in for elements
    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach((el, index) => {
        el.style.animationDelay = `${index * 0.1}s`;
    });
});
