// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add active class to navigation on scroll
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');
        const navLink = document.querySelector(`.nav-links a[href="#${sectionId}"]`);
        
        if (navLink) {
            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                navLink.classList.add('active');
            } else {
                navLink.classList.remove('active');
            }
        }
    });
});

// Copy code blocks on click
document.querySelectorAll('.code-block').forEach(block => {
    block.style.position = 'relative';
    block.style.cursor = 'pointer';
    
    block.addEventListener('click', async () => {
        const code = block.querySelector('code').textContent;
        
        try {
            await navigator.clipboard.writeText(code);
            
            // Show feedback
            const feedback = document.createElement('div');
            feedback.textContent = 'Copied!';
            feedback.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                background: #10b981;
                color: white;
                padding: 4px 12px;
                border-radius: 4px;
                font-size: 14px;
                pointer-events: none;
            `;
            
            block.appendChild(feedback);
            
            setTimeout(() => {
                feedback.remove();
            }, 2000);
        } catch (err) {
            console.error('Failed to copy code:', err);
        }
    });
});