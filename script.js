// Wait for the DOM to fully load
document.addEventListener('DOMContentLoaded', () => {
    // Variable Declarations
    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.getElementById('nav-links');
    const backToTopButton = document.getElementById('back-to-top');
    const nightModeCheckbox = document.getElementById('night-mode-checkbox');
    const body = document.body;
    const nightModeIcon = document.getElementById('dark-mode-icon');
    const navbarHeight = document.querySelector('.navbar').offsetHeight;

    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrollPercentage = (scrollTop / scrollHeight) * 100;
        document.getElementById('progress-bar').style.width = scrollPercentage + '%';
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

    // Scroll Animations
    const faders = document.querySelectorAll('.fade-in');

    const appearOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const appearOnScroll = new IntersectionObserver(function(entries, appearOnScroll) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                entry.target.classList.add('visible');
                appearOnScroll.unobserve(entry.target);
            }
        });
    }, appearOptions);

    faders.forEach(fader => {
        appearOnScroll.observe(fader);
    });

    // Back-to-Top Button Visibility Toggle
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopButton.style.display = 'block';
        } else {
            backToTopButton.style.display = 'none';
        }
    });

    // Back-to-Top Button Click Event
    backToTopButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Night Mode Toggle with Persistence

    // Function to enable dark mode
    function enableDarkMode() {
        body.classList.add('dark-mode');
        document.querySelector('.navbar').classList.add('dark-mode');
        navLinks.classList.add('dark-mode');
        document.querySelector('.hero-section').classList.add('dark-mode');
        document.querySelector('.hero-content').classList.add('dark-mode');
        document.querySelector('.footer').classList.add('dark-mode');
        backToTopButton.classList.add('dark-mode');

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

        nightModeIcon.classList.remove('fa-moon');
        nightModeIcon.classList.add('fa-sun');

        localStorage.setItem('darkMode', 'enabled');
        nightModeCheckbox.checked = true;
    }

    // Function to disable dark mode
    function disableDarkMode() {
        body.classList.remove('dark-mode');
        document.querySelector('.navbar').classList.remove('dark-mode');
        navLinks.classList.remove('dark-mode');
        document.querySelector('.hero-section').classList.remove('dark-mode');
        document.querySelector('.hero-content').classList.remove('dark-mode');
        document.querySelector('.footer').classList.remove('dark-mode');
        backToTopButton.classList.remove('dark-mode');

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

        nightModeIcon.classList.remove('fa-sun');
        nightModeIcon.classList.add('fa-moon');

        localStorage.setItem('darkMode', 'disabled');
        nightModeCheckbox.checked = false;
    }

    // Check localStorage for theme preference
    if (localStorage.getItem('darkMode') === 'enabled') {
        enableDarkMode();
    } else {
        disableDarkMode();
    }

    // Event Listener for the checkbox
    nightModeCheckbox.addEventListener('change', () => {
        if (nightModeCheckbox.checked) {
            enableDarkMode();
        } else {
            disableDarkMode();
        }
    });
});

navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
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