document.addEventListener('DOMContentLoaded', function() {
    const CONFIG = {
        API_BASE: 'https://aliceblue-rabbit-873105.hostingersite.com/wp-json/carrier/v1',
        CACHE_PREFIX: 'carrier_',
        DEFAULT_PHONE: '01112986699',
        DEFAULT_WHATSAPP: '01112986655'
    };

    // Initialize everything
    init();

    async function init() {
        try {
            await Promise.all([
                updateContactNumbers(),
                loadBlogPosts()
            ]);
        } catch (error) {
            console.error('Initialization error:', error);
        }
    }

    async function updateContactNumbers() {
        try {
            const response = await fetch(`${CONFIG.API_BASE}/settings`, {
                method: 'GET',
                mode: 'cors',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            const data = await response.json();
            const phone = data.phone || CONFIG.DEFAULT_PHONE;
            const whatsapp = data.whatsapp || CONFIG.DEFAULT_WHATSAPP;

            // Update phone links
            document.querySelectorAll('[data-carrier="phone"]').forEach(el => {
                el.href = `tel:${phone}`;
                el.textContent = phone;
            });

            // Update WhatsApp links
            document.querySelectorAll('[data-carrier="whatsapp"]').forEach(el => {
                el.href = `https://wa.me/${whatsapp}`;
                el.textContent = whatsapp;
            });

            // Cache the numbers
            localStorage.setItem(`${CONFIG.CACHE_PREFIX}phone`, phone);
            localStorage.setItem(`${CONFIG.CACHE_PREFIX}whatsapp`, whatsapp);

        } catch (error) {
            console.error('Failed to update contact numbers:', error);
            // Fallback to cached or default numbers
            const cachedPhone = localStorage.getItem(`${CONFIG.CACHE_PREFIX}phone`) || CONFIG.DEFAULT_PHONE;
            const cachedWhatsapp = localStorage.getItem(`${CONFIG.CACHE_PREFIX}whatsapp`) || CONFIG.DEFAULT_WHATSAPP;

            document.querySelectorAll('[data-carrier="phone"]').forEach(el => {
                el.href = `tel:${cachedPhone}`;
                el.textContent = cachedPhone;
            });

            document.querySelectorAll('[data-carrier="whatsapp"]').forEach(el => {
                el.href = `https://wa.me/${cachedWhatsapp}`;
                el.textContent = cachedWhatsapp;
            });
        }
    }

    async function loadBlogPosts() {
        const tabsSection = document.getElementById('tabs');
        if (!tabsSection) {
            console.warn('Tabs section not found');
            return;
        }

        try {
            const response = await fetch(`${CONFIG.API_BASE}/blogs?per_page=5`, {
                method: 'GET',
                mode: 'cors',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            const posts = await response.json();
            if (!posts || !posts.length) {
                throw new Error('No posts received');
            }

            renderBlogTabs(posts);
            localStorage.setItem(`${CONFIG.CACHE_PREFIX}blog_posts`, JSON.stringify({
                data: posts,
                timestamp: Date.now()
            }));

        } catch (error) {
            console.error('Failed to load blog posts:', error);
            // Try to load from cache
            const cached = localStorage.getItem(`${CONFIG.CACHE_PREFIX}blog_posts`);
            if (cached) {
                try {
                    const { data } = JSON.parse(cached);
                    if (data && data.length) {
                        renderBlogTabs(data);
                        return;
                    }
                } catch (e) {
                    console.error('Failed to parse cached posts:', e);
                }
            }
            showError(tabsSection, 'Failed to load blog posts. Please try again later.');
        }
    }

    function renderBlogTabs(posts) {
        const tabsSection = document.getElementById('tabs');
        const navTabs = tabsSection.querySelector('.nav-tabs');
        const tabContent = tabsSection.querySelector('.tab-content');

        // Clear existing content
        navTabs.innerHTML = '';
        tabContent.innerHTML = '';

        // Create new tabs
        posts.forEach((post, index) => {
            const isActive = index === 0 ? 'active show' : '';

            // Create tab nav item
            const tabNavItem = document.createElement('li');
            tabNavItem.className = 'nav-item';
            tabNavItem.innerHTML = `
                <a class="nav-link ${isActive}" data-bs-toggle="tab" href="#tab-${post.id}">
                    ${truncateText(post.title, 15)}
                </a>
            `;
            navTabs.appendChild(tabNavItem);

            // Create tab content
            const tabPane = document.createElement('div');
            tabPane.className = `tab-pane fade ${isActive}`;
            tabPane.id = `tab-${post.id}`;
            tabPane.innerHTML = `
                <div class="row">
                    <div class="col-lg-8 details order-2 order-lg-1">
                        <h3>${escapeHtml(post.title)}</h3>
                        <p class="fst-italic">${escapeHtml(post.excerpt || '')}</p>
                        <div>${post.content}</div>
                    </div>
                    <div class="col-lg-4 text-center order-1 order-lg-2">
                        ${post.thumbnail ? `<img src="${post.thumbnail}" alt="${escapeHtml(post.title)}" class="img-fluid">` : ''}
                    </div>
                </div>
            `;
            tabContent.appendChild(tabPane);
        });
    }

    function showError(container, message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-warning';
        errorDiv.textContent = message;
        container.innerHTML = '';
        container.appendChild(errorDiv);
    }

    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe.toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return escapeHtml(text);
        return escapeHtml(text.substring(0, maxLength)) + '...';
    }
});