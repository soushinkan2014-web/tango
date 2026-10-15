// 創心館 英単語の音声：回のページの動き（build_site.py が公開用\app.js に写す）
// データは各ページの window.DATA = {T: 単語の始まりの秒, TE: 見出し語の読み終わりの秒, Q: [[No, 問題文, 答え], ...], KEY}
(function () {
  const D = window.DATA, T = D.T, TE = D.TE, Q = D.Q, KEY = 'quiz-' + D.KEY;
  const a = document.getElementById('a');
  const $ = id => document.getElementById(id);
  let stopAt = null;

  // 速さ（そのスマホに覚えておく）
  document.querySelectorAll('.sp').forEach(b => b.onclick = () => {
    a.playbackRate = +b.dataset.r;
    document.querySelectorAll('.sp').forEach(x => x.classList.toggle('on', x === b));
    try { localStorage.setItem('rate', b.dataset.r); } catch (e) {}
  });
  try { const r = localStorage.getItem('rate'); if (r) document.querySelector('.sp[data-r="' + r + '"]').click(); } catch (e) {}
  a.addEventListener('play', () => { const on = document.querySelector('.sp.on'); if (on) a.playbackRate = +on.dataset.r; });

  // 意味をかくす
  $('hide').onclick = e => {
    document.body.classList.toggle('hide'); e.target.classList.toggle('on');
    e.target.textContent = document.body.classList.contains('hide') ? '意味を見せる' : '意味をかくす';
  };

  // 単語をタップ → その単語から再生。今の単語に枠
  const btns = [...document.querySelectorAll('.w')];
  btns.forEach(b => b.onclick = () => { const t = T[b.dataset.no]; if (t !== undefined) { stopAt = null; a.currentTime = t; a.play(); } });
  a.addEventListener('timeupdate', () => {
    if (stopAt !== null && a.currentTime >= stopAt) { a.pause(); stopAt = null; }
    let cur = null;
    for (const b of btns) { const t = T[b.dataset.no]; if (t !== undefined && a.currentTime >= t - 0.05) cur = b; }
    btns.forEach(b => b.classList.toggle('now', b === cur));
  });

  // ひとりテスト（日本語 → 英語）
  const box = $('qbox');
  function setTab(q) {
    document.body.classList.toggle('quiz', q);
    $('tabL').classList.toggle('on', !q); $('tabQ').classList.toggle('on', q);
    a.pause(); stopAt = null;
    if (q) start(Q);
    window.scrollTo(0, 0);
  }
  $('tabL').onclick = () => setTab(false);
  $('tabQ').onclick = () => setTab(true);

  let list = [], i = 0, ng = [], ok = 0;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  function shuffle(x) { x = x.slice(); for (let j = x.length - 1; j > 0; j--) { const r = Math.floor(Math.random() * (j + 1)); [x[j], x[r]] = [x[r], x[j]]; } return x; }
  function last() {
    try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); return v ? '前回のひとりテスト：○ ' + v.ok + ' / ' + v.n + '（' + v.d + '）' : ''; } catch (e) { return ''; }
  }
  function say(no) {   // 見出し語の発音だけを流す
    const t = T[no], e = TE[no];
    if (t === undefined) return;
    a.currentTime = t; stopAt = (e !== undefined ? e : t + 1.5) + 0.15; a.play();
  }
  function start(src) { list = shuffle(src); i = 0; ng = []; ok = 0; show(); }
  function show() {
    if (i >= list.length) return result();
    const q = list[i];
    box.innerHTML =
      '<div class="card" id="cd"><div class="prog">' + (i + 1) + ' / ' + list.length + '</div>' +
      '<div class="qja">' + esc(q[1]) + '</div><div class="qen">' + esc(q[2]) + '</div>' +
      '<div class="btns" id="b1"><button class="btn on" id="see">答えを見る</button></div>' +
      '<div class="btns" id="b2" hidden><button class="btn ok" id="o">○ 書けた</button><button class="btn ng" id="x">× まちがえた</button></div>' +
      '<div class="btns" id="b3" hidden><button class="btn" id="re">もう一度聞く</button></div></div>';
    $('see').onclick = () => { $('cd').classList.add('open'); $('b1').hidden = true; $('b2').hidden = false; $('b3').hidden = false; say(q[0]); };
    $('re').onclick = () => say(q[0]);
    $('o').onclick = () => { ok++; i++; show(); };
    $('x').onclick = () => { ng.push(q); i++; show(); };
  }
  function result() {
    a.pause(); stopAt = null;
    const n = list.length, d = new Date();
    if (n === Q.length) { try { localStorage.setItem(KEY, JSON.stringify({ ok: ok, n: n, d: (d.getMonth() + 1) + '/' + d.getDate() })); } catch (e) {} }
    const ngs = ng.slice();
    box.innerHTML =
      '<div class="card res"><div class="prog">結果</div><h2>○ ' + ok + ' / ' + n + '</h2>' +
      (ngs.length ? '<p>まちがえた単語</p><ul>' + ngs.map(q => '<li>' + esc(q[1]) + '　<span class="en2">' + esc(q[2]) + '</span></li>').join('') + '</ul>' : '<p>全部できました！</p>') +
      '<div class="btns">' + (ngs.length ? '<button class="btn on" id="again">×だけもう一度</button>' : '') + '<button class="btn" id="all">はじめから</button></div></div>';
    if (ngs.length) $('again').onclick = () => start(ngs);
    $('all').onclick = () => start(Q);
    $('lastq').textContent = last();
  }
  $('lastq').textContent = last();
})();
