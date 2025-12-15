// Automatic APK Download with Progress Indicator
// Prevents double downloads and shows progress

document.addEventListener('DOMContentLoaded', function() {
    const installButtons = document.querySelectorAll('.install-button, .install-button-small');
    const searchInput = document.querySelector('.search-input');
    const filterChips = document.querySelectorAll('.filter-chip');
    const sortSelect = document.getElementById('sortSelect');
    const analyticsBanner = document.getElementById('analyticsBanner');
    const analyticsAccept = document.getElementById('analyticsAccept');
    const analyticsDecline = document.getElementById('analyticsDecline');
    const adminLock = document.getElementById('adminLock');
    const adminLockInput = document.getElementById('adminLockInput');
    const adminLockSubmit = document.getElementById('adminLockSubmit');
    const adminLockReset = document.getElementById('adminLockReset');
    const adminLockError = document.getElementById('adminLockError');
    const bookPrint = document.getElementById('bookPrint');
    const appDetail = document.getElementById('appDetail');
    const appDetailClose = document.getElementById('appDetailClose');
    let isDownloading = false;
    let filterDebounce;
    const filterState = { query: '', category: 'all', rating: 'all', sort: 'popular' };
    const ANALYTICS_KEY = 'apk-analytics-optin';
    const ANALYTICS_EVENTS = 'apk-analytics-events';
    const ADMIN_UNLOCK = 'apk-admin-unlocked';
    const ADMIN_PIN = '2468';
    
    function handleInstallClick(buttonElement, e) {
        e.preventDefault();
        
        // Prevent double download
        if (isDownloading) {
            return false;
        }
        
        const url = buttonElement.getAttribute('href');
        
        if (!url) {
            alert('Download URL not configured');
            return false;
        }
        logEvent('install-click', { href: url });
        
        // Mark as downloading
        isDownloading = true;
        
        // Store original button state
        const originalText = buttonElement.textContent;
        const originalHTML = buttonElement.innerHTML;
        
        // Create progress container
        const progressContainer = document.createElement('div');
        progressContainer.className = 'download-progress';
        progressContainer.innerHTML = `
            <div class="progress-bar-container">
                <div class="progress-bar" id="progressBar-${Date.now()}"></div>
            </div>
            <span class="progress-text">Preparing download...</span>
        `;
        
        // Replace button content with progress
        buttonElement.innerHTML = '';
        buttonElement.appendChild(progressContainer);
        buttonElement.style.opacity = '1';
        buttonElement.style.pointerEvents = 'none';
        buttonElement.style.cursor = 'not-allowed';
        
        // Get progress bar element
        const progressBar = progressContainer.querySelector('.progress-bar');
        const progressText = progressContainer.querySelector('.progress-text');
        
        // Simulate progress (since we can't track actual download progress from GitHub)
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) progress = 90; // Cap at 90% until download actually starts
            
            progressBar.style.width = progress + '%';
            
            if (progress < 30) {
                progressText.textContent = 'Preparing download...';
            } else if (progress < 60) {
                progressText.textContent = 'Connecting to server...';
            } else if (progress < 90) {
                progressText.textContent = 'Starting download...';
            }
        }, 200);
        
        // Create hidden iframe to trigger download (single method to avoid double download)
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'display:none;width:0;height:0;border:none;position:absolute;left:-9999px;visibility:hidden;';
        iframe.name = 'downloadFrame-' + Date.now();
        
        // Set iframe source to trigger download
        iframe.onload = function() {
            // Download started
            clearInterval(progressInterval);
            progressBar.style.width = '100%';
            progressText.textContent = 'Download started!';
            
            // Reset button after a delay
            setTimeout(() => {
                try {
                    if (iframe && iframe.parentNode) {
                        document.body.removeChild(iframe);
                    }
                } catch (err) {}
                
                // Reset button
                buttonElement.innerHTML = originalHTML;
                buttonElement.style.pointerEvents = 'auto';
                buttonElement.style.cursor = 'pointer';
                isDownloading = false;
            }, 1500);
        };
        
        iframe.onerror = function() {
            clearInterval(progressInterval);
            progressText.textContent = 'Download failed. Click to retry.';
            buttonElement.style.pointerEvents = 'auto';
            buttonElement.style.cursor = 'pointer';
            isDownloading = false;
        };
        
        // Append iframe and set source
        document.body.appendChild(iframe);
        iframe.src = url;
        
        // Cleanup timeout (safety net)
        setTimeout(() => {
            clearInterval(progressInterval);
            try {
                if (iframe && iframe.parentNode) {
                    document.body.removeChild(iframe);
                }
            } catch (err) {}
            
            if (isDownloading) {
                // Reset if still downloading
                buttonElement.innerHTML = originalHTML;
                buttonElement.style.pointerEvents = 'auto';
                buttonElement.style.cursor = 'pointer';
                isDownloading = false;
            }
        }, 10000);
    }

    function bindInstallButtons() {
        document.querySelectorAll('.install-button, .install-button-small').forEach(button => {
            if (button.dataset.installBound === 'true') return;
            button.dataset.installBound = 'true';
            button.addEventListener('click', function(e) {
                handleInstallClick(this, e);
            });
        });
    }

    bindInstallButtons();

    // Simple debounce helper for inputs
    function debounce(fn, delay = 150) {
        return function(...args) {
            clearTimeout(filterDebounce);
            filterDebounce = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    function logEvent(type, payload = {}) {
        const opt = localStorage.getItem(ANALYTICS_KEY);
        if (opt !== 'true') return;
        const events = JSON.parse(localStorage.getItem(ANALYTICS_EVENTS) || '[]');
        events.push({ type, payload, ts: Date.now() });
        localStorage.setItem(ANALYTICS_EVENTS, JSON.stringify(events.slice(-200)));
    }

    function setAnalyticsOptIn(allowed) {
        localStorage.setItem(ANALYTICS_KEY, allowed ? 'true' : 'false');
        if (analyticsBanner) analyticsBanner.style.display = 'none';
    }

    function showAnalyticsBannerIfNeeded() {
        const opt = localStorage.getItem(ANALYTICS_KEY);
        if (opt === null && analyticsBanner) {
            analyticsBanner.style.display = 'flex';
        } else if (analyticsBanner) {
            analyticsBanner.style.display = 'none';
        }
    }

    function restoreText(el, selectors) {
        selectors.forEach(sel => {
            const node = el.querySelector(sel);
            if (node && node.dataset.originalText) {
                node.textContent = node.dataset.originalText;
            }
        });
    }

    function highlightMatches(el, query, selectors) {
        if (!query) return;
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')})`, 'gi');
        selectors.forEach(sel => {
            const node = el.querySelector(sel);
            if (node) {
                if (!node.dataset.originalText) {
                    node.dataset.originalText = node.textContent;
                } else {
                    node.textContent = node.dataset.originalText;
                }
                node.innerHTML = node.textContent.replace(regex, '<mark>$1</mark>');
            }
        });
    }

    // Filter Apps and Top Charts by search query + filters
    async function filterApps(query) {
        filterState.query = (query || '').trim().toLowerCase();

        await loadAppComponents();

        const appGrid = document.querySelector('.app-grid');
        const appList = document.querySelector('.app-list');
        const appCards = Array.from(appGrid?.querySelectorAll('.app-card') || []);
        const appListItems = Array.from(appList?.querySelectorAll('.app-list-item') || []);
        const minRating = filterState.rating === 'all' ? 0 : parseFloat(filterState.rating);

        const matches = (el) => {
            const name = el.querySelector('.app-name')?.textContent.toLowerCase() || '';
            const dev = el.querySelector('.app-developer')?.textContent.toLowerCase() || '';
            const category = el.dataset.category || 'all';
            const rating = parseFloat(el.dataset.rating || '0');
            const textOk = !filterState.query || name.includes(filterState.query) || dev.includes(filterState.query);
            const catOk = filterState.category === 'all' || category === filterState.category;
            const ratingOk = rating >= minRating;
            return textOk && catOk && ratingOk;
        };

        appCards.forEach(card => {
            const show = matches(card);
            card.style.display = show ? '' : 'none';
            restoreText(card, ['.app-name', '.app-developer']);
            if (show) highlightMatches(card, filterState.query, ['.app-name', '.app-developer']);
        });

        appListItems.forEach(item => {
            const show = matches(item);
            item.style.display = show ? '' : 'none';
            restoreText(item, ['.app-name', '.app-developer']);
            if (show) highlightMatches(item, filterState.query, ['.app-name', '.app-developer']);
        });

        // Sort grid cards
        if (filterState.sort !== 'popular' && appGrid) {
            const sorted = [...appCards].filter(c => c.style.display !== 'none');
            sorted.sort((a, b) => {
                if (filterState.sort === 'name') {
                    return a.querySelector('.app-name').textContent.localeCompare(b.querySelector('.app-name').textContent);
                }
                if (filterState.sort === 'rating') {
                    return parseFloat(b.dataset.rating || '0') - parseFloat(a.dataset.rating || '0');
                }
                return 0;
            });
            sorted.forEach(card => appGrid.appendChild(card));
        }

        // Empty message
        const anyVisible = [...appCards, ...appListItems].some(el => el.style.display !== 'none');
        const existing = document.getElementById('apps-empty');
        if (!anyVisible) {
            if (!existing && appGrid) {
                const div = document.createElement('div');
                div.id = 'apps-empty';
                div.className = 'empty-msg';
                div.innerHTML = `<span class="material-icons" style="opacity:0.6;vertical-align:middle;margin-right:6px;">search_off</span>No results. Try a different query or clear filters.`;
                appGrid.appendChild(div);
            }
        } else if (existing) {
            existing.remove();
        }
    }

    // Hook search input
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            filterApps(e.target.value);
            logEvent('search', { q: e.target.value });
        }));
    }

    // Filter chips
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const cat = chip.dataset.filterCategory;
            const rating = chip.dataset.filterRating;
            if (cat) {
                filterState.category = cat;
                filterChips.forEach(c => { if (c.dataset.filterCategory) c.classList.remove('active'); });
                chip.classList.add('active');
            }
            if (rating) {
                filterState.rating = rating;
                filterChips.forEach(c => { if (c.dataset.filterRating) c.classList.remove('active'); });
                chip.classList.add('active');
            }
            filterApps(filterState.query);
        });
    });

    // Sort select
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            filterState.sort = e.target.value;
            filterApps(filterState.query);
        });
    }

    // Tab Switching Functionality
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');

    navTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');

            // Remove active class from all tabs
            navTabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            this.classList.add('active');

            // Hide all tab contents
            tabContents.forEach(content => {
                content.classList.remove('active');
            });

            // Show target tab content
            const targetContent = document.getElementById(targetTab + '-content');
            if (targetContent) {
                targetContent.classList.add('active');
                
                // Load components if Movies tab is clicked
                if (targetTab === 'movies') {
                    loadVideoComponents();
                }
                
                // Load components if Books tab is clicked
                if (targetTab === 'books') {
                    loadBookComponents();
                }
                
                // Load components if Apps tab is clicked
                if (targetTab === 'apps') {
                    loadAppComponents();
                }
            }

            logEvent('tab-view', { tab: targetTab });
        });
    });

    // Analytics banner actions
    if (analyticsAccept) analyticsAccept.onclick = () => setAnalyticsOptIn(true);
    if (analyticsDecline) analyticsDecline.onclick = () => setAnalyticsOptIn(false);
    showAnalyticsBannerIfNeeded();

    // Component Loader Function
    async function loadComponent(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`Failed to load component: ${filePath}`);
            }
            const html = await response.text();
            return html;
        } catch (error) {
            console.error('Error loading component:', error);
            return '';
        }
    }

    // Load Video Components
    async function loadVideoComponents() {
        const videoGrid = document.querySelector('.video-grid');
        if (!videoGrid) return;

        // Check if components are already loaded
        if (videoGrid.dataset.loaded === 'true') {
            return;
        }

        // List of video component files (can be moved to config file)
        const videoComponents = [
            'view/video/video-card.html',
            'view/video/video-card-2.html',
            'view/video/video-card-3.html',
            'view/video/video-card-4.html',
            // Add more video components here or load from config
        ];

        // Clear existing content (including loading placeholder)
        videoGrid.innerHTML = '';

        // Load all components
        let loadedCount = 0;
        let hadError = false;
        for (const componentPath of videoComponents) {
            const componentHTML = await loadComponent(componentPath);
            if (componentHTML) {
                videoGrid.insertAdjacentHTML('beforeend', componentHTML);
                loadedCount++;
            } else {
                hadError = true;
            }
        }

        // Show message if no videos loaded
        if (loadedCount === 0) {
            videoGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #5f6368;">
                    <span class="material-icons" style="font-size: 48px; display: block; margin-bottom: 16px; opacity: 0.5;">movie</span>
                    <p>${hadError ? 'Unable to load videos (offline?). Please retry.' : 'No videos available'}</p>
                </div>
            `;
        }

        // Mark as loaded
        videoGrid.dataset.loaded = 'true';
    }

    // Load Book Components
    async function loadBookComponents() {
        const booksGrid = document.querySelector('.books-grid');
        if (!booksGrid) return;

        // Check if components are already loaded
        if (booksGrid.dataset.loaded === 'true') {
            return;
        }

        // List of book component files
        const bookComponents = [
            'view/books/book-card-1.html',
            'view/books/book-card-2.html',
            'view/books/book-card-3.html',
            'view/books/book-card-4.html',
            'view/books/book-card-5.html'
            // Add more book components here
        ];

        // Clear existing content (including loading placeholder)
        booksGrid.innerHTML = '';

        // Load all components
        let loadedCount = 0;
        let hadError = false;
        for (const componentPath of bookComponents) {
            const componentHTML = await loadComponent(componentPath);
            if (componentHTML) {
                booksGrid.insertAdjacentHTML('beforeend', componentHTML);
                loadedCount++;
            } else {
                hadError = true;
            }
        }

        // Show message if no books loaded
        if (loadedCount === 0) {
            booksGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #5f6368;">
                    <span class="material-icons" style="font-size: 48px; display: block; margin-bottom: 16px; opacity: 0.5;">menu_book</span>
                    <p>${hadError ? 'Unable to load books (offline?). Please retry.' : 'No books available'}</p>
                </div>
            `;
        }

        // Mark as loaded
        booksGrid.dataset.loaded = 'true';
    }

    // Load video components on page load if Movies tab is active
    if (document.getElementById('movies-content')?.classList.contains('active')) {
        loadVideoComponents();
    }
    
    // Load App Components
    async function loadAppComponents() {
        const appGrid = document.querySelector('.app-grid');
        const appList = document.querySelector('.app-list');
        
        // Load app grid components
        if (appGrid && appGrid.dataset.loaded !== 'true') {
            const appComponents = [
                'view/apps/app-card.html'
                // Add more app cards here
            ];
            
            appGrid.innerHTML = '';
            
            let loadedCount = 0;
            let hadErrorGrid = false;
            for (const componentPath of appComponents) {
                const componentHTML = await loadComponent(componentPath);
                if (componentHTML) {
                    appGrid.insertAdjacentHTML('beforeend', componentHTML);
                    loadedCount++;
                } else {
                    hadErrorGrid = true;
                }
            }
            
            if (loadedCount === 0) {
                appGrid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #5f6368;">
                        <span class="material-icons" style="font-size: 48px; display: block; margin-bottom: 16px; opacity: 0.5;">apps</span>
                        <p>${hadErrorGrid ? 'Unable to load apps (offline?). Please retry.' : 'No apps available'}</p>
                    </div>
                `;
            }
            
            appGrid.dataset.loaded = 'true';
        }
        
        // Load app list components (Top Charts)
        if (appList && appList.dataset.loaded !== 'true') {
            const appListComponents = [
                'view/apps/app-list-item.html'
                // Add more app list items here
            ];
            
            appList.innerHTML = '';
            
            let loadedCount = 0;
            let hadErrorList = false;
            for (const componentPath of appListComponents) {
                const componentHTML = await loadComponent(componentPath);
                if (componentHTML) {
                    appList.insertAdjacentHTML('beforeend', componentHTML);
                    loadedCount++;
                } else {
                    hadErrorList = true;
                }
            }
            
            if (loadedCount === 0) {
                appList.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #5f6368;">
                        <span class="material-icons" style="font-size: 48px; display: block; margin-bottom: 16px; opacity: 0.5;">trending_up</span>
                        <p>${hadErrorList ? 'Unable to load top charts (offline?). Please retry.' : 'No top charts available'}</p>
                    </div>
                `;
            }
            
            appList.dataset.loaded = 'true';
        }

        // Bind detail openers
        document.querySelectorAll('.app-card, .app-list-item').forEach(el => {
            el.onclick = () => openAppDetail(el);
        });

        // Re-apply filters after load
        filterApps(filterState.query);
        // Bind install buttons added dynamically
        bindInstallButtons();
    }

    // Load app components on page load if Apps tab is active
    if (document.getElementById('apps-content')?.classList.contains('active')) {
        loadAppComponents();
    }
    
    // Load book components on page load if Books tab is active
    if (document.getElementById('books-content')?.classList.contains('active')) {
        loadBookComponents();
    }
});

// App detail drawer
const appDetailTitle = document.getElementById('appDetailTitle');
const appDetailDeveloper = document.getElementById('appDetailDeveloper');
const appDetailVersion = document.getElementById('appDetailVersion');
const appDetailSize = document.getElementById('appDetailSize');
const appDetailRating = document.getElementById('appDetailRating');
const appDetailChangelog = document.getElementById('appDetailChangelog');
const appDetailChecksum = document.getElementById('appDetailChecksum');
const appDetailInstall = document.getElementById('appDetailInstall');
const appDetailIcon = document.getElementById('appDetailIcon');
const appSource = document.getElementById('appSource');
const copyChecksum = document.getElementById('copyChecksum');
let lastFocusedElement = null;

function trapFocus(modal, onClose) {
    const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    function handleTrap(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
        }
        if (e.key === 'Tab') {
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    }
    modal.addEventListener('keydown', handleTrap);
    return () => modal.removeEventListener('keydown', handleTrap);
}

let removeAppTrap = null;

function openAppDetail(el) {
    if (!appDetail) return;
    lastFocusedElement = document.activeElement;
    const name = el.querySelector('.app-name')?.textContent || '';
    const dev = el.querySelector('.app-developer')?.textContent || '';
    const rating = el.dataset.rating || '';
    const size = el.dataset.size || '';
    const version = el.dataset.version || '';
    const changelog = el.dataset.changelog || '';
    const checksum = el.dataset.checksum || '';
    const source = el.dataset.source || '#';
    const href = el.querySelector('a[href]')?.href || el.dataset.href || '#';
    const imgSrc = el.querySelector('img')?.src;

    if (appDetailTitle) appDetailTitle.textContent = name;
    if (appDetailDeveloper) appDetailDeveloper.textContent = dev;
    if (appDetailRating) appDetailRating.textContent = rating ? `${rating} ★` : '';
    if (appDetailSize) appDetailSize.textContent = size ? size : '';
    if (appDetailVersion) appDetailVersion.textContent = version ? `v${version}` : '';
    if (appDetailChangelog) appDetailChangelog.textContent = changelog;
    if (appDetailChecksum) appDetailChecksum.textContent = checksum;
    if (appDetailInstall) {
        appDetailInstall.href = href;
        appDetailInstall.onclick = () => logEvent('install-click', { slug: el.dataset.slug || name });
    }
    if (appSource) {
        appSource.href = source;
    }
    if (imgSrc && appDetailIcon) {
        appDetailIcon.innerHTML = `<img src="${imgSrc}" alt="${name}">`;
    }

    appDetail.style.display = 'flex';
    appDetail.setAttribute('tabindex', '-1');
    appDetail.focus();
    removeAppTrap = trapFocus(appDetail, closeAppDetail);
    const focusTarget = appDetail.querySelector('button, a');
    focusTarget?.focus();
    logEvent('app-detail', { name, slug: el.dataset.slug });
}

function closeAppDetail() {
    if (appDetail) {
        appDetail.style.display = 'none';
        if (removeAppTrap) removeAppTrap();
    }
    if (lastFocusedElement) lastFocusedElement.focus();
}

if (appDetailClose) appDetailClose.onclick = closeAppDetail;
if (appDetail) {
    appDetail.addEventListener('click', (e) => {
        if (e.target === appDetail) closeAppDetail();
    });
}
if (copyChecksum) {
    copyChecksum.onclick = () => {
        const text = appDetailChecksum?.textContent || '';
        if (text) navigator.clipboard?.writeText(text);
    };
}

// Book Modal Functions
function openBookModal(bookId) {
    const modal = document.getElementById('bookModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalAuthor = document.getElementById('modalAuthor');
    const modalContent = document.getElementById('modalContent');
    
    // Book content data
    const bookData = {
        history: {
            title: 'History of Ormoc City',
            author: 'Ormoc City Historical Commission',
            content: `
                <h3>Early History</h3>
                <p>The name "Ormoc" is derived from "ogmok," an archaic Visayan term meaning "lowland" or "depressed plain." Before Spanish colonization, the area was inhabited by Malayans who engaged in trade with Chinese, Javanese, and Indonesians. To protect themselves from Moro pirate attacks, the locals developed a warning system using watchtowers to alert the community of impending threats.</p>
                
                <h3>Spanish Period (1595-1898)</h3>
                <p>In 1595, Jesuit missionaries arrived in Leyte, and by May 1597, they had established a mission in Ormoc, converting many locals to Christianity. However, in 1634, the town faced a significant attack when Sultan Raja Bungsu of Sulu captured 300 residents. Despite resistance, the locals were overwhelmed. In 1768, Augustinian missionaries replaced the Jesuits, and on February 26, 1834, Ormoc was officially separated from Palompon, becoming its own municipality.</p>
                
                <h3>American Period (1901-1941)</h3>
                <p>Following the Philippine Revolution, a civil government was established in Leyte on April 22, 1901, under American rule. During this time, revolutionary leader Faustino Ablen inspired locals to join the Pulahan Movement. In 1903, the municipality of Albuera was consolidated into Ormoc.</p>
                
                <h3>World War II (1941-1945)</h3>
                <p>During World War II, Ormoc served as a significant Japanese stronghold and supply base in Leyte. The city was liberated by forces commanded by U.S. General Douglas MacArthur on December 10, 1944, after intense fighting. The contemporary city was rebuilt on the ruins of the old city.</p>
                
                <h3>Cityhood (1947)</h3>
                <p>Ormoc achieved city status on October 20, 1947, through Republic Act No. 179, becoming the fifteenth city in the Philippines and the first in the Eastern Visayas region.</p>
                
                <h3>Natural Disasters & Resilience</h3>
                <p>On November 5, 1991, Tropical Storm Thelma caused flash floods that devastated Ormoc, resulting in nearly 8,000 deaths. The disaster was exacerbated by deforestation and improper land use in the surrounding watershed. More recently, on November 8, 2013, Super Typhoon Haiyan struck the city, causing widespread destruction to 90% of its structures. Despite these challenges, Ormoc has shown remarkable resilience and continues to rebuild and develop.</p>
                
                <h3>Recent Developments</h3>
                <p>In 2022, a plebiscite was held to merge several barangays in Ormoc City. The majority of residents approved the reorganization, leading to the consolidation of 28 barangays into three: Barangay South, Barangay East, and Barangay West.</p>
            `
        },
        geography: {
            title: 'Geography & Demographics of Ormoc',
            author: 'Ormoc City Planning Office',
            content: `
                <h3>Location & Geography</h3>
                <p>Ormoc City is located on the western coast of Leyte Island in the Eastern Visayas region of the Philippines. It is strategically positioned and serves as a major commercial and transportation hub in the region.</p>
                
                <h3>Topography</h3>
                <p>The city's name "Ormoc" (from "ogmok") reflects its geographical character as a lowland area. The city features a combination of coastal plains and rolling hills, with the surrounding mountains providing natural resources and scenic beauty.</p>
                
                <h3>Climate</h3>
                <p>Ormoc experiences a tropical climate with two distinct seasons: a dry season from November to April and a wet season from May to October. The city is occasionally affected by typhoons, as evidenced by past natural disasters.</p>
                
                <h3>Demographics</h3>
                <p>Ormoc City has a diverse population with a mix of cultural influences. The city has experienced steady population growth over the years, reflecting its economic development and opportunities. The residents, known as Ormocanons, are primarily Waray-speaking, with English and Tagalog also widely used.</p>
                
                <h3>Administrative Divisions</h3>
                <p>Following the 2022 plebiscite, Ormoc City was reorganized into three major barangays: Barangay South, Barangay East, and Barangay West. This consolidation was aimed at improving governance and service delivery to residents.</p>
                
                <h3>Natural Resources</h3>
                <p>The city and its surrounding areas are rich in natural resources, including agricultural lands, forests, and water resources. Lake Danao, located nearby, is one of the region's most significant natural attractions.</p>
            `
        },
        culture: {
            title: 'Culture & Traditions of Ormoc',
            author: 'Ormoc Cultural Heritage Council',
            content: `
                <h3>Cultural Identity</h3>
                <p>The people of Ormoc, known as Ormocanons, have a rich cultural heritage that reflects the city's history and diverse influences. The culture is primarily Waray-based, with elements from Spanish, American, and indigenous traditions.</p>
                
                <h3>Language</h3>
                <p>Waray-Waray is the primary language spoken in Ormoc, though English and Tagalog are also widely used, especially in business and education. The local dialect has unique characteristics that distinguish it from other Waray-speaking areas.</p>
                
                <h3>Festivals</h3>
                <p>The Buyogan Festival is one of Ormoc's most celebrated cultural events. This festival showcases the city's agricultural heritage and features colorful street dancing, cultural performances, and community celebrations. The festival name is derived from "buyog" (bees), symbolizing the hardworking nature of Ormocanons.</p>
                
                <h3>Cuisine</h3>
                <p>Ormoc's cuisine reflects its coastal location and agricultural abundance. Seafood is prominent, with fresh fish and other marine products being staples. Traditional Waray dishes are prepared with local ingredients, and the city is known for its unique culinary traditions.</p>
                
                <h3>Arts & Crafts</h3>
                <p>Local artisans create traditional crafts that reflect Ormoc's cultural heritage. These include woven products, wood carvings, and other handicrafts that showcase the skills and creativity of Ormocanons.</p>
                
                <h3>Religious Traditions</h3>
                <p>With a history of Spanish colonization and Christianization, Ormoc has strong Catholic traditions. Religious festivals and celebrations are important parts of the community's cultural calendar, bringing together families and communities.</p>
                
                <h3>Music & Dance</h3>
                <p>Traditional Waray music and dance forms are preserved and performed during festivals and cultural events. These artistic expressions celebrate the city's history and identity, connecting generations of Ormocanons to their heritage.</p>
            `
        },
        economics: {
            title: 'Economic Development of Ormoc',
            author: 'Ormoc City Economic Development Board',
            content: `
                <h3>Economic Overview</h3>
                <p>Ormoc City has established itself as one of the most progressive cities in Eastern Visayas. Its strategic location, natural resources, and business-friendly environment have contributed to sustained economic growth.</p>
                
                <h3>Agriculture</h3>
                <p>Agriculture remains an important sector in Ormoc's economy. The surrounding areas produce rice, coconut, sugarcane, and various fruits and vegetables. The fertile lands and favorable climate support diverse agricultural activities.</p>
                
                <h3>Commerce & Trade</h3>
                <p>As a commercial hub in Western Leyte, Ormoc serves as a trading center for the region. The city has developed modern commercial districts with shopping centers, markets, and business establishments that serve both local residents and visitors.</p>
                
                <h3>Energy Sector</h3>
                <p>Ormoc has significant energy resources and infrastructure. The city and surrounding areas host power generation facilities, contributing to the region's energy supply and creating employment opportunities.</p>
                
                <h3>Tourism</h3>
                <p>Tourism is a growing sector, with attractions like Lake Danao, waterfalls, and historical sites drawing visitors. The city has invested in tourism infrastructure to support this industry's development.</p>
                
                <h3>Infrastructure Development</h3>
                <p>Ormoc has invested heavily in infrastructure, including roads, ports, and utilities. The city's port facilities support trade and transportation, while modern utilities ensure reliable services for residents and businesses.</p>
                
                <h3>Investment Climate</h3>
                <p>The city government has worked to create a favorable environment for investment, with streamlined processes and incentives for businesses. This has attracted both local and foreign investments, contributing to economic diversification and job creation.</p>
                
                <h3>Future Prospects</h3>
                <p>With continued infrastructure development, investment promotion, and sector diversification, Ormoc is positioned for sustained economic growth. The city aims to become an even more prominent economic center in Eastern Visayas.</p>
            `
        },
        tourism: {
            title: 'Tourism & Attractions in Ormoc',
            author: 'Ormoc City Tourism Office',
            content: `
                <h3>Natural Attractions</h3>
                <p>Ormoc City and its surrounding areas offer numerous natural attractions that draw visitors from across the Philippines and beyond. The region's natural beauty is one of its greatest assets.</p>
                
                <h3>Lake Danao</h3>
                <p>Lake Danao is one of Ormoc's most famous natural attractions. This beautiful lake, located in the mountains, offers stunning scenery, boating activities, and opportunities for relaxation. The lake's cool climate and pristine environment make it a popular destination for families and nature lovers.</p>
                
                <h3>Waterfalls</h3>
                <p>The area surrounding Ormoc features several beautiful waterfalls that are popular with tourists and locals. These natural wonders provide opportunities for swimming, picnicking, and photography, showcasing the region's natural beauty.</p>
                
                <h3>Historical Sites</h3>
                <p>Ormoc has several historical sites that reflect its rich past. These include monuments, markers, and structures that commemorate significant events in the city's history, particularly related to World War II and the city's liberation.</p>
                
                <h3>Cultural Attractions</h3>
                <p>The Buyogan Festival and other cultural events attract visitors interested in experiencing Ormoc's traditions and heritage. These festivals showcase local culture, music, dance, and cuisine, providing immersive cultural experiences.</p>
                
                <h3>Modern Facilities</h3>
                <p>Ormoc has developed modern tourism facilities including hotels, restaurants, and recreational areas. The city's commercial districts offer shopping, dining, and entertainment options for visitors.</p>
                
                <h3>Adventure Tourism</h3>
                <p>The surrounding mountains and natural areas offer opportunities for hiking, trekking, and other outdoor activities. Adventure tourism is a growing segment, attracting visitors seeking active experiences in nature.</p>
                
                <h3>Accessibility</h3>
                <p>Ormoc's strategic location and transportation infrastructure make it accessible to visitors. The city serves as a gateway to other destinations in Leyte and the Eastern Visayas region, making it an ideal base for exploring the area.</p>
            `
        }
    };
    
    if (bookData[bookId]) {
        modalTitle.textContent = bookData[bookId].title;
        modalAuthor.textContent = bookData[bookId].author;
        modalContent.innerHTML = bookData[bookId].content;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; 
        modal.setAttribute('tabindex', '-1');
        modal.focus();
        if (removeBookTrap) removeBookTrap();
        removeBookTrap = trapFocus(modal, closeBookModal);
        modal.querySelector('.modal-close')?.focus();
        logEvent('book-open', { book: bookId });
    }
    const modalDate = document.getElementById('modalDate');
    if (modalDate) {
        const today = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        modalDate.textContent = today.toLocaleDateString('en-US', options).toUpperCase();
    }

}

function closeBookModal() {
    const modal = document.getElementById('bookModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restore scrolling
    if (removeBookTrap) removeBookTrap();
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('bookModal');
    if (event.target === modal) {
        closeBookModal();
    }
}

if (bookPrint) {
    bookPrint.onclick = () => window.print();
}

// Admin lock
function initAdminLock() {
    if (!adminLock) return;
    const unlocked = localStorage.getItem(ADMIN_UNLOCK) === 'true';
    if (unlocked) {
        adminLock.style.display = 'none';
        return;
    }
    adminLock.style.display = 'flex';
    adminLockSubmit.onclick = () => {
        if (adminLockInput.value === ADMIN_PIN) {
            localStorage.setItem(ADMIN_UNLOCK, 'true');
            adminLock.style.display = 'none';
            adminLockError.textContent = '';
        } else {
            adminLockError.textContent = 'Incorrect PIN';
        }
    };
    adminLockReset.onclick = () => {
        adminLockInput.value = ADMIN_PIN;
    };
}

initAdminLock();
showAnalyticsBannerIfNeeded();
