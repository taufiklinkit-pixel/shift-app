(async function() {
  try {
    const res = await fetch('src/api/banner.php', { cache: 'no-store' });
    const data = await res.json();
    if (data && data.url) {
      const el = document.querySelector('.banner');
      if (el) el.style.backgroundImage = `url('${data.url}')`;
    }
  } catch {}
})();


