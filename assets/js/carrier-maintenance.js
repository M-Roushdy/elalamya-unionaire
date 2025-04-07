document.addEventListener('DOMContentLoaded', function() {
    const WORDPRESS_API_BASE = 'https://aliceblue-rabbit-873105.hostingersite.com/wp-json/carrier/v1';
    
    // 1. First update phone numbers
    updatePhoneNumbers();
    
    // 2. Then load blog posts into tabs
    loadBlogTabs();

    async function updatePhoneNumbers() {
        try {
            const response = await fetch(`${WORDPRESS_API_BASE}/settings`);
            if (!response.ok) throw new Error('Network response was not ok');
            
            const settings = await response.json();
            
            document.querySelectorAll('[data-carrier="phone"]').forEach(el => {
                if (el) {
                    el.href = `tel:${settings.phone}`;
                    el.textContent = settings.phone; 
                }
            });
            
            document.querySelectorAll('[data-carrier="whatsapp"]').forEach(el => {
                if (el) {
                    el.href = `https://wa.me/${settings.whatsapp}`;
                    el.textContent = settings.whatsapp;
                }
            });
        } catch (error) {
            console.error('Error updating phone numbers:', error);
        }
    }

    async function loadBlogTabs() {
        try {
            // Check if tabs section exists first
            const tabsSection = document.getElementById('tabs');
            if (!tabsSection) {
                console.warn('Tabs section not found in DOM');
                return;
            }
            
            const response = await fetch(`${WORDPRESS_API_BASE}/blogs?per_page=5`);
            if (!response.ok) throw new Error('Failed to fetch blog posts');
            
            const posts = await response.json();
            if (!posts || !posts.length) {
                console.warn('No blog posts received');
                return;
            }
            
            // Safely find containers with null checks
            const navTabs = tabsSection.querySelector('.nav-tabs');
            const tabContent = tabsSection.querySelector('.tab-content');
            
            if (!navTabs || !tabContent) {
                console.warn('Tab containers not found');
                return;
            }
            
            // Clear existing content
            navTabs.innerHTML = '';
            tabContent.innerHTML = '';
            
            // Create tabs for each blog post
            posts.forEach((post, index) => {
                const isActive = index === 0 ? 'active show' : '';
                
                // Create tab nav item
                const tabNavItem = document.createElement('li');
                tabNavItem.className = 'nav-item';
                tabNavItem.innerHTML = `
                    <a class="nav-link ${isActive}" data-bs-toggle="tab" href="#tab-${post.id}">
                        ${post.title.substring(0, 15)}${post.title.length > 15 ? '...' : ''}
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
                            <p class="fst-italic">${post.excerpt || ''}</p>
                            <div>${post.content}</div>
                        </div>
                        <div class="col-lg-4 text-center order-1 order-lg-2">
                            ${post.thumbnail ? `<img src="${post.thumbnail}" alt="${escapeHtml(post.title)}" class="img-fluid">` : ''}
                        </div>
                    </div>
                `;
                tabContent.appendChild(tabPane);
            });
            
        } catch (error) {
            console.error('Error loading blog posts:', error);
            const errorDiv = document.createElement('div');
            errorDiv.className = 'alert alert-warning';
            errorDiv.textContent = 'Unable to load blog content. Please try again later.';
            
            const container = document.querySelector('#tabs .container') || document.getElementById('tabs');
            if (container) {
                container.innerHTML = '';
                container.appendChild(errorDiv);
            }
        }
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
});