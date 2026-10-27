// NBA predictions page: renders the JSON that the nbaPredicts pipeline
// publishes every morning to https://martinez-hub.github.io/nbaPredicts/data/.
(function () {
  var root = document.getElementById('nba');
  if (!root) return;

  // A same-origin path override (?data=/some/dir/) for local previews.
  var DATA = '/nbaPredicts/data/';
  try {
    var q = new URLSearchParams(location.search).get('data');
    if (q && q.charAt(0) === '/' && q.charAt(1) !== '/') DATA = q.replace(/\/?$/, '/');
  } catch (e) {}
  var REPO = 'https://github.com/martinez-hub/nbaPredicts';
  var EQUINE_REPO = 'https://github.com/mit-ll-responsible-ai/equine';

  // ---------------------------------------------------------------- helpers
  function el(tag, attrs) {
    var node = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (attrs[k] == null) continue;
        if (k === 'class') node.className = attrs[k];
        else if (k === 'text') node.textContent = attrs[k];
        else if (k === 'style') node.setAttribute('style', attrs[k]);
        else node.setAttribute(k, attrs[k]);
      }
    }
    (function add(children) {
      for (var i = 0; i < children.length; i++) {
        var c = children[i];
        if (c == null || c === false) continue;
        if (Array.isArray(c)) add(c);
        else node.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
      }
    })(Array.prototype.slice.call(arguments, 2));
    return node;
  }
  function svg(tag, attrs) {
    var node = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }
  function pct(x, digits) { return (x * 100).toFixed(digits == null ? 0 : digits) + '%'; }
  function num(x, digits) { return x == null ? '–' : Number(x).toFixed(digits == null ? 1 : digits); }
  function round(x) { return x == null ? '–' : String(Math.round(x)); }
  function range(lo, hi) { return lo == null || hi == null ? '' : Math.round(lo) + '–' + Math.round(hi); }
  function fmtDate(iso, opts) {
    // iso is an ET calendar date (YYYY-MM-DD); pin it to noon UTC so no
    // viewer time zone shifts it to a neighbouring day.
    return new Date(iso + 'T12:00:00Z').toLocaleDateString(undefined, Object.assign({ timeZone: 'UTC' }, opts));
  }
  function fmtTime(iso) {
    return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
  }
  function fmtStamp(iso) {
    return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }
  function team(data, id) {
    return data.teams[id] || { abbr: id, name: id, short: id };
  }
  function getJSON(name) {
    return fetch(DATA + name, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(name + ': HTTP ' + r.status);
      return r.json();
    });
  }

  // Tooltip shared by every chart mark.
  var tip = el('div', { class: 'nba-tip', role: 'status', hidden: '' });
  document.body.appendChild(tip);
  function showTip(target, text) {
    tip.textContent = text;
    tip.hidden = false;
    var r = target.getBoundingClientRect();
    var t = tip.getBoundingClientRect();
    var left = Math.min(window.innerWidth - t.width - 8, Math.max(8, r.left + r.width / 2 - t.width / 2));
    tip.style.left = left + window.scrollX + 'px';
    tip.style.top = r.top + window.scrollY - t.height - 10 + 'px';
  }
  function hideTip() { tip.hidden = true; }

  // ---------------------------------------------------------------- slate
  function strip(data, g) {
    var home = team(data, g.home), away = team(data, g.away);
    var pa = 1 - g.p_home;
    var fav = g.p_home >= 0.5 ? 'home' : 'away';
    var bar = el('div', {
      class: 'strip fav-' + fav,
      role: 'img',
      'aria-label': home.short + ' ' + pct(g.p_home) + ' to win, ' + away.short + ' ' + pct(pa)
    },
      el('span', { class: 's-away', 'data-w': (pa * 100).toFixed(2) }),
      el('span', { class: 's-home' }),
      el('i', { class: 's-mid', 'aria-hidden': 'true' })
    );
    var labels = el('div', { class: 'strip-labels', 'aria-hidden': 'true' },
      el('span', { class: fav === 'away' ? 'fav' : '' }, away.abbr + ' ' + pct(pa)),
      el('span', { class: fav === 'home' ? 'fav' : '' }, pct(g.p_home) + ' ' + home.abbr)
    );
    return el('div', { class: 'strip-wrap' }, bar, labels);
  }

  function playerTable(data, rows, tid) {
    var t = team(data, tid);
    if (!rows.length) return el('p', { class: 'nba-note' }, 'No projections for ' + t.short + ' yet.');
    var stats = [['pts', 'PTS'], ['reb', 'REB'], ['ast', 'AST'], ['fg3m', '3PM']];
    var head = el('tr', null, el('th', { scope: 'col' }, t.short));
    stats.forEach(function (s) { head.appendChild(el('th', { scope: 'col' }, s[1])); });
    var body = el('tbody');
    rows.forEach(function (p) {
      var name = el('th', { scope: 'row' }, p.name);
      if (p.status) name.appendChild(el('span', { class: 'p-status' }, ' ' + p.status.toLowerCase()));
      var tr = el('tr', null, name);
      stats.forEach(function (s) {
        tr.appendChild(el('td', null,
          el('span', { class: 'v' }, num(p[s[0]])),
          el('span', { class: 'r' }, range(p[s[0] + '_lo'], p[s[0] + '_hi']))
        ));
      });
      body.appendChild(tr);
    });
    return el('div', { class: 'table-scroll' }, el('table', { class: 'ptable' }, el('thead', null, head), body));
  }

  function injuryList(data, g) {
    var items = [];
    ['away', 'home'].forEach(function (side) {
      var t = team(data, g[side]);
      (g.injuries[side] || []).forEach(function (i) {
        items.push(el('li', null, el('span', { class: 'i-team' }, t.abbr), ' ', i.name, ' ', el('span', { class: 'i-status' }, i.status)));
      });
    });
    return items;
  }

  function gameCard(data, g) {
    var home = team(data, g.home), away = team(data, g.away);
    var ph = g.points.home, pa = g.points.away;
    var card = el('article', { class: 'game' },
      el('header', { class: 'g-head' },
        el('h3', { class: 'g-teams' }, away.short, el('span', { class: 'g-at' }, ' at '), home.short),
        el('time', { datetime: g.start }, fmtTime(g.start))
      ),
      strip(data, g)
    );
    if (ph.mid != null && pa.mid != null) {
      card.appendChild(el('p', { class: 'g-proj' },
        'TimesFM projects ',
        el('b', null, away.abbr + ' ' + round(pa.mid)), ', ',
        el('b', null, home.abbr + ' ' + round(ph.mid)),
        el('span', { class: 'g-range' }, ' (80% ranges ' + range(pa.lo, pa.hi) + ' and ' + range(ph.lo, ph.hi) + ')')
      ));
    }
    if (g.novelty >= 0.9) {
      var share = g.novelty >= 0.995 ? 'almost every' : pct(g.novelty) + ' of';
      card.appendChild(el('p', { class: 'g-flag', title: 'EQUINE\u2019s Gaussian-process variance for this game, ranked against recent games the model was checked on. Higher variance pulls the probability toward 50%.' },
        'Unfamiliar matchup: EQUINE is less sure here than on ' + share + ' recent games.'));
    }
    var players = el('details', { class: 'g-more' },
      el('summary', null, 'Player projections'),
      el('div', { class: 'ptables' },
        playerTable(data, g.players.away, g.away),
        playerTable(data, g.players.home, g.home)
      ),
      el('p', { class: 'nba-note' }, 'Median forecast with the 80% range under it. Players listed out are left off.')
    );
    card.appendChild(players);
    var inj = injuryList(data, g);
    if (inj.length) {
      card.appendChild(el('details', { class: 'g-more' },
        el('summary', null, 'Injury report (' + inj.length + ')'),
        el('ul', { class: 'injuries' }, inj)));
    }
    return card;
  }

  function renderSlate(data) {
    var box = document.getElementById('slate');
    box.textContent = '';
    if (!data.games.length) {
      box.appendChild(el('p', { class: 'nba-empty' },
        'No games in the next three days. The next slate shows up here after the morning update.'));
      return;
    }
    var byDate = {};
    var order = [];
    data.games.forEach(function (g) {
      if (!byDate[g.date]) { byDate[g.date] = []; order.push(g.date); }
      byDate[g.date].push(g);
    });
    order.forEach(function (d) {
      var list = el('div', { class: 'day-games' });
      byDate[d].forEach(function (g) { list.appendChild(gameCard(data, g)); });
      box.appendChild(el('div', { class: 'day' },
        el('h3', { class: 'day-date' },
          fmtDate(d, { weekday: 'long' }), el('br'), fmtDate(d, { month: 'long', day: 'numeric' })),
        list));
    });
    // One orchestrated moment: every strip opens from 50/50 to its value.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        box.querySelectorAll('.s-away').forEach(function (s) { s.style.flexBasis = s.getAttribute('data-w') + '%'; });
      });
    });
  }

  // ---------------------------------------------------------------- record
  function renderRecord(data) {
    var rec = data.record || {};
    var box = document.getElementById('record');
    box.textContent = '';
    if (!rec.n) {
      box.appendChild(el('p', { class: 'nba-empty' },
        'No finished games with a published prediction yet this season. The record starts after the first predicted game ends.'));
    } else {
      var items = [
        ['Winners picked', rec.correct + ' of ' + rec.n + ' (' + pct(rec.accuracy, 1) + ')'],
        ['Brier score', num(rec.brier, 3) + ' (0.25 is a coin flip; lower is better)'],
        ['Team points', 'off by ' + num(rec.team_pts_mae) + ' a game on average']
      ];
      if (rec.player_mae) {
        items.push(['Player lines', 'off by ' + num(rec.player_mae.pts) + ' points, ' + num(rec.player_mae.reb) +
          ' rebounds and ' + num(rec.player_mae.ast) + ' assists on average']);
      }
      var dl = el('dl', { class: 'facts' });
      items.forEach(function (it) { dl.appendChild(el('dt', null, it[0])); dl.appendChild(el('dd', null, it[1])); });
      box.appendChild(dl);
    }

    var res = document.getElementById('results');
    res.textContent = '';
    if (!data.results.length) return;
    var body = el('tbody');
    data.results.forEach(function (r) {
      var home = team(data, r.home), away = team(data, r.away);
      var pick = r.p_home >= 0.5 ? home : away;
      var conf = r.p_home >= 0.5 ? r.p_home : 1 - r.p_home;
      body.appendChild(el('tr', { class: r.correct ? 'hit' : 'miss' },
        el('td', { class: 'mono' }, fmtDate(r.date, { month: 'short', day: 'numeric' })),
        el('td', null, away.abbr + ' ' + round(r.away_pts) + ', ' + home.abbr + ' ' + round(r.home_pts)),
        el('td', null, pick.abbr + ' ' + pct(conf)),
        el('td', null, r.pred_away_pts == null ? '–' : round(r.pred_away_pts) + '–' + round(r.pred_home_pts)),
        el('td', { class: 'res' }, r.correct ? 'Right' : 'Wrong')
      ));
    });
    res.appendChild(el('h3', { class: 'sub-h' }, 'The last seven days'));
    res.appendChild(el('div', { class: 'table-scroll' }, el('table', { class: 'rtable' },
      el('thead', null, el('tr', null,
        el('th', { scope: 'col' }, 'Date'), el('th', { scope: 'col' }, 'Final'),
        el('th', { scope: 'col' }, 'EQUINE pick'), el('th', { scope: 'col' }, 'TimesFM score'),
        el('th', { scope: 'col' }, 'Pick'))),
      body)));
  }

  // ---------------------------------------------------------------- backtest
  var MODEL_NAMES = { equine_gp: 'EQUINE GP', logistic: 'Logistic regression', elo: 'Elo rating', home_team: 'Always the home team' };

  function seasonLabel(s) { return (s - 1) + '–' + String(s).slice(2); }

  function calibrationChart(points) {
    var W = 320, H = 320, P = 40, S = W - P - 12;
    var x = function (v) { return P + v * S; };
    var y = function (v) { return H - P - v * S; };
    var chart = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'calib', role: 'img',
      'aria-label': 'Calibration: predicted home win probability against how often the home team won' });
    [0, 0.25, 0.5, 0.75, 1].forEach(function (t) {
      chart.appendChild(svg('line', { x1: x(0), x2: x(1), y1: y(t), y2: y(t), class: 'grid' }));
      var ly = svg('text', { x: P - 8, y: y(t) + 4, class: 'tick', 'text-anchor': 'end' }); ly.textContent = pct(t); chart.appendChild(ly);
      var lx = svg('text', { x: x(t), y: H - P + 18, class: 'tick', 'text-anchor': 'middle' }); lx.textContent = pct(t); chart.appendChild(lx);
    });
    chart.appendChild(svg('line', { x1: x(0), y1: y(0), x2: x(1), y2: y(1), class: 'ref' }));
    var xl = svg('text', { x: x(0.5), y: H - 4, class: 'axis', 'text-anchor': 'middle' }); xl.textContent = 'Predicted';
    chart.appendChild(xl);
    var yl = svg('text', { x: 12, y: y(0.5), class: 'axis', 'text-anchor': 'middle', transform: 'rotate(-90 12 ' + y(0.5) + ')' });
    yl.textContent = 'Observed';
    chart.appendChild(yl);
    points.forEach(function (p) {
      var label = 'Predicted ' + pct(p.predicted) + ', home team won ' + pct(p.observed) + ' of ' + p.n.toLocaleString() + ' games';
      var g = svg('g', { class: 'pt', tabindex: '0', role: 'img', 'aria-label': label });
      g.appendChild(svg('circle', { cx: x(p.predicted), cy: y(p.observed), r: 14, class: 'hit-area' }));
      g.appendChild(svg('circle', { cx: x(p.predicted), cy: y(p.observed), r: 5, class: 'dot' }));
      g.addEventListener('pointerenter', function () { showTip(g, label); });
      g.addEventListener('pointerleave', hideTip);
      g.addEventListener('focus', function () { showTip(g, label); });
      g.addEventListener('blur', hideTip);
      chart.appendChild(g);
    });
    return chart;
  }

  function renderBacktest(bt) {
    var box = document.getElementById('backtest');
    box.textContent = '';
    var w = bt.winner;
    var models = ['equine_gp', 'logistic', 'elo', 'home_team'];

    var head = el('tr', null, el('th', { scope: 'col' }, 'Model'));
    w.seasons.forEach(function (s) { head.appendChild(el('th', { scope: 'col' }, seasonLabel(s.season))); });
    var body = el('tbody');
    models.forEach(function (m) {
      var tr = el('tr', { class: m === 'equine_gp' ? 'ours' : '' }, el('th', { scope: 'row' }, MODEL_NAMES[m]));
      w.seasons.forEach(function (s) {
        tr.appendChild(el('td', null,
          el('span', { class: 'v' }, pct(s[m].accuracy, 1)),
          el('span', { class: 'r' }, 'Brier ' + num(s[m].brier, 3))));
      });
      body.appendChild(tr);
    });
    box.appendChild(el('h3', { class: 'sub-h' }, 'Winners picked correctly'));
    box.appendChild(el('div', { class: 'table-scroll' },
      el('table', { class: 'btable' }, el('thead', null, head), body)));

    var nov = w.by_novelty || [];
    var novText = nov.length === 3
      ? 'Sorting the backtest games by EQUINE’s uncertainty, it picked ' + pct(nov[0].accuracy) +
        ' of the most familiar third correctly, ' + pct(nov[1].accuracy) + ' of the middle third and ' +
        pct(nov[2].accuracy) + ' of the least familiar third.'
      : '';
    var calib = el('figure', { class: 'calib-fig' },
      calibrationChart(w.reliability),
      el('figcaption', null,
        'Calibration over every backtest game. When EQUINE says the home team has a 70% chance, the home team should win about 70% of those games; dots on the dashed line mean the probabilities can be taken at face value. ',
        novText));
    box.appendChild(calib);

    var f = bt.forecast;
    if (f) {
      var rows = [['Team points', f.team_points]];
      [['pts', 'Player points'], ['reb', 'Player rebounds'], ['ast', 'Player assists'], ['fg3m', 'Player threes']].forEach(function (s) {
        if (f.players[s[0]]) rows.push([s[1], f.players[s[0]]]);
      });
      var fb = el('tbody');
      rows.forEach(function (r) {
        fb.appendChild(el('tr', null,
          el('th', { scope: 'row' }, r[0]),
          el('td', null, num(r[1].mae, 2)),
          el('td', null, num(r[1].baseline_mae, 2)),
          el('td', null, pct(r[1].coverage_80))));
      });
      box.appendChild(el('h3', { class: 'sub-h' }, 'TimesFM forecasts, ' + seasonLabel(f.season)));
      box.appendChild(el('p', { class: 'nba-note' },
        'Average miss on the next game, against a recent-form baseline (an exponentially weighted average of the same stat). The last column is how often the result landed inside the 80% range. Picking the side with more projected points gets the winner right ' +
        pct(f.winner_from_points_accuracy, 1) + ' of the time.'));
      box.appendChild(el('div', { class: 'table-scroll' }, el('table', { class: 'btable' },
        el('thead', null, el('tr', null,
          el('th', { scope: 'col' }, 'Forecast'), el('th', { scope: 'col' }, 'TimesFM miss'),
          el('th', { scope: 'col' }, 'Baseline miss'), el('th', { scope: 'col' }, 'Inside 80% range'))),
        fb)));
    }
  }

  // ---------------------------------------------------------------- method
  function renderMethod(data) {
    var m = data.models, w = m.winner, f = m.forecast, d = data.data;
    var box = document.getElementById('method');
    box.textContent = '';
    var prs = el('span');
    w.prs.forEach(function (n, i) {
      if (i) prs.appendChild(document.createTextNode(i === w.prs.length - 1 ? ' and ' : ', '));
      prs.appendChild(el('a', { class: 'ulink', href: EQUINE_REPO + '/pull/' + n, target: '_blank' }, '#' + n));
    });
    var paras = [
      el('p', null, el('b', null, 'Data. '),
        'Every regular-season, play-in and playoff game since ' + d.first_season + ', ' +
        d.games.toLocaleString() + ' games and ' + d.player_games.toLocaleString() +
        ' player appearances, pulled from ESPN’s public scoreboard data. A scheduled job adds the night’s games at 6:15 AM Eastern and refreshes the injury report at 5:30 PM.'),
      el('p', null, el('b', null, 'Winner. '),
        'Each game is described by ' + w.features.length + ' numbers computed only from earlier games: Elo ratings, recent offensive and defensive efficiency, the four factors, rest and back-to-backs, and how much of each roster is available. An ' +
        w.embedding + ' network embeds those numbers and EQUINE’s Gaussian-process head turns the embedding into a win probability, shrinking it toward 50% when a matchup looks unlike its training data. It is retrained every morning on ' +
        w.trained_on.toLocaleString() + ' games.'),
      el('p', null, el('b', null, 'EQUINE version. '),
        'Built from the newest open work on EQUINE rather than the last release: commit ',
        el('a', { class: 'ulink mono', href: EQUINE_REPO + '/commit/' + w.commit, target: '_blank' }, w.commit.slice(0, 7)),
        ', the top of the stack of open pull requests ', prs, '.'),
      el('p', null, el('b', null, 'Scores and stat lines. '),
        'TimesFM 2.5 reads each team’s points, and each rotation player’s points, rebounds, assists and threes, as a time series of up to ' +
        f.context + ' games and forecasts the next one without any training on basketball. Its XReg mode first fits a ridge regression on home or away, the opponent’s defensive rating and rest days, and TimesFM forecasts what that regression leaves over. The 2.5 checkpoint is used because its weights are Apache-2.0 licensed; TimesFM 3.0’s weights are licensed only for non-production use.'),
      el('p', null, el('b', null, 'Code. '),
        'The pipeline, the data and every published prediction are in ',
        el('a', { class: 'ulink', href: REPO, target: '_blank' }, 'martinez-hub/nbaPredicts'), '.')
    ];
    paras.forEach(function (p) { box.appendChild(p); });
  }

  // ---------------------------------------------------------------- load
  function fail(err) {
    document.getElementById('stamp').textContent =
      'The predictions could not be loaded (' + err.message + '). Reload the page, or check back after the next update.';
    document.getElementById('slate').textContent = '';
  }

  getJSON('latest.json').then(function (data) {
    document.getElementById('stamp').textContent =
      'Updated ' + fmtStamp(data.generated_at) + ', with box scores through ' +
      fmtDate(data.data.through, { month: 'long', day: 'numeric' }) + '. Season ' + data.season.replace('-', '–') + '.';
    renderSlate(data);
    renderRecord(data);
    renderMethod(data);
  }).catch(fail);

  getJSON('backtest.json').then(renderBacktest).catch(function () {
    document.getElementById('backtest').appendChild(el('p', { class: 'nba-empty' },
      'The backtest results are not published yet. They are recomputed every Monday.'));
  });
})();
