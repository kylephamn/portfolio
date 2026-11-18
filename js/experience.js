// Renders the Experience timeline and its nav dropdown from data/experience.json.
// To add or edit a job, change the JSON only. In bullets, **text** becomes bold.
(() => {
    const list = document.getElementById('experience-timeline');
    const nav = document.getElementById('experience-nav-links');
    if (!list) return;

    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const rich = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    const parse = ym => { const [y, m] = ym.split('-').map(Number); return { y, m }; };
    const fmt = ym => { const { y, m } = parse(ym); return `${MONTHS[m - 1]} ${y}`; };

    function duration(start, end) {
        const s = parse(start), now = new Date();
        const e = end ? parse(end) : { y: now.getFullYear(), m: now.getMonth() + 1 };
        const total = (e.y - s.y) * 12 + (e.m - s.m) + 1;
        const y = Math.floor(total / 12), m = total % 12;
        return [y && `${y} yr${y > 1 ? 's' : ''}`, m && `${m} mo${m > 1 ? 's' : ''}`].filter(Boolean).join(' ');
    }

    // Current roles first (newest start first), then past roles by most recent end date.
    const order = (a, b) => (!!b.end === !!a.end)
        ? (a.end ? b.end.localeCompare(a.end) : b.start.localeCompare(a.start))
        : (a.end ? 1 : -1);

    function item(x, i, n) {
        const current = !x.end;
        const dates = `${fmt(x.start)} – ${current ? 'Present' : fmt(x.end)}`;
        const rail = i === 0 ? 'top-8 bottom-0' : i === n - 1 ? 'top-0 h-8' : 'top-0 bottom-0';
        const dot = current
            ? 'bg-primary-light ring-4 ring-primary-light/30'
            : 'bg-white dark:bg-gray-900 border-2 border-gray-400 dark:border-gray-500';
        return `
        <li id="${esc(x.id)}" class="grid grid-cols-[1.25rem_minmax(0,1fr)] md:grid-cols-[9rem_2rem_minmax(0,1fr)] gap-x-4 scroll-mt-24">
            <div class="hidden md:block text-right pt-6 pb-8">
                <p class="text-sm font-semibold text-gray-700 dark:text-gray-200">${current ? 'Present' : fmt(x.end)}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">${fmt(x.start)}</p>
                <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">${duration(x.start, x.end)}</p>
            </div>
            <div class="relative flex justify-center" aria-hidden="true">
                <span class="absolute ${rail} w-0.5 bg-gray-300 dark:bg-gray-600"></span>
                <span class="relative mt-7 h-4 w-4 rounded-full ${dot}"></span>
            </div>
            <div class="pb-8">
                <article class="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md transition-transform duration-300 hover:-translate-y-1">
                    <div class="flex flex-wrap items-start justify-between gap-2">
                        <h3 class="text-xl md:text-2xl font-bold dark:text-white">${esc(x.role)}</h3>
                        <div class="flex flex-wrap gap-2">
                            ${x.clearance ? `<span class="text-xs font-semibold px-2.5 py-1 rounded-full border border-gray-300 dark:border-gray-500 text-gray-600 dark:text-gray-300">${esc(x.clearance)}</span>` : ''}
                            ${current ? '<span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-light/20 text-primary dark:text-accent">Current</span>' : ''}
                        </div>
                    </div>
                    <h4 class="text-base md:text-lg text-gray-600 dark:text-gray-300">${esc(x.org)} · ${esc(x.location)}</h4>
                    <p class="md:hidden text-sm italic text-gray-500 dark:text-gray-400 mt-1">${dates} · ${duration(x.start, x.end)}</p>
                    <ul class="list-disc pl-5 mt-3 space-y-1.5 text-gray-600 dark:text-gray-300">
                        ${x.bullets.map(b => `<li>${rich(b)}</li>`).join('')}
                    </ul>
                    ${x.tags && x.tags.length ? `<div class="flex flex-wrap gap-2 mt-4">${x.tags.map(t =>
                        `<span class="text-xs px-2.5 py-1 rounded-full bg-accent/40 text-primary dark:bg-primary/40 dark:text-accent">${esc(t)}</span>`).join('')}</div>` : ''}
                </article>
            </div>
        </li>`;
    }

    // no-cache revalidates with the server (cheap 304 when unchanged), so edits show up
    // right away instead of waiting out GitHub Pages / Cloudflare cache lifetimes.
    fetch('data/experience.json', { cache: 'no-cache' })
        .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(data => {
            data.sort(order);
            list.innerHTML = data.map((x, i) => item(x, i, data.length)).join('');
            if (nav) nav.innerHTML = data.map(x =>
                `<a href="#${esc(x.id)}" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">${esc(x.role)}</a>`).join('');
            const target = location.hash && document.getElementById(location.hash.slice(1));
            if (target && list.contains(target)) target.scrollIntoView();
        })
        .catch(() => {
            list.innerHTML = '<li class="text-center text-gray-500 dark:text-gray-400">Experience couldn\'t load. <a class="underline" href="files/Pham, Kyle - Resume.pdf">View my resume</a> instead.</li>';
        });
})();
