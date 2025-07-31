document.addEventListener('DOMContentLoaded', () => {
    // Animate feature cards on scroll
    const featureCards = document.querySelectorAll('.feature-card');
    
    const animateOnScroll = () => {
        featureCards.forEach((card, index) => {
            const rect = card.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight * 0.8;
            
            if (isVisible) {
                card.style.animation = `fadeInUp 0.5s ease forwards ${index * 0.1}s`;
            }
        });
    };
    
    // Initial animation check
    animateOnScroll();
    
    // Animate on scroll
    window.addEventListener('scroll', animateOnScroll);
    
    // Add animation to steps
    const steps = document.querySelectorAll('.step');
    steps.forEach((step, index) => {
        step.style.animation = `fadeIn 0.5s ease forwards ${index * 0.2 + 0.5}s`;
        step.style.opacity = '0';
    });
    
    // Keyframe animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes fadeIn {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
});