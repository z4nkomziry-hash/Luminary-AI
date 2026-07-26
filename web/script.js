/**
 * Luminary AI - Complete Application Script
 * Cross-platform responsive logic, navigation, demo, particles,
 * command palette, theme switching, and API integrations
 * Developer: Zaniyar Al-Mzurii
 * Version: 6.0.0
 */

// ============================================================
// STRICT MODE
// ============================================================
'use strict';

// ============================================================
// APPLICATION STATE
// ============================================================
var APP = {
    currentPage: 'home',
    isDarkMode: true,
    language: 'EN',
    platform: 'desktop',
    demoActiveTab: 'generate',
    isCommandPaletteOpen: false,
    isSidebarOpen: false,
    particlesAnimationId: null,
    user: {
        name: 'Guest',
        isLoggedIn: false,
        email: '',
        avatar: '👤'
    },
    stats: {
        totalUsers: 0,
        proUsers: 0,
        pendingPayments: 0,
        todayGenerations: 0
    },
    config: {
        appName: 'Luminary AI',
        developerName: 'Zaniyar Al-Mzurii',
        developerTelegram: 'https://t.me/z_14x',
        developerWhatsApp: 'https://wa.me/9647506045491',
        developerEmail: 'mailto:z.14x@outlook.com',
        appUrl: 'https://luminary-ai.vercel.app',
        geminiApiKey: 'AQ.Ab8RN6Kcffu3hac3-hHd4aaX-unuMAxrSAZHja2ROaZkhhU1Pg',
        supabaseUrl: 'https://csjtpzptvqoomotqbeuh.supabase.co',
        supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzanRwenB0dnFvb21vdHFiZXVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwOTE4NzYsImV4cCI6MjEwMDY2Nzg3Nn0.INC3yPbzbFOLP7ocSgtx33V-zHJG9AVvFRX0qjB2ZvE',
        adsenseClientId: 'ca-pub-1234567890123456'
    }
};

// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    APP.detectPlatform();
    APP.initParticles();
    APP.setupNavigation();
    APP.setupDemo();
    APP.setupSidebar();
    APP.setupCommandPalette();
    APP.setupThemeToggle();
    APP.setupKeyboardShortcuts();
    APP.setupAdsense();
    APP.loadStats();
    APP.animateCounters();
    APP.updateUI();
    APP.setupFloatingButton();
    APP.setupResizeHandler();

    // Show welcome toast after a short delay
    setTimeout(function() {
        APP.showToast('✨ Welcome to ' + APP.config.appName + '!', 'info');
    }, 1500);

    // Log initialization
    console.log('✨ ' + APP.config.appName + ' initialized successfully');
    console.log('👨‍💻 Developer: ' + APP.config.developerName);
    console.log('🌐 Platform: ' + APP.platform);
    console.log('📱 Mode: ' + (APP.isDarkMode ? 'Dark' : 'Light'));
    console.log('📦 Version: 6.0.0');
});

// ============================================================
// PLATFORM DETECTION
// ============================================================

APP.detectPlatform = function() {
    var ua = navigator.userAgent || '';
    var body = document.body;

    if (/iPhone|iPad|iPod/.test(ua)) {
        APP.platform = 'ios';
        body.className = body.className.replace(/platform-\w+/g, 'platform-ios');
        body.dataset.platform = 'ios';
    } else if (/Android/.test(ua)) {
        APP.platform = 'android';
        body.className = body.className.replace(/platform-\w+/g, 'platform-android');
        body.dataset.platform = 'android';
    } else {
        APP.platform = 'desktop';
        body.className = body.className.replace(/platform-\w+/g, 'platform-desktop');
        body.dataset.platform = 'desktop';
    }

    // Show/hide tab bar based on platform
    var tabBar = document.getElementById('tabBar');
    if (tabBar) {
        if (APP.platform === 'desktop') {
            tabBar.style.display = 'none';
        } else {
            tabBar.style.display = 'flex';
        }
    }

    // Show sidebar by default on desktop
    var sidebar = document.getElementById('sidebar');
    if (sidebar && APP.platform === 'desktop') {
        sidebar.style.transform = 'none';
        sidebar.style.display = 'flex';
        APP.isSidebarOpen = true;
    }

    console.log('📱 Platform detected:', APP.platform);
};

// ============================================================
// ANIMATED PARTICLES BACKGROUND
// ============================================================

APP.initParticles = function() {
    var canvas = document.getElementById('particlesCanvas');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    var particles = [];
    var particleCount = APP.platform === 'desktop' ? 80 : 40;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Create particles
    for (var i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            radius: Math.random() * 2 + 1,
            opacity: Math.random() * 0.5 + 0.1,
            color: APP.isDarkMode
                ? 'rgba(124, 58, 237,' + (Math.random() * 0.3 + 0.1) + ')'
                : 'rgba(124, 58, 237,' + (Math.random() * 0.15 + 0.05) + ')'
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];

            // Update position
            p.x += p.vx;
            p.y += p.vy;

            // Wrap around edges
            if (p.x < -10) p.x = canvas.width + 10;
            if (p.x > canvas.width + 10) p.x = -10;
            if (p.y < -10) p.y = canvas.height + 10;
            if (p.y > canvas.height + 10) p.y = -10;

            // Draw particle
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();

            // Draw connections between nearby particles
            for (var j = i + 1; j < particles.length; j++) {
                var p2 = particles[j];
                var dx = p.x - p2.x;
                var dy = p.y - p2.y;
                var dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = APP.isDarkMode
                        ? 'rgba(124, 58, 237,' + (0.15 * (1 - dist / 120)) + ')'
                        : 'rgba(124, 58, 237,' + (0.08 * (1 - dist / 120)) + ')';
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }

        APP.particlesAnimationId = requestAnimationFrame(animate);
    }

    animate();
    console.log('✨ Particles initialized:', particleCount, 'particles');
};

// ============================================================
// NAVIGATION
// ============================================================

APP.setupNavigation = function() {
    // Sidebar navigation links
    var navLinks = document.querySelectorAll('.nav-link');
    for (var i = 0; i < navLinks.length; i++) {
        (function(link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                var page = this.getAttribute('data-page');
                if (page) APP.navigateTo(page);
            });
        })(navLinks[i]);
    }

    // Bottom tab bar items
    var tabItems = document.querySelectorAll('.tab-item');
    for (var j = 0; j < tabItems.length; j++) {
        (function(item) {
            item.addEventListener('click', function() {
                var page = this.getAttribute('data-page');
                if (page) APP.navigateTo(page);
            });
        })(tabItems[j]);
    }

    // Hash-based navigation
    window.addEventListener('hashchange', function() {
        var hash = window.location.hash.replace('#', '');
        if (hash) APP.navigateTo(hash);
    });

    // Initial navigation from hash
    var initialHash = window.location.hash.replace('#', '');
    if (initialHash && document.getElementById('page-' + initialHash)) {
        APP.navigateTo(initialHash);
    }
};

APP.navigateTo = function(page) {
    if (!page) return;

    // Validate page exists
    var targetPage = document.getElementById('page-' + page);
    if (!targetPage && page !== 'home') {
        console.warn('Page not found:', page);
        page = 'home';
        targetPage = document.getElementById('page-home');
    }

    APP.currentPage = page;
    window.location.hash = page;

    // Update active page sections
    var pages = document.querySelectorAll('.page');
    for (var i = 0; i < pages.length; i++) {
        pages[i].classList.remove('active');
    }
    if (targetPage || document.getElementById('page-' + page)) {
        var activePage = document.getElementById('page-' + page);
        if (activePage) activePage.classList.add('active');
    }

    // Update sidebar active state
    var navLinks = document.querySelectorAll('.nav-link');
    for (var j = 0; j < navLinks.length; j++) {
        var linkPage = navLinks[j].getAttribute('data-page');
        if (linkPage === page) {
            navLinks[j].classList.add('active');
            navLinks[j].setAttribute('aria-current', 'page');
        } else {
            navLinks[j].classList.remove('active');
            navLinks[j].removeAttribute('aria-current');
        }
    }

    // Update tab bar active state
    var tabItems = document.querySelectorAll('.tab-item');
    for (var k = 0; k < tabItems.length; k++) {
        var tabPage = tabItems[k].getAttribute('data-page');
        if (tabPage === page) {
            tabItems[k].classList.add('active');
            tabItems[k].setAttribute('aria-current', 'page');
        } else {
            tabItems[k].classList.remove('active');
            tabItems[k].removeAttribute('aria-current');
        }
    }

    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Close mobile sidebar
    APP.closeSidebar();

    // Load page-specific data
    if (page === 'dashboard') {
        APP.loadStats();
    }

    // Log navigation
    console.log('📍 Navigated to:', page);

    // Track page view (for analytics)
    if (typeof window.gtag === 'function') {
        window.gtag('config', 'G-XXXXXXXXXX', {
            page_path: '/' + (page === 'home' ? '' : page)
        });
    }
};

// ============================================================
// SIDEBAR
// ============================================================

APP.setupSidebar = function() {
    var menuToggle = document.getElementById('menuToggle');
    var overlay = document.getElementById('sidebarOverlay');

    if (menuToggle) {
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            APP.toggleSidebar();
        });
    }

    if (overlay) {
        overlay.addEventListener('click', function() {
            APP.closeSidebar();
        });
    }

    // Close sidebar on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && APP.isSidebarOpen && APP.platform !== 'desktop') {
            APP.closeSidebar();
        }
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(e) {
        if (APP.isSidebarOpen && APP.platform !== 'desktop') {
            var sidebar = document.getElementById('sidebar');
            if (sidebar && !sidebar.contains(e.target) && e.target !== document.getElementById('menuToggle')) {
                APP.closeSidebar();
            }
        }
    });
};

APP.toggleSidebar = function() {
    if (APP.platform === 'desktop') return;

    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    var menuToggle = document.getElementById('menuToggle');

    if (!sidebar) return;

    if (APP.isSidebarOpen) {
        APP.closeSidebar();
    } else {
        sidebar.classList.add('open');
        if (overlay) overlay.classList.add('active');
        if (menuToggle) menuToggle.setAttribute('aria-expanded', 'true');
        APP.isSidebarOpen = true;
        document.body.style.overflow = 'hidden';
    }
};

APP.closeSidebar = function() {
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    var menuToggle = document.getElementById('menuToggle');

    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
    if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
    APP.isSidebarOpen = false;
    document.body.style.overflow = '';
};

// ============================================================
// COMMAND PALETTE
// ============================================================

APP.setupCommandPalette = function() {
    var overlay = document.getElementById('commandPaletteOverlay');
    var input = document.getElementById('commandPaletteInput');
    var cmdBtn = document.getElementById('cmdPaletteBtn');

    if (cmdBtn) {
        cmdBtn.addEventListener('click', function() {
            APP.toggleCommandPalette();
        });
    }

    if (overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                APP.closeCommandPalette();
            }
        });
    }

    if (input) {
        input.addEventListener('input', function() {
            APP.filterCommandPalette(this.value);
        });

        input.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                APP.closeCommandPalette();
            }
        });
    }

    // Setup command palette item clicks
    var items = document.querySelectorAll('.command-palette-item');
    for (var i = 0; i < items.length; i++) {
        (function(item) {
            item.addEventListener('click', function() {
                var action = this.getAttribute('data-action');
                var page = this.getAttribute('data-page');

                if (action === 'navigate' && page) {
                    APP.navigateTo(page);
                } else if (action === 'theme') {
                    APP.toggleTheme();
                } else if (action === 'demo') {
                    APP.navigateTo('home');
                    setTimeout(function() {
                        var demoSection = document.getElementById('demoSection');
                        if (demoSection) demoSection.scrollIntoView({ behavior: 'smooth' });
                    }, 300);
                } else if (action === 'contact') {
                    window.open(APP.config.developerWhatsApp, '_blank');
                }

                APP.closeCommandPalette();
            });
        })(items[i]);
    }
};

APP.toggleCommandPalette = function() {
    if (APP.isCommandPaletteOpen) {
        APP.closeCommandPalette();
    } else {
        APP.openCommandPalette();
    }
};

APP.openCommandPalette = function() {
    var overlay = document.getElementById('commandPaletteOverlay');
    var input = document.getElementById('commandPaletteInput');

    if (overlay) {
        overlay.classList.add('active');
        APP.isCommandPaletteOpen = true;
        document.body.style.overflow = 'hidden';

        setTimeout(function() {
            if (input) {
                input.value = '';
                input.focus();
                APP.filterCommandPalette('');
            }
        }, 100);
    }
};

APP.closeCommandPalette = function() {
    var overlay = document.getElementById('commandPaletteOverlay');

    if (overlay) {
        overlay.classList.remove('active');
        APP.isCommandPaletteOpen = false;
        document.body.style.overflow = '';
    }
};

APP.filterCommandPalette = function(query) {
    var items = document.querySelectorAll('.command-palette-item');
    var groups = document.querySelectorAll('.command-palette-group');
    var hasVisibleItems = false;

    query = (query || '').toLowerCase().trim();

    for (var i = 0; i < items.length; i++) {
        var text = (items[i].textContent || '').toLowerCase();
        if (!query || text.indexOf(query) !== -1) {
            items[i].style.display = 'flex';
            hasVisibleItems = true;
        } else {
            items[i].style.display = 'none';
        }
    }

    // Hide empty groups
    for (var j = 0; j < groups.length; j++) {
        var groupItems = groups[j].querySelectorAll('.command-palette-item');
        var groupHasVisible = false;
        for (var k = 0; k < groupItems.length; k++) {
            if (groupItems[k].style.display !== 'none') {
                groupHasVisible = true;
                break;
            }
        }
        groups[j].style.display = groupHasVisible ? '' : 'none';
    }
};

// ============================================================
// THEME
// ============================================================

APP.setupThemeToggle = function() {
    var themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            APP.toggleTheme();
        });
    }

    // Check for saved theme preference
    var savedTheme = localStorage.getItem('luminary-theme');
    if (savedTheme === 'light') {
        APP.isDarkMode = true;
        APP.toggleTheme();
    }
};

APP.toggleTheme = function() {
    APP.isDarkMode = !APP.isDarkMode;
    var body = document.body;
    var themeIcon = document.querySelector('.theme-icon');
    var darkModeToggle = document.getElementById('darkModeToggle');

    if (APP.isDarkMode) {
        body.classList.remove('light-mode');
        body.classList.add('dark-mode');
        if (themeIcon) themeIcon.textContent = '🌙';
        if (darkModeToggle) darkModeToggle.checked = true;
    } else {
        body.classList.remove('dark-mode');
        body.classList.add('light-mode');
        if (themeIcon) themeIcon.textContent = '☀️';
        if (darkModeToggle) darkModeToggle.checked = false;
    }

    // Save preference
    localStorage.setItem('luminary-theme', APP.isDarkMode ? 'dark' : 'light');

    // Update particles colors
    APP.updateParticlesColors();

    console.log('🎨 Theme:', APP.isDarkMode ? 'Dark' : 'Light');
};

APP.updateParticlesColors = function() {
    // Restart particles with new colors
    if (APP.particlesAnimationId) {
        cancelAnimationFrame(APP.particlesAnimationId);
    }
    APP.initParticles();
};

// ============================================================
// DEMO
// ============================================================

APP.setupDemo = function() {
    var demoTabs = document.querySelectorAll('.demo-tab');
    for (var i = 0; i < demoTabs.length; i++) {
        (function(tab) {
            tab.addEventListener('click', function() {
                var tabs = document.querySelectorAll('.demo-tab');
                for (var j = 0; j < tabs.length; j++) {
                    tabs[j].classList.remove('active');
                }
                this.classList.add('active');
                APP.demoActiveTab = this.getAttribute('data-tab');
            });
        })(demoTabs[i]);
    }

    // Character counter for demo input
    var demoInput = document.getElementById('demoInput');
    if (demoInput) {
        demoInput.addEventListener('input', function() {
            var count = this.value.length;
            var counter = document.getElementById('demoCharCount');
            if (counter) {
                counter.textContent = count;
                counter.style.color = count > 1800 ? 'var(--danger)' : count > 1500 ? 'var(--warning)' : 'var(--text-muted)';
            }
        });
    }

    // Enter key to generate
    if (demoInput) {
        demoInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                APP.runDemo();
            }
        });
    }
};

APP.runDemo = function() {
    var input = document.getElementById('demoInput');
    var resultDiv = document.getElementById('demoResult');
    var resultContent = document.getElementById('demoResultContent');
    var generateBtn = document.getElementById('demoGenerateBtn');

    if (!input || !input.value.trim()) {
        APP.showToast('⚠️ Please enter some text first', 'error');
        if (input) input.focus();
        return;
    }

    var text = input.value.trim();
    var tab = APP.demoActiveTab;

    // Show loading state
    if (generateBtn) {
        generateBtn.disabled = true;
        var originalHTML = generateBtn.innerHTML;
        generateBtn.innerHTML = '<span class="spinner"></span> Generating...';
    }

    // Simulate API call with delay
    setTimeout(function() {
        var responses = {
            generate: '✨ Here is a generated response based on your prompt:\n\n"' + text + '"\n\nThis demonstrates ' + APP.config.appName + '\'s powerful AI text generation capabilities. Our platform supports 12 languages with specialized Kurdish Badini and Sorani dialect expertise — a feature unmatched by any competitor.',
            rewrite: '🔄 Rewritten version of your text:\n\n"' + text + '"\n\n→ Improved for clarity, flow, and professional tone while preserving your original meaning and intent. The rewritten version is more concise and engaging.',
            grammar: '✅ Grammar Check Results:\n\nAnalyzed text: "' + text + '"\n\n✓ Spelling: Verified and corrected\n✓ Grammar: All rules checked\n✓ Punctuation: Properly formatted\n✓ Style: Enhanced for readability\n✓ Clarity: Improved where needed',
            translate: '🌍 Translation Results:\n\nSource text: "' + text + '"\n\n→ Kurdish (Sorani): "ئەمە وەرگێڕانێکی نموونەییە بۆ پیشاندانی تواناکانی لومیناری ئەی‌آی. پلاتفۆرمەکەمان ١٢ زمانی جیهانی پشتگیری دەکات."\n\n→ Kurdish (Badini/Kurmanji): "ئەڤە وەرگێڕانەکا نموونەییە ژ بۆ نیشاندانا توانایێن لومیناری ئەی‌آی. پلاتفۆرمێ مە ١٢ زمانێن جیهانی پشتگیری دکەت."'
        };

        var responseText = responses[tab] || responses.generate;

        if (resultContent) {
            resultContent.textContent = responseText;
        }
        if (resultDiv) {
            resultDiv.style.display = 'block';
            // Scroll to result
            resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.innerHTML = originalHTML || '<span>✨</span> Generate';
        }

        APP.showToast('✅ Generated successfully!', 'success');
    }, 1500);
};

APP.clearDemo = function() {
    var input = document.getElementById('demoInput');
    var resultDiv = document.getElementById('demoResult');
    var counter = document.getElementById('demoCharCount');

    if (input) input.value = '';
    if (resultDiv) resultDiv.style.display = 'none';
    if (counter) counter.textContent = '0';
};

APP.copyDemoResult = function() {
    var resultContent = document.getElementById('demoResultContent');
    if (!resultContent || !resultContent.textContent) {
        APP.showToast('⚠️ Nothing to copy', 'error');
        return;
    }

    var text = resultContent.textContent;

    // Use Clipboard API with fallback
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function() {
            APP.showToast('📋 Copied to clipboard!', 'success');
        }).catch(function() {
            APP.fallbackCopy(text);
        });
    } else {
        APP.fallbackCopy(text);
    }
};

APP.fallbackCopy = function(text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
        document.execCommand('copy');
        APP.showToast('📋 Copied to clipboard!', 'success');
    } catch (e) {
        APP.showToast('❌ Failed to copy. Please try again.', 'error');
    }
    document.body.removeChild(textarea);
};

// ============================================================
// STATS LOADING
// ============================================================

APP.loadStats = function() {
    // Try to load from API
    APP.fetchStats().then(function(stats) {
        if (stats) {
            APP.stats = stats;
        }
        APP.updateStatsDisplay();
    }).catch(function() {
        // Use demo stats
        APP.stats = {
            totalUsers: Math.floor(Math.random() * 5000) + 1000,
            proUsers: Math.floor(Math.random() * 500) + 100,
            pendingPayments: Math.floor(Math.random() * 20) + 1,
            todayGenerations: Math.floor(Math.random() * 500) + 50
        };
        APP.updateStatsDisplay();
    });

    // Load activity list
    APP.loadActivityList();
};

APP.fetchStats = function() {
    return new Promise(function(resolve, reject) {
        // Try Supabase first
        if (window.DB && typeof window.DB.getStats === 'function') {
            window.DB.getStats().then(resolve).catch(function() {
                // Fallback to fetch API
                fetch(APP.config.appUrl + '/api/stats')
                    .then(function(res) { return res.json(); })
                    .then(resolve)
                    .catch(reject);
            });
        } else {
            // Try fetch API
            fetch(APP.config.appUrl + '/api/stats')
                .then(function(res) { return res.json(); })
                .then(resolve)
                .catch(reject);
        }
    });
};

APP.updateStatsDisplay = function() {
    var elements = {
        dashTotalUsers: APP.stats.totalUsers,
        dashProUsers: APP.stats.proUsers,
        dashPending: APP.stats.pendingPayments,
        dashGenerations: APP.stats.todayGenerations
    };

    for (var id in elements) {
        if (elements.hasOwnProperty(id)) {
            var el = document.getElementById(id);
            if (el) {
                var value = elements[id];
                el.textContent = typeof value === 'number' ? value.toLocaleString() : String(value);
            }
        }
    }
};

APP.loadActivityList = function() {
    var activityList = document.getElementById('activityList');
    if (!activityList) return;

    var activities = [
        { user: 'Ahmed', action: 'completed a lesson', time: '2 min ago', icon: '📚' },
        { user: 'Sara', action: 'generated AI text', time: '5 min ago', icon: '✨' },
        { user: 'Rebin', action: 'upgraded to Pro plan', time: '8 min ago', icon: '💎' },
        { user: 'Dana', action: 'submitted payment proof', time: '12 min ago', icon: '💰' },
        { user: 'Lana', action: 'started Zîman Engine', time: '15 min ago', icon: '🌐' }
    ];

    var html = '';
    for (var i = 0; i < activities.length; i++) {
        var a = activities[i];
        html += '<div class="activity-item">';
        html += '<div class="activity-avatar" style="width:36px;height:36px;border-radius:50%;background:var(--bg-glass);display:flex;align-items:center;justify-content:center;flex-shrink:0">' + a.icon + '</div>';
        html += '<div class="activity-content" style="flex:1">';
        html += '<strong>' + APP.escapeHtml(a.user) + '</strong> ' + APP.escapeHtml(a.action);
        html += '<span style="font-size:11px;color:var(--text-muted);margin-left:8px">' + APP.escapeHtml(a.time) + '</span>';
        html += '</div>';
        html += '</div>';
    }

    activityList.innerHTML = html;
};

// ============================================================
// ANIMATED COUNTERS
// ============================================================

APP.animateCounters = function() {
    var counters = document.querySelectorAll('.counter[data-target]');
    if (counters.length === 0) return;

    var observerOptions = {
        threshold: 0.3,
        rootMargin: '0px'
    };

    var observer = new IntersectionObserver(function(entries) {
        for (var i = 0; i < entries.length; i++) {
            if (entries[i].isIntersecting) {
                var counter = entries[i].target;
                APP.animateCounter(counter);
                observer.unobserve(counter);
            }
        }
    }, observerOptions);

    for (var j = 0; j < counters.length; j++) {
        observer.observe(counters[j]);
    }
};

APP.animateCounter = function(element) {
    var target = parseFloat(element.getAttribute('data-target'));
    var duration = 2000;
    var startTime = null;
    var startValue = 0;

    function updateCounter(timestamp) {
        if (!startTime) startTime = timestamp;
        var progress = Math.min((timestamp - startTime) / duration, 1);
        var easedProgress = 1 - Math.pow(1 - progress, 3); // Ease-out cubic

        var currentValue = startValue + (target - startValue) * easedProgress;
        element.textContent = target % 1 === 0
            ? Math.floor(currentValue) + '+'
            : currentValue.toFixed(1) + '%';

        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target % 1 === 0 ? target + '+' : target + '%';
        }
    }

    requestAnimationFrame(updateCounter);
};

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================

APP.setupKeyboardShortcuts = function() {
    document.addEventListener('keydown', function(e) {
        // Command Palette: Ctrl+K or Cmd+K
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            APP.toggleCommandPalette();
        }

        // Navigate to home: Ctrl+Shift+H
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'H') {
            e.preventDefault();
            APP.navigateTo('home');
        }

        // Navigate to dashboard: Ctrl+Shift+D
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
            e.preventDefault();
            APP.navigateTo('dashboard');
        }

        // Toggle theme: Ctrl+Shift+T
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
            e.preventDefault();
            APP.toggleTheme();
        }

        // Escape to close modals/sidebar
        if (e.key === 'Escape') {
            if (APP.isCommandPaletteOpen) {
                APP.closeCommandPalette();
            } else if (APP.isSidebarOpen && APP.platform !== 'desktop') {
                APP.closeSidebar();
            }
        }
    });
};

// ============================================================
// ADSENSE
// ============================================================

APP.setupAdsense = function() {
    // Push AdSense ads if available
    if (typeof window.adsbygoogle !== 'undefined' && window.adsbygoogle.length > 0) {
        try {
            for (var i = 0; i < window.adsbygoogle.length; i++) {
                window.adsbygoogle.push({});
            }
            console.log('📢 AdSense ads initialized');
        } catch (e) {
            console.warn('AdSense initialization skipped:', e.message);
        }
    }
};

// ============================================================
// FLOATING BUTTON
// ============================================================

APP.setupFloatingButton = function() {
    var fab = document.getElementById('floatingAiBtn');
    if (!fab) return;

    // Hide on scroll for mobile
    var lastScrollY = 0;
    var ticking = false;

    window.addEventListener('scroll', function() {
        lastScrollY = window.scrollY;

        if (!ticking) {
            requestAnimationFrame(function() {
                if (lastScrollY > 300 && APP.platform !== 'desktop') {
                    fab.style.opacity = '0.5';
                    fab.style.transform = 'scale(0.8)';
                } else {
                    fab.style.opacity = '1';
                    fab.style.transform = 'scale(1)';
                }
                ticking = false;
            });
            ticking = true;
        }
    });
};

// ============================================================
// RESIZE HANDLER
// ============================================================

APP.setupResizeHandler = function() {
    var resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            APP.detectPlatform();
            // Restart particles on resize
            if (APP.particlesAnimationId) {
                cancelAnimationFrame(APP.particlesAnimationId);
            }
            APP.initParticles();
        }, 300);
    });
};

// ============================================================
// SETTINGS
// ============================================================

APP.changeLanguage = function(lang) {
    APP.language = lang;
    localStorage.setItem('luminary-language', lang);
    APP.showToast('🌐 Language changed to: ' + lang, 'success');
    console.log('🌐 Language:', lang);
};

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================

APP.showToast = function(message, type) {
    type = type || 'info';
    var container = document.getElementById('toastContainer');
    if (!container) return;

    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = message;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    container.appendChild(toast);

    // Auto-remove after 3.5 seconds
    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px) scale(0.9)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(function() {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3500);

    // Limit to 5 toasts
    var toasts = container.querySelectorAll('.toast');
    if (toasts.length > 5) {
        toasts[0].remove();
    }
};

// ============================================================
// UI UPDATES
// ============================================================

APP.updateUI = function() {
    // Update copyright year
    var yearEls = document.querySelectorAll('[data-year]');
    var currentYear = new Date().getFullYear();
    for (var i = 0; i < yearEls.length; i++) {
        yearEls[i].textContent = currentYear;
    }

    // Update theme icon
    var themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
        themeIcon.textContent = APP.isDarkMode ? '🌙' : '☀️';
    }

    // Update dark mode toggle
    var darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.checked = APP.isDarkMode;
    }

    // Set body data attributes
    document.body.dataset.platform = APP.platform;
    document.body.dataset.theme = APP.isDarkMode ? 'dark' : 'light';
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

APP.escapeHtml = function(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

APP.debounce = function(func, wait) {
    var timeout;
    return function() {
        var context = this;
        var args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            func.apply(context, args);
        }, wait);
    };
};

APP.throttle = function(func, limit) {
    var inThrottle;
    return function() {
        var context = this;
        var args = arguments;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(function() {
                inThrottle = false;
            }, limit);
        }
    };
};

// ============================================================
// SERVICE WORKER REGISTRATION
// ============================================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').then(function(registration) {
            console.log('✅ Service Worker registered with scope:', registration.scope);
        }).catch(function(err) {
            console.log('⚠️ Service Worker registration failed:', err.message);
        });
    });
}

// ============================================================
// EXPORT TO GLOBAL SCOPE
// ============================================================

window.APP = APP;

// ============================================================
// INITIALIZATION COMPLETE LOG
// ============================================================

console.log('%c✨ ' + APP.config.appName + ' Ready %c🚀',
    'font-size:16px;font-weight:bold;color:#00E5FF;',
    'font-size:12px;');
console.log('%c👨‍💻 Built by ' + APP.config.developerName,
    'font-size:11px;color:#9CA3AF;');
console.log('%c📦 Version 6.0.0 | 🌐 ' + APP.platform + ' | ' + (APP.isDarkMode ? '🌙 Dark' : '☀️ Light'),
    'font-size:10px;color:#6B7280;');
console.log('%c💡 Tip: Press Ctrl+K to open the Command Palette',
    'font-size:10px;color:#7C3AED;');
