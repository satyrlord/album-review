"use strict";
(function () {
    'use strict';
    // One colour per unique artist (sorted A-Z). Extend if needed.
    const PALETTE = [
        'var(--accent)', // green
        'var(--time)', // amber
        'var(--accent3)', // purple
        'var(--accent2)', // red
        'var(--warn)', // orange
    ];
    function esc(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
    function normaliseText(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
    }
    function displayGenre(value) {
        const genre = String(value || '').trim();
        return genre && !/^<!--[\s\S]*-->$/.test(genre) ? genre : '';
    }
    function buildColorMap(albums) {
        const artists = Array.from(new Set(albums.map(a => a.artist))).sort();
        const map = {};
        artists.forEach((name, i) => {
            map[name] = PALETTE[i % PALETTE.length];
        });
        return map;
    }
    const grid = document.getElementById('ixGrid');
    const filters = document.getElementById('ixFilters');
    const search = document.getElementById('ixSearch');
    const count = document.getElementById('ixCount');
    let allAlbums = [];
    let colorMap = {};
    let activeArtist = 'All';
    function buildPills() {
        const artists = ['All', ...Array.from(new Set(allAlbums.map(a => a.artist))).sort()];
        filters.innerHTML = artists.map(name => {
            const cls = name === 'All' ? ' active' : '';
            return `<button class="ix-pill${cls}" data-artist="${esc(name)}">${esc(name)}</button>`;
        }).join('');
        filters.querySelectorAll('.ix-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                activeArtist = btn.dataset['artist'] ?? 'All';
                filters.querySelectorAll('.ix-pill').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                render();
            });
        });
    }
    function render() {
        const q = normaliseText(search.value.trim());
        const visible = allAlbums.filter(a => {
            const genre = displayGenre(a.genre);
            const matchArtist = activeArtist === 'All' || a.artist === activeArtist;
            const matchSearch = !q
                || normaliseText(a.title).indexOf(q) !== -1
                || normaliseText(a.artist).indexOf(q) !== -1
                || normaliseText(genre).indexOf(q) !== -1;
            return matchArtist && matchSearch;
        });
        count.textContent = `${visible.length} / ${allAlbums.length} album${allAlbums.length !== 1 ? 's' : ''}`;
        if (visible.length === 0) {
            grid.innerHTML = `<div class="ix-empty">No albums match &ldquo;${esc(search.value)}&rdquo;.</div>`;
            return;
        }
        grid.innerHTML = visible.map(a => {
            const color = colorMap[a.artist] ?? 'var(--accent)';
            const genre = displayGenre(a.genre);
            const genreHtml = genre ? `<div class="ix-card-genre">${esc(genre)}</div>` : '';
            const trackLabel = `${a.tracks} track${a.tracks !== 1 ? 's' : ''}`;
            return (`<a class="ix-card" href="${esc(a.file)}" style="--card-accent:${color}">` +
                `<div class="ix-card-body">` +
                genreHtml +
                `<div class="ix-card-title">${esc(a.title)}</div>` +
                `<div class="ix-card-artist">${esc(a.artist)}</div>` +
                `<div class="ix-card-meta">${esc(a.year)} &nbsp;·&nbsp; ${esc(trackLabel)}</div>` +
                `</div>` +
                `<div class="ix-card-footer">View Analysis &rarr;</div>` +
                `</a>`);
        }).join('');
    }
    if (typeof window.ALBUMS === 'undefined' || !Array.isArray(window.ALBUMS)) {
        grid.innerHTML =
            '<div class="ix-error">' +
                'Could not load album data.<br>' +
                'Ensure <code>albums.js</code> is present alongside this file.' +
                '</div>';
        return;
    }
    allAlbums = window.ALBUMS;
    colorMap = buildColorMap(allAlbums);
    buildPills();
    render();
    search.addEventListener('input', render);
}());
