// Additional interactive elements and enhancements

// Initialize tooltips
function initTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    
    tooltipElements.forEach(el => {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = el.getAttribute('data-tooltip');
        document.body.appendChild(tooltip);
        
        el.addEventListener('mouseenter', (e) => {
            const rect = e.target.getBoundingClientRect();
            tooltip.style.left = `${rect.left + rect.width/2 - tooltip.offsetWidth/2}px`;
            tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
            tooltip.style.opacity = '1';
        });
        
        el.addEventListener('mouseleave', () => {
            tooltip.style.opacity = '0';
        });
    });
}

// Animate elements when they come into view
function initScrollAnimations() {
    const animateOnScroll = (elements) => {
        elements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const isVisible = (rect.top <= window.innerHeight * 0.8);
            
            if (isVisible) {
                el.classList.add('animate');
            }
        });
    };
    
    const animatedElements = document.querySelectorAll('[data-animate]');
    window.addEventListener('scroll', () => animateOnScroll(animatedElements));
    animateOnScroll(animatedElements);
}

// Enhanced code copy functionality
function enhanceCodeCopy() {
    document.querySelectorAll('.copy-button').forEach(btn => {
        btn.addEventListener('click', function() {
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-check"></i> Copied!';
            
            setTimeout(() => {
                this.innerHTML = originalText;
            }, 2000);
        });
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initTooltips();
    initScrollAnimations();
    enhanceCodeCopy();
    
    // Add pulse animation to generate button
    const generateBtn = document.getElementById('generateButton');
    generateBtn.classList.add('pulse');
    
    // Remove pulse after first interaction
    generateBtn.addEventListener('click', () => {
        generateBtn.classList.remove('pulse');
    }, { once: true });
});

// Theme switcher (optional)
function initThemeSwitcher() {
    const themeToggle = document.createElement('button');
    themeToggle.id = 'themeToggle';
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    themeToggle.style.position = 'fixed';
    themeToggle.style.bottom = '20px';
    themeToggle.style.left = '20px';
    themeToggle.style.zIndex = '1000';
    document.body.appendChild(themeToggle);
    
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        themeToggle.innerHTML = document.body.classList.contains('light-theme') 
            ? '<i class="fas fa-sun"></i>' 
            : '<i class="fas fa-moon"></i>';
    });
}

// Uncomment to enable theme switcher
// initThemeSwitcher();