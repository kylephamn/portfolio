// Wait for the DOM to fully load
document.addEventListener('DOMContentLoaded', () => {
    // Variable Declarations
    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.getElementById('nav-links');
    const backToTopButton = document.getElementById('back-to-top');
    const nightModeCheckbox = document.getElementById('night-mode-checkbox');
    const body = document.body;
    const navbar = document.querySelector('.navbar');
    const heroSection = document.querySelector('.hero-section');
    const heroContent = document.querySelector('.hero-content');
    const footer = document.querySelector('.footer');
    const progressBar = document.getElementById('progress-bar');
    const nightModeIcon = document.querySelector('.slider .fa-moon, .slider .fa-sun');
    const navbarHeight = navbar.offsetHeight;
    const flipCard = document.querySelector('.flip-card');

    flipCard.addEventListener('click', function() {
        this.classList.toggle('flipped');
    });

    // Scroll Progress Bar
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrollPercentage = (scrollTop / scrollHeight) * 100;
        progressBar.style.width = scrollPercentage + '%';
    });

    // Smooth Scrolling
    document.querySelectorAll('.nav-links a').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();

            const targetID = this.getAttribute('href');
            const targetElement = document.querySelector(targetID);

            if (targetElement) {
                let offsetPosition;

                if (this.classList.contains('main-link')) {
                    // Scroll to center the <h2> element
                    const h2Element = targetElement.querySelector('h2');

                    if (h2Element) {
                        const elementPosition = h2Element.getBoundingClientRect().top;
                        const elementHeight = h2Element.offsetHeight;
                        const viewportHeight = window.innerHeight;

                        offsetPosition = elementPosition + window.pageYOffset - (viewportHeight / 2) + (elementHeight / 2) - navbarHeight;
                    } else {
                        // If no <h2> found, fallback to default scrolling
                        offsetPosition = targetElement.offsetTop - navbarHeight;
                    }
                } else {
                    // Current behavior: center the target element
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const elementHeight = targetElement.offsetHeight;
                    const viewportHeight = window.innerHeight;

                    offsetPosition = elementPosition + window.pageYOffset - (viewportHeight / 2) + (elementHeight / 2);
                }

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }

            // Close mobile menu after click
            if (window.innerWidth <= 768) {
                navLinks.classList.remove('active');
                // Also close any open dropdowns
                document.querySelectorAll('.nav-links .dropdown').forEach(dropdown => {
                    dropdown.classList.remove('active');
                });
            }
        });
    });

    // Responsive Navbar Toggle
    navToggle.addEventListener('click', () => {
        if (navLinks.style.display === 'flex') {
            navLinks.style.display = 'none';
        } else {
            navLinks.style.display = 'flex';
        }
    });

    // Back-to-Top Button Visibility Toggle
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopButton.classList.add('show');
        } else {
            backToTopButton.classList.remove('show');
        }
    });

    // Back-to-Top Button Click Event
    backToTopButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Night Mode Functions
    function enableDarkMode() {
        body.classList.add('dark-mode');
        navbar.classList.add('dark-mode');
        navLinks.classList.add('dark-mode');
        heroSection.classList.add('dark-mode');
        heroContent.classList.add('dark-mode');
        footer.classList.add('dark-mode');
        backToTopButton.classList.add('dark-mode');
        progressBar.classList.add('dark-mode');

        // Add dark-mode class to section contents
        document.querySelectorAll('.section-content').forEach(section => {
            section.classList.add('dark-mode');
        });

        // Add dark-mode class to experience-item, project-item, and skill-item elements
        document.querySelectorAll('.experience-item, .project-item, .skill-item').forEach(item => {
            item.classList.add('dark-mode');
        });

        // Add dark-mode class to contact icons
        document.querySelectorAll('.contact-icon').forEach(icon => {
            icon.classList.add('dark-mode');
        });

        localStorage.setItem('darkMode', 'enabled');
        nightModeCheckbox.checked = true;
    }

    function disableDarkMode() {
        body.classList.remove('dark-mode');
        navbar.classList.remove('dark-mode');
        navLinks.classList.remove('dark-mode');
        heroSection.classList.remove('dark-mode');
        heroContent.classList.remove('dark-mode');
        footer.classList.remove('dark-mode');
        backToTopButton.classList.remove('dark-mode');
        progressBar.classList.remove('dark-mode');

        // Remove dark-mode class from section contents
        document.querySelectorAll('.section-content').forEach(section => {
            section.classList.remove('dark-mode');
        });

        // Remove dark-mode class from experience-item, project-item, and skill-item elements
        document.querySelectorAll('.experience-item, .project-item, .skill-item').forEach(item => {
            item.classList.remove('dark-mode');
        });

        // Remove dark-mode class from contact icons
        document.querySelectorAll('.contact-icon').forEach(icon => {
            icon.classList.remove('dark-mode');
        });

        localStorage.setItem('darkMode', 'disabled');
        nightModeCheckbox.checked = false;
    }

    // Check localStorage for theme preference
    if (localStorage.getItem('darkMode') === 'enabled') {
        enableDarkMode();
    } else {
        disableDarkMode();
    }

    // Event Listener for the night mode checkbox
    nightModeCheckbox.addEventListener('change', () => {
        if (nightModeCheckbox.checked) {
            enableDarkMode();
        } else {
            disableDarkMode();
        }
    });

    // Handle dropdowns on mobile
    if (window.innerWidth <= 599) {
        document.querySelectorAll('.nav-links .dropdown > .dropbtn').forEach(dropbtn => {
            dropbtn.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent default anchor behavior
                const parentDropdown = dropbtn.parentElement;
                parentDropdown.classList.toggle('active');
            });
        });
    }

    // Close mobile menu after clicking a link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 599) {
                navLinks.classList.remove('active');
                document.querySelectorAll('.nav-links .dropdown').forEach(dropdown => {
                    dropdown.classList.remove('active');
                });
            }
        });
    });

    // Easter Egg: Disco Colors on h1 after 10 clicks within 15 seconds
    const heroTitle = document.getElementById('hero-title');
    let clickCount = 0;
    let firstClickTime = null;
    let discoInterval = null;

    heroTitle.addEventListener('click', () => {
        const currentTime = new Date().getTime();

        if (!firstClickTime) {
            firstClickTime = currentTime;
        }

        clickCount++;

        // Check if 15 seconds have passed since the first click
        if (currentTime - firstClickTime <= 15000) {
            if (clickCount === 10) {
                triggerDiscoEffect();
                // Reset the counter and timer
                clickCount = 0;
                firstClickTime = null;
            }
        } else {
            // Reset if more than 15 seconds have passed
            clickCount = 1; // Current click counts as the first click
            firstClickTime = currentTime;
        }
    });

    function triggerDiscoEffect() {
        // Add a class to override the gradient styles
        heroTitle.classList.add('disco-mode');
    
        // Duration of the disco effect in milliseconds
        const discoDuration = 5000;
        const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'];
        let colorIndex = 0;
    
        // Change the color every 200 milliseconds
        discoInterval = setInterval(() => {
            heroTitle.style.color = colors[colorIndex];
            // Also set -webkit-text-fill-color for compatibility
            heroTitle.style.webkitTextFillColor = colors[colorIndex];
            colorIndex = (colorIndex + 1) % colors.length;
        }, 200);
    
        // Stop the disco effect after the duration
        setTimeout(() => {
            clearInterval(discoInterval);
            // Reset to original styles
            heroTitle.style.color = '';
            heroTitle.style.webkitTextFillColor = '';
            heroTitle.classList.remove('disco-mode'); // Remove the class to restore gradient
        }, discoDuration);
    }

});
