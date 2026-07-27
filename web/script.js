/**
 * Luminary AI - Complete Application Script (FIXED)
 * Cross-platform responsive logic, navigation, demo, particles,
 * command palette, theme switching, and API integrations
 * Developer: Zaniyar Al-Mzurii
 * Version: 6.0.1 - Fixed infinite loop & memory leak
 */

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
    particlesInitialized: false,
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
        supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzanRwenB0dnFvb21vdHFiZXVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwOTE4NzYsImV4cCI6MjEwMDY2Nzg3Nn0.INC3yPbzbFOLP7ocSgtx33V-zHJG9AVvFRX0qjB2ZvE'
    },
    _initialized: false,
    _timers: []
};

// ============================================================
// SAFE TIMER MANAGEMENT (Prevents memory leaks)
// ============================================================

APP._safeSetTimeout = function(callback, delay) {
    var id = setTimeout(function() {
        callback();
        var idx = APP._timers.indexOf(id);
        if (idx > -1) APP._timers.splice(idx, 1);
    }, delay);
    APP._timers.push(id);
    return id;
};

APP._safeSetInterval = function(callback, delay) {
    var id = setInterval(callback, delay);
    APP._timers.push(id);
    return id;
};

APP._clearAllTimers = function() {
    for (var i = 0; i < APP._timers.length; i++) {
        clearTimeout(APP._timers[i]);
        clearInterval(APP._timers[i]);
    }
    APP._timers = [];
};

// ============================================================
// INITIALIZATION (FIXED - Single execution)
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    if (APP._initialized) {
        console.warn('⚠️ APP already initialized. Skipping duplicate init.');
        return;
    }
    APP._initialized = true;

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

    APP._safeSetTimeout(function() {
        APP.showToast('✨ Welcome to ' + APP.config.appName + '!', 'info');
    }, 1500);

    console.log('✨ ' + APP.config.appName + ' initialized successfully');
    console.log('👨‍💻 Developer: ' + APP.config.developerName);
    console.log('🌐 Platform: ' + APP.platform);
    console.log('📦 Version: 6.0.1');
});

// ============================================================
// SAFE CLEANUP ON PAGE UNLOAD
// ============================================================

window.addEventListener('beforeunload', function() {
    APP._clearAllTimers();
    if (APP.particlesAnimationId) {
        cancelAnimationFrame(APP.particlesAnimationId);
        APP.particlesAnimationId = null;
    }
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

    var tabBar = document.getElementById('tabBar');
    if (tabBar) {
        tabBar.style.display = APP.platform === 'desktop' ? 'none' : 'flex';
    }

    var sidebar = document.getElementById('sidebar');
    if (sidebar && APP.platform === 'desktop') {
        sidebar.style.transform = 'none';
        sidebar.style.display = 'flex';
        APP.isSidebarOpen = true;
    }

    console.log('📱 Platform detected:', APP.platform);
};

// ============================================================
// ANIMATED PARTICLES BACKGROUND (FIXED)
// ============================================================

APP.initParticles = function() {
    if (APP.particlesInitialized) return;

    var canvas = document.getElementById('particlesCanvas');
    if (!canvas) return;

    APP.particlesInitialized = true;
    var ctx = canvas.getContext('2d');
    var particles = [];
    var particleCount = APP.platform === 'desktop' ? 50 : 25;
    var isRunning = true;

    function resizeCanvas() {
        if (canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
    }

    resizeCanvas();

    for (var i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            radius: Math.random() * 2 + 0.5,
            opacity: Math.random() * 0.4 + 0.1
        });
    }

    function animate() {
        if (!isRunning) return;
        if (!ctx || !canvas) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < -10) p.x = canvas.width + 10;
            if (p.x > canvas.width + 10) p.x = -10;
            if (p.y < -10) p.y = canvas.height + 10;
            if (p.y > canvas.height + 10) p.y = -10;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = APP.isDarkMode
                ? 'rgba(124, 58, 237,' + p.opacity + ')'
                : 'rgba(124, 58, 237,' + (p.opacity * 0.5) + ')';
            ctx.fill();
        }

        if (isRunning) {
            APP.particlesAnimationId = requestAnimationFrame(animate);
        }
    }

    animate();
    console.log('✨ Particles initialized');
};

// ============================================================
// NAVIGATION
// ============================================================

APP.setupNavigation = function() {
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

    var tabItems = document.querySelectorAll('.tab-item');
    for (var j = 0; j < tabItems.length; j++) {
        (function(item) {
            item.addEventListener('click', function() {
                var page = this.getAttribute('data-page');
                if (page) APP.navigateTo(page);
            });
        })(tabItems[j]);
    }

    window.addEventListener('hashchange', function() {
        var hash = window.location.hash.replace('#', '');
        if (hash && document.getElementById('page-' + hash)) {
            APP.navigateTo(hash);
        }
    });
};

APP.navigateTo = function(page) {
    if (!page) return;
    if (APP.currentPage === page) return;

    APP.currentPage = page;
    window.location.hash = page;

    var pages = document.querySelectorAll('.page');
    for (var i = 0; i < pages.length; i++) {
        pages[i].classList.remove('active');
    }

    var targetPage = document.getElementById('page-' + page);
    if (targetPage) {
        targetPage.classList.add('active');
    }

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

    window.scrollTo({ top: 0, behavior: 'smooth' });
    APP.closeSidebar();

    if (page === 'dashboard') {
        APP.loadStats();
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
};

APP.toggleSidebar = function() {
    if (APP.platform === 'desktop') return;

    if (APP.isSidebarOpen) {
        APP.closeSidebar();
    } else {
        var sidebar = document.getElementById('sidebar');
        var overlay = document.getElementById('sidebarOverlay');
        var menuToggle = document.getElementById('menuToggle');

        if (sidebar) sidebar.classList.add('open');
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
    }

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
        if (input) {
            input.value = '';
            input.focus();
        }
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
    query = (query || '').toLowerCase().trim();

    for (var i = 0; i < items.length; i++) {
        var text = (items[i].textContent || '').toLowerCase();
        items[i].style.display = (!query || text.indexOf(query) !== -1) ? 'flex' : 'none';
    }

    for (var j = 0; j < groups.length; j++) {
        var groupItems = groups[j].querySelectorAll('.command-palette-item');
        var hasVisible = false;
        for (var k = 0; k < groupItems.length; k++) {
            if (groupItems[k].style.display !== 'none') { hasVisible = true; break; }
        }
        groups[j].style.display = hasVisible ? '' : 'none';
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

    localStorage.setItem('luminary-theme', APP.isDarkMode ? 'dark' : 'light');
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

    if (generateBtn) {
        generateBtn.disabled = true;
        var originalHTML = generateBtn.innerHTML;
        generateBtn.innerHTML = '<span class="spinner"></span> Generating...';
    }

    APP._safeSetTimeout(function() {
        var responses = {
            generate: '✨ Here is a generated response based on your prompt:\n\n"' + text + '"\n\nThis demonstrates ' + APP.config.appName + '\'s powerful AI text generation capabilities with 12 language support.',
            rewrite: '🔄 Rewritten version:\n\n"' + text + '"\n\n→ Improved for clarity, flow, and professional tone.',
            grammar: '✅ Grammar Check Results:\n\nAnalyzed: "' + text + '"\n\n✓ All grammar, spelling, and punctuation verified.',
            translate: '🌍 Translation:\n\nSource: "' + text + '"\n\n→ Kurdish (Sorani): "ئەمە وەرگێڕانێکی نموونەییە."'
        };

        if (resultContent) resultContent.textContent = responses[tab] || responses.generate;
        if (resultDiv) {
            resultDiv.style.display = 'block';
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
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
        document.execCommand('copy');
        APP.showToast('📋 Copied to clipboard!', 'success');
    } catch (e) {
        APP.showToast('❌ Failed to copy', 'error');
    }
    document.body.removeChild(textarea);
};

// ============================================================
// STATS LOADING
// ============================================================

APP.loadStats = function() {
    if (window.DB && typeof window.DB.getStats === 'function') {
        window.DB.getStats().then(function(stats) {
            if (stats) APP.stats = stats;
            APP.updateStatsDisplay();
        }).catch(function() {
            APP.loadDemoStats();
        });
    } else {
        APP.loadDemoStats();
    }
};

APP.loadDemoStats = function() {
    APP.stats = {
        totalUsers: Math.floor(Math.random() * 5000) + 1000,
        proUsers: Math.floor(Math.random() * 500) + 100,
        pendingPayments: Math.floor(Math.random() * 20) + 1,
        todayGenerations: Math.floor(Math.random() * 500) + 50
    };
    APP.updateStatsDisplay();
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
            if (el) el.textContent = typeof elements[id] === 'number' ? elements[id].toLocaleString() : String(elements[id]);
        }
    }
};

// ============================================================
// ANIMATED COUNTERS
// ============================================================

APP.animateCounters = function() {
    var counters = document.querySelectorAll('.counter[data-target]');
    if (counters.length === 0) return;

    var observer = new IntersectionObserver(function(entries) {
        for (var i = 0; i < entries.length; i++) {
            if (entries[i].isIntersecting) {
                APP.animateCounter(entries[i].target);
                observer.unobserve(entries[i].target);
            }
        }
    }, { threshold: 0.3 });

    for (var j = 0; j < counters.length; j++) {
        observer.observe(counters[j]);
    }
};

APP.animateCounter = function(element) {
    var target = parseFloat(element.getAttribute('data-target'));
    var duration = 2000;
    var startTime = null;

    function updateCounter(timestamp) {
        if (!startTime) startTime = timestamp;
        var progress = Math.min((timestamp - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var current = progress >= 1 ? target : target * eased;
        element.textContent = target % 1 === 0 ? Math.floor(current) + '+' : current.toFixed(1) + '%';
        if (progress < 1) requestAnimationFrame(updateCounter);
    }
    requestAnimationFrame(updateCounter);
};

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================

APP.setupKeyboardShortcuts = function() {
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            APP.toggleCommandPalette();
        }
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
            e.preventDefault();
            APP.toggleTheme();
        }
        if (e.key === 'Escape') {
            if (APP.isCommandPaletteOpen) APP.closeCommandPalette();
            else if (APP.isSidebarOpen) APP.closeSidebar();
        }
    });
};

// ============================================================
// ADSENSE
// ============================================================

APP.setupAdsense = function() {
    if (typeof window.adsbygoogle !== 'undefined' && window.adsbygoogle && window.adsbygoogle.length > 0) {
        try {
            for (var i = 0; i < window.adsbygoogle.length; i++) {
                window.adsbygoogle.push({});
            }
        } catch (e) {}
    }
};

// ============================================================
// FLOATING BUTTON
// ============================================================

APP.setupFloatingButton = function() {
    var fab = document.getElementById('floatingAiBtn');
    if (!fab) return;
    var ticking = false;

    window.addEventListener('scroll', function() {
        if (!ticking) {
            requestAnimationFrame(function() {
                var scrollY = window.scrollY;
                if (scrollY > 300 && APP.platform !== 'desktop') {
                    fab.style.opacity = '0.5';
                } else {
                    fab.style.opacity = '1';
                }
                ticking = false;
            });
            ticking = true;
        }
    });
};

// ============================================================
// RESIZE HANDLER (DEBOUNCED)
// ============================================================

APP.setupResizeHandler = function() {
    var resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            APP.detectPlatform();
        }, 300);
    });
};

// ============================================================
// SETTINGS
// ============================================================

APP.changeLanguage = function(lang) {
    APP.language = lang;
    localStorage.setItem('luminary-language', lang);
    APP.showToast('🌐 Language: ' + lang, 'success');
};

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================

APP.showToast = function(message, type) {
    type = type || 'info';
    var container = document.getElementById('toastContainer');
    if (!container) return;

    var toasts = container.querySelectorAll('.toast');
    if (toasts.length >= 4) {
        for (var t = 0; t < toasts.length - 3; t++) {
            toasts[t].remove();
        }
    }

    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = message;
    toast.setAttribute('role', 'status');
    container.appendChild(toast);

    APP._safeSetTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px) scale(0.9)';
        toast.style.transition = 'all 0.3s ease';
        APP._safeSetTimeout(function() {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    }, 3500);
};

// ============================================================
// UI UPDATES
// ============================================================

APP.updateUI = function() {
    var yearEls = document.querySelectorAll('[data-year]');
    var currentYear = new Date().getFullYear();
    for (var i = 0; i < yearEls.length; i++) {
        yearEls[i].textContent = currentYear;
    }

    var themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) themeIcon.textContent = APP.isDarkMode ? '🌙' : '☀️';

    var darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) darkModeToggle.checked = APP.isDarkMode;

    document.body.dataset.platform = APP.platform;
    document.body.dataset.theme = APP.isDarkMode ? 'dark' : 'light';
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

APP.escapeHtml = function(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
};

// ============================================================
// SERVICE WORKER
// ============================================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').then(function(reg) {
            console.log('✅ Service Worker registered');
        }).catch(function() {});
    });
}

// ============================================================
// EXPORT TO GLOBAL
// ============================================================

window.APP = APP;
