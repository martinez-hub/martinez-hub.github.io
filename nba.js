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
      el('i', { class: 's-mid', 'aria-hidden': 'true' }),
      g.market && g.market.p_market != null
        ? el('i', { class: 's-mkt', style: 'left:' + ((1 - g.market.p_market) * 100).toFixed(2) + '%', 'aria-hidden': 'true' })
        : null
    );
    var labels = el('div', { class: 'strip-labels', 'aria-hidden': 'true' },
      el('span', { class: fav === 'away' ? 'fav' : '' }, away.abbr + ' ' + pct(pa)),
      el('span', { class: fav === 'home' ? 'fav' : '' }, pct(g.p_home) + ' ' + home.abbr)
    );
    var mkt = null;
    if (g.market && g.market.p_market != null) {
      var mfav = g.market.p_market >= 0.5 ? home : away;
      var mp = g.market.p_market >= 0.5 ? g.market.p_market : 1 - g.market.p_market;
      var spread = g.market.spread == null ? '' : ', ' + home.abbr + ' ' + (g.market.spread > 0 ? '+' : '') + g.market.spread;
      mkt = el('p', { class: 'strip-mkt' }, el('i', { class: 'mkt-key', 'aria-hidden': 'true' }),
        'Betting line' + (g.market.books > 1 ? ' (' + g.market.books + ' books)' : '') + ': ' + mfav.abbr + ' ' + pct(mp) + spread +
        (g.p_model != null ? '. EQUINE without the line: ' + home.abbr + ' ' + pct(g.p_model) : ''));
    } else if (g.uses_line === false) {
      mkt = el('p', { class: 'strip-mkt' }, 'No betting line posted yet; this is EQUINE from team form alone.');
    }
    return el('div', { class: 'strip-wrap' }, bar, labels, mkt);
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
      if (rec.vs_market && rec.vs_market.n) {
        var v = rec.vs_market;
        items.push(['Against the line', 'EQUINE picked ' + v.equine_correct + ' of ' + v.n + ', the betting line ' +
          v.market_correct + ' of ' + v.n + ' (Brier ' + num(v.equine_brier, 3) + ' vs ' + num(v.market_brier, 3) + ')']);
      }
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
  var MODEL_NAMES = { equine_market: 'EQUINE with the line', market: 'Betting line (close)', equine_gp: 'EQUINE without the line', logistic: 'Logistic regression', elo: 'Elo rating', home_team: 'Always the home team' };

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
    var models = ['equine_market', 'market', 'equine_gp', 'logistic', 'elo', 'home_team'].filter(function (m) { return w.seasons[0] && w.seasons[0][m]; });

    var head = el('tr', null, el('th', { scope: 'col' }, 'Model'));
    w.seasons.forEach(function (s) { head.appendChild(el('th', { scope: 'col' }, seasonLabel(s.season))); });
    var body = el('tbody');
    models.forEach(function (m) {
      var ours = m === (models[0] === 'equine_market' ? 'equine_market' : 'equine_gp');
      var tr = el('tr', { class: ours ? 'ours' : '' }, el('th', { scope: 'row' }, MODEL_NAMES[m]));
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
      calibrationChart(w.reliability_market_model || w.reliability),
      el('figcaption', null,
        'Calibration of ' + (w.reliability_market_model ? 'EQUINE with the line' : 'EQUINE') + ' over every backtest game. When it says the home team has a 70% chance, the home team should win about 70% of those games; dots on the dashed line mean the probabilities can be taken at face value. ',
        novText ? novText.replace('EQUINE\u2019s uncertainty', 'the uncertainty of EQUINE without the line') : ''));
    box.appendChild(calib);

    var f = bt.forecast, z = bt.forecast_zero_shot;
    if (f) {
      var stats = [['pts', 'Player points'], ['reb', 'Player rebounds'], ['ast', 'Player assists'], ['fg3m', 'Player threes']];
      var pick = function (src, key) { return key === 'team' ? src.team_points : src.players[key]; };
      var rows = [['team', 'Team points']].concat(stats.filter(function (s) { return f.players[s[0]]; }));
      var fb = el('tbody');
      rows.forEach(function (r) {
        var cur = pick(f, r[0]);
        var cells = [el('th', { scope: 'row' }, r[1]), el('td', null, num(cur.mae, 2))];
        if (z) cells.push(el('td', null, num(pick(z, r[0]).mae, 2)));
        cells.push(el('td', null, num(cur.baseline_mae, 2)), el('td', null, pct(cur.coverage_80)));
        fb.appendChild(el('tr', null, cells));
      });
      var head = [el('th', { scope: 'col' }, 'Forecast'), el('th', { scope: 'col' }, z ? 'Fine-tuned miss' : 'TimesFM miss')];
      if (z) head.push(el('th', { scope: 'col' }, 'Zero-shot miss'));
      head.push(el('th', { scope: 'col' }, 'Baseline miss'), el('th', { scope: 'col' }, 'Inside 80% range'));
      box.appendChild(el('h3', { class: 'sub-h' }, 'TimesFM forecasts, ' + seasonLabel(f.season)));
      box.appendChild(el('p', { class: 'nba-note' },
        'Average miss on the next game. ' +
        (z ? 'Fine-tuned means TimesFM\u2019s output head retrained on NBA data from before the season; zero-shot is the released model. ' : '') +
        'The baseline is an exponentially weighted average of the same stat, and the last column is how often the result landed inside the 80% range. Picking the side with more projected points gets the winner right ' +
        pct(f.winner_from_points_accuracy, 1) + ' of the time.'));
      box.appendChild(el('div', { class: 'table-scroll' }, el('table', { class: 'btable' },
        el('thead', null, el('tr', null, head)), fb)));
    }
  }

  // ---------------------------------------------------------------- method
  function fineTuneParagraph(ft) {
    if (!ft || ft.reason) return null;
    var today = ft.used
      ? 'Today\u2019s update kept the fine-tuned head: on the ' + ft.holdout_games +
        ' most recent games it missed by ' + pct(1 - ft.mae_ratio, 1) + ' less than the released model.'
      : 'Today\u2019s update kept the released model, because the fine-tuned head did not forecast the ' +
        ft.holdout_games + ' most recent games any better.';
    return el('p', null, el('b', null, 'Daily fine-tuning. '),
      'Each morning TimesFM\u2019s output head is retrained on NBA team and player series, ' +
      'holding out the ' + ft.holdout_games + ' most recent games, and kept only if it beats the released model on them. ' + today);
  }

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
        ' player appearances, pulled from ESPN’s public scoreboard data. A scheduled job adds the night’s games early each morning and refreshes the injury report late each afternoon, Eastern time.'),
      el('p', null, el('b', null, 'Winner. '),
        'Each game is described by ' + w.features.length + ' numbers computed only from what was known before tip-off: Elo ratings, recent offensive and defensive efficiency, the four factors, rest and back-to-backs, and each roster\u2019s expected strength, from player plus-minus ratings weighted by projected minutes and each player\u2019s chance of playing in the NBA\u2019s official injury report. An ' +
        w.embedding + ' network embeds those numbers and EQUINE’s Gaussian-process head turns the embedding into a win probability, shrinking it toward 50% when a matchup looks unlike its training data. It is retrained every morning on ' +
        w.trained_on.toLocaleString() + ' games.' +
        (w.stacked ? ' When a betting line is posted, a second EQUINE head takes two inputs, the line\u2019s win probability (several sportsbooks\u2019 median, bookmaker margin removed) and the team-form model\u2019s, and its output is the published pick. Over three seasons that model matched the closing line within noise and did not beat it, nor the opening line: what the features know, the betting market has largely priced in already.' : '')),
      el('p', null, el('b', null, 'EQUINE version. '),
        'Built from the newest open work on EQUINE rather than the last release: commit ',
        el('a', { class: 'ulink mono', href: EQUINE_REPO + '/commit/' + w.commit, target: '_blank' }, w.commit.slice(0, 7)),
        ', the top of the stack of open pull requests ', prs, '.'),
      el('p', null, el('b', null, 'Scores and stat lines. '),
        'TimesFM 2.5 reads each team’s points, and each rotation player’s points, rebounds, assists and threes, as a time series of up to ' +
        f.context + ' games and forecasts the next one without any training on basketball. Its XReg mode first fits a ridge regression on home or away, the opponent’s defensive rating and rest days, and TimesFM forecasts what that regression leaves over. The 2.5 checkpoint is used because its weights are Apache-2.0 licensed; TimesFM 3.0’s weights are licensed only for non-production use.'),
      fineTuneParagraph(f.fine_tune),
      el('p', null, el('b', null, 'Code. '),
        'The pipeline, the data and every published prediction are in ',
        el('a', { class: 'ulink', href: REPO, target: '_blank' }, 'martinez-hub/nbaPredicts'), '.')
    ];
    paras.forEach(function (p) { if (p) box.appendChild(p); });
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
