// 영상 시청 여부는 이 페이지에서만 확인하며 상담 응답에 포함하지 않습니다.
(() => {
  const video = document.getElementById('program-video');
  const summaryButton = document.getElementById('video-summary-button');
  const fullButton = document.getElementById('video-full-button');
  const status = document.getElementById('video-status');
  const error = document.getElementById('video-error');
  if (!video || !summaryButton || !fullButton || !status || !error) return;

  const films = {
    summary: { path: './assets/films/academy-study-summary.mp4', poster: './assets/films/academy-study-summary-poster.jpg', label: '요약본' },
    full: { path: './assets/films/academy-study-full-final.mp4', poster: './assets/films/academy-study-full-poster.jpg', label: '자세히 보기' }
  };
  let completed = false;
  let mode = 'summary';
  let watchedUntil = 0;
  let lastTime = 0;
  window.programVideoComplete = () => completed;

  function setMode(nextMode) {
    video.pause();
    mode = nextMode;
    watchedUntil = 0;
    lastTime = 0;
    const film = films[mode];
    summaryButton.setAttribute('aria-pressed', String(mode === 'summary'));
    fullButton.setAttribute('aria-pressed', String(mode === 'full'));
    error.hidden = true;
    video.src = film.path;
    video.poster = film.poster;
    video.muted = true;
    video.load();
    video.setAttribute('aria-label', film.label + ' 안내 영상');
    status.textContent = completed ? '영상 시청을 완료했어요.' : film.label + '을 끝까지 시청해주세요.';
  }

  summaryButton.addEventListener('click', () => { if (mode !== 'summary') setMode('summary'); });
  fullButton.addEventListener('click', () => { if (mode !== 'full') setMode('full'); });
  video.addEventListener('volumechange', () => { if (!video.muted) video.muted = true; });
  video.addEventListener('timeupdate', () => {
    if (video.seeking) return;
    if (video.currentTime - lastTime <= 1.5) watchedUntil = Math.max(watchedUntil, video.currentTime);
    lastTime = video.currentTime;
  });
  video.addEventListener('seeking', () => {
    if (!completed && video.currentTime > watchedUntil + 1) video.currentTime = watchedUntil;
    lastTime = video.currentTime;
  });
  video.addEventListener('ended', () => {
    if (watchedUntil >= video.duration - 1.5) {
      completed = true;
      status.textContent = '영상 시청을 완료했어요.';
    }
  });
  video.addEventListener('error', () => { if (video.hasAttribute('src')) error.hidden = false; });
  const step = document.getElementById('step-4');
  if (step) new MutationObserver(() => { if (!step.classList.contains('active')) video.pause(); }).observe(step, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', () => { if (document.hidden) video.pause(); });
  setMode('summary');
})();
