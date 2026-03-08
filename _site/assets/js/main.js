/**
 * GHW Dev Blog — Main JS
 * 수정: 헤더 스크롤, 태그 필터, TOC, 맨위로버튼, 코드복사
 */

(function () {
  'use strict';

  /* ==========================
     Mobile Menu
     ========================== */
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const header = document.querySelector('.site-header');

  function isMobileMenuOpen() {
    return menuToggle && menuToggle.getAttribute('aria-expanded') === 'true';
  }

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', function () {
      const isOpen = this.getAttribute('aria-expanded') === 'true';
      this.setAttribute('aria-expanded', String(!isOpen));
      mobileMenu.setAttribute('aria-hidden', String(isOpen));
      mobileMenu.classList.toggle('is-open', !isOpen);

      // 메뉴 열릴 때 헤더가 숨겨져 있으면 다시 표시
      if (!isOpen && header) {
        header.style.transform = 'translateY(0)';
      }
    });

    document.addEventListener('click', function (e) {
      if (!menuToggle.contains(e.target) && !mobileMenu.contains(e.target)) {
        menuToggle.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden', 'true');
        mobileMenu.classList.remove('is-open');
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isMobileMenuOpen()) {
        menuToggle.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden', 'true');
        mobileMenu.classList.remove('is-open');
        menuToggle.focus();
      }
    });
  }

  /* ==========================
     Header Hide-on-Scroll
     모바일 메뉴가 열려있으면 헤더를 절대 숨기지 않음
     ========================== */
  if (header) {
    let lastScroll = 0;
    let ticking = false;

    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          const current = window.scrollY;

          // 모바일 메뉴가 열려있으면 헤더 항상 표시
          if (isMobileMenuOpen()) {
            header.style.transform = 'translateY(0)';
            lastScroll = current;
            ticking = false;
            return;
          }

          if (current <= 0) {
            // 최상단이면 항상 표시
            header.style.transform = 'translateY(0)';
          } else if (current > lastScroll && current > 100) {
            // 아래로 스크롤 → 숨김
            header.style.transform = 'translateY(-100%)';
          } else {
            // 위로 스크롤 → 표시
            header.style.transform = 'translateY(0)';
          }

          lastScroll = current;
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ==========================
     Table of Contents (Auto)
     ========================== */
  const tocNav = document.getElementById('toc-nav');
  const postContent = document.querySelector('.post-content');

  if (tocNav && postContent) {
    const headings = postContent.querySelectorAll('h2, h3');

    if (headings.length > 0) {
      const fragment = document.createDocumentFragment();

      headings.forEach(function (h, i) {
        if (!h.id) {
          h.id = 'heading-' + i + '-' + h.textContent.trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w가-힣-]/g, '')
            .toLowerCase();
        }
        const a = document.createElement('a');
        a.href = '#' + h.id;
        a.textContent = h.textContent;
        a.className = h.tagName === 'H3' ? 'toc-h3' : 'toc-h2';
        fragment.appendChild(a);
      });

      tocNav.appendChild(fragment);

      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              const id = entry.target.id;
              const link = tocNav.querySelector('a[href="#' + id + '"]');
              if (link) {
                tocNav.querySelectorAll('a').forEach(function (l) { l.classList.remove('active'); });
                link.classList.add('active');
              }
            }
          });
        }, { rootMargin: '-80px 0px -60% 0px' });
        headings.forEach(function (h) { observer.observe(h); });
      }
    } else {
      var toc = document.getElementById('toc');
      if (toc) toc.style.display = 'none';
    }
  }

  /* ==========================
     Copy Link Button
     ========================== */
  window.copyLink = function () {
    var url = window.location.href;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(function () {
        showToast('링크가 복사되었습니다!');
      }).catch(function () { fallbackCopy(url); });
    } else {
      fallbackCopy(url);
    }
  };

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand('copy'); showToast('링크가 복사되었습니다!'); }
    catch (e) { showToast('복사 실패. 직접 복사해주세요.'); }
    document.body.removeChild(ta);
  }

  /* ==========================
     Toast
     ========================== */
  function showToast(message) {
    var toast = document.getElementById('ghw-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'ghw-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      toast.style.cssText = [
        'position:fixed', 'bottom:5rem', 'left:50%',
        'transform:translateX(-50%) translateY(16px)',
        'background:#3fb950', 'color:#000',
        'padding:0.55rem 1.2rem', 'border-radius:8px',
        'font-size:0.85rem', 'font-weight:600',
        'z-index:9999', 'opacity:0',
        'transition:opacity 0.3s ease, transform 0.3s ease',
        'pointer-events:none', 'white-space:nowrap'
      ].join(';');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    requestAnimationFrame(function () {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(16px)';
    }, 2500);
  }

  /* ==========================
     Code Block Copy Button
     ========================== */
  document.querySelectorAll('.post-content pre').forEach(function (pre) {
    var btn = document.createElement('button');
    btn.textContent = '복사';
    btn.setAttribute('aria-label', '코드 복사');
    btn.style.cssText = [
      'position:absolute', 'top:0.5rem', 'right:0.5rem',
      'padding:0.25rem 0.6rem', 'font-size:0.73rem',
      'background:var(--bg3)', 'color:var(--muted)',
      'border:1px solid var(--border)', 'border-radius:4px',
      'cursor:pointer', 'font-family:var(--font-mono)',
      'transition:all 0.2s ease', 'z-index:2'
    ].join(';');
    pre.style.position = 'relative';
    btn.addEventListener('click', function () {
      var code = pre.querySelector('code');
      var text = code ? code.innerText : pre.innerText;
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () {
          btn.textContent = '✓ 복사됨';
          btn.style.color = 'var(--green)';
          btn.style.borderColor = 'var(--green)';
          setTimeout(function () {
            btn.textContent = '복사';
            btn.style.color = 'var(--muted)';
            btn.style.borderColor = 'var(--border)';
          }, 1800);
        });
      }
    });
    pre.appendChild(btn);
  });

  /* ==========================
     Blog Tag Filter
     — data-tags 속성이 있는 .post-card-wrapper 대상으로 수정
     ========================== */
  var filterBtns = document.querySelectorAll('.filter-btn');
  // 래퍼 div에 data-tags가 있음
  var postWrappers = document.querySelectorAll('.posts-list [data-tags]');

  if (filterBtns.length > 0 && postWrappers.length > 0) {
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tag = this.dataset.tag;
        filterBtns.forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active');

        postWrappers.forEach(function (wrapper) {
          if (!tag || tag === 'all') {
            wrapper.style.display = '';
          } else {
            // 정확한 단어 매칭 (예: 'javascript'가 'javascript-async'에 매칭되지 않도록)
            var tags = (wrapper.dataset.tags || '').split(' ');
            wrapper.style.display = tags.indexOf(tag) !== -1 ? '' : 'none';
          }
        });
      });
    });
  }

  /* ==========================
     Scroll To Top Button
     ========================== */
  var scrollTopBtn = document.getElementById('scrollTop');
  if (scrollTopBtn) {
    // 스크롤 300px 이상이면 버튼 표시
    window.addEventListener('scroll', function () {
      if (window.scrollY > 300) {
        scrollTopBtn.classList.add('visible');
      } else {
        scrollTopBtn.classList.remove('visible');
      }
    }, { passive: true });

    scrollTopBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ==========================
     Lazy Images (폴백)
     ========================== */
  if (!('loading' in HTMLImageElement.prototype) && 'IntersectionObserver' in window) {
    var imgObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var img = entry.target;
          if (img.dataset.src) img.src = img.dataset.src;
          imgObserver.unobserve(img);
        }
      });
    });
    document.querySelectorAll('img[loading="lazy"]').forEach(function (img) {
      imgObserver.observe(img);
    });
  }

})();

/* ========================================
   MEGA MENU & MOBILE ACCORDION
   ======================================== */
(function() {
  // ── Desktop: close mega/dropdown on outside click ──
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.nav-has-dropdown') && !e.target.closest('.nav-has-mega')) {
      document.querySelectorAll('.nav-has-dropdown.is-open, .nav-has-mega.is-open').forEach(function(el) {
        el.classList.remove('is-open');
        var trigger = el.querySelector('.nav-dropdown-trigger');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
      });
    }
  });

  // ── Desktop: keyboard toggle for mega trigger button ──
  document.querySelectorAll('.nav-mega-trigger').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var parent = btn.closest('.nav-has-mega');
      var isOpen = parent.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', isOpen);
      // close other open items
      document.querySelectorAll('.nav-has-dropdown.is-open').forEach(function(el) {
        el.classList.remove('is-open');
      });
    });
  });

  // ── Mobile Accordion ──────────────────
  document.querySelectorAll('.mob-acc-trigger').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var panel = btn.nextElementSibling;
      var isOpen = btn.getAttribute('aria-expanded') === 'true';

      // close all others
      document.querySelectorAll('.mob-acc-trigger').forEach(function(other) {
        if (other !== btn) {
          other.setAttribute('aria-expanded', 'false');
          var otherPanel = other.nextElementSibling;
          if (otherPanel) otherPanel.setAttribute('aria-hidden', 'true');
        }
      });

      btn.setAttribute('aria-expanded', !isOpen);
      if (panel) panel.setAttribute('aria-hidden', isOpen);
    });
  });
})();
