import { computeMonotoneCubicSpline } from '../utils/spline';

export function getDashboardScript(
    weekDataJson: string,
    fourWeeksDataJson: string,
    fourWeeksAggJson: string,
    active: boolean,
    todaySec: number,
    idleSec: number,
    dailyGoalSeconds: number,
    initialItemsLimit = 5,
    maxExpandedItems = 10
): string {
    return /* javascript */`
  const vsc = acquireVsCodeApi();
  function msg(command, extra) { vsc.postMessage({ command, ...extra }); }
  function triggerExport() { vsc.postMessage({ command: 'export', activePeriod, currentDayIndex }); }
  function openFile(filePath) { vsc.postMessage({ command: 'openFile', file: filePath }); }
  function openProject(projPath, projName) { vsc.postMessage({ command: 'openProject', project: projName || projPath, path: projPath }); }

  const INITIAL_LIMIT = ${initialItemsLimit};
  const EXPANDED_LIMIT = ${maxExpandedItems};
  const dailyGoalSeconds = ${dailyGoalSeconds};

  const weekData = ${weekDataJson};
  const fourWeeksData = ${fourWeeksDataJson};
  const fourWeeksAgg = ${fourWeeksAggJson};
  const prevState = vsc.getState() || {};
  let currentDayIndex = (prevState.currentDayIndex !== undefined && prevState.currentDayIndex < weekData.length) ? prevState.currentDayIndex : 6;
  let showAllFiles = prevState.showAllFiles || false;
  let showAllLangs = prevState.showAllLangs || false;
  let showAllProjects = prevState.showAllProjects || false;
  let activePeriod = prevState.activePeriod || 'thisweek';

  let liveActive = ${active};
  let liveTodaySec = ${todaySec};
  let liveIdleSec = ${idleSec};

  function isThisWeekPeriod(p) {
    const periodName = p !== undefined ? p : activePeriod;
    return !periodName || periodName === 'thisweek';
  }

  function formatTime(totalSeconds) {
    if (totalSeconds < 60) return Math.floor(totalSeconds) + 's';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    if (h === 0) return m + 'm';
    return m > 0 ? h + 'h ' + m + 'm' : h + 'h';
  }

  function updateGoalElements(daySec) {
    const goalTopWrap = document.getElementById('goalTopWrap');
    const goalTopBadge = document.getElementById('goalTopBadge');
    const goalTrack = document.getElementById('goalTrack');
    if (dailyGoalSeconds > 0) {
      const pct = Math.min(Math.round((daySec / dailyGoalSeconds) * 100), 100);
      const isMet = daySec >= dailyGoalSeconds;
      if (goalTopWrap) goalTopWrap.style.display = 'flex';
      if (goalTopBadge) {
        goalTopBadge.className = 'goal-top-badge' + (isMet ? ' achieved' : '');
        goalTopBadge.title = 'Daily Goal: ' + formatTime(dailyGoalSeconds) + ' (' + pct + '%) · Click to edit';
        goalTopBadge.innerHTML = '<span>' + (isMet ? 'Goal Met' : 'Goal: ' + pct + '%') + '</span>';
      }
      if (goalTrack) {
        goalTrack.style.display = '';
        goalTrack.title = 'Daily Goal: ' + formatTime(dailyGoalSeconds) + ' (' + pct + '%) · Click to edit';
        const bar = goalTrack.querySelector('.goal-bar');
        if (bar) {
          bar.className = 'goal-bar' + (isMet ? ' completed' : '');
          bar.style.width = pct + '%';
        }
      }
    } else {
      if (currentDayIndex === 6 && isThisWeekPeriod()) {
        if (goalTopWrap) goalTopWrap.style.display = 'flex';
        if (goalTopBadge) {
          goalTopBadge.className = 'goal-set-link';
          goalTopBadge.textContent = '+ Set Goal';
          goalTopBadge.title = 'Set daily goal';
        }
      } else {
        if (goalTopWrap) goalTopWrap.style.display = 'none';
      }
      if (goalTrack) goalTrack.style.display = 'none';
    }
  }

  setInterval(() => {
    if (liveActive && currentDayIndex === 6 && isThisWeekPeriod()) {
      liveTodaySec++;
      const heroTime = document.getElementById('heroTime');
      if (heroTime) heroTime.textContent = formatTime(liveTodaySec);
      if (dailyGoalSeconds > 0) {
        updateGoalElements(liveTodaySec);
      }
    } else if (!liveActive && currentDayIndex === 6 && isThisWeekPeriod()) {
      liveIdleSec++;
      const heroIdleCount = document.getElementById('heroIdleCount');
      if (heroIdleCount) {
        heroIdleCount.textContent = formatTime(liveIdleSec);
      }
    }
  }, 1000);

  function persistState() {
    vsc.setState({ currentDayIndex, showAllFiles, showAllLangs, showAllProjects, activePeriod });
  }

  const getMonotoneSplinePath = ${computeMonotoneCubicSpline.toString()};

  function getWeekIndex(p = activePeriod) {
    if (!p || p === 'thisweek') return 0;
    const num = parseInt(p.replace('week', ''), 10);
    return isNaN(num) ? 0 : num;
  }

  function getWaveX(idx) {
    if (activePeriod === 'fourweeks') {
      return 35 + idx * 70;
    }
    return 20 + idx * 40;
  }

  function renderWaveChart(days, prevDays, isFourWeeksMode) {
    const areaPathEl = document.getElementById('waveAreaPath');
    const linePathEl = document.getElementById('waveLinePath');
    const ghostPathEl = document.getElementById('waveGhostPath');
    const crosshair = document.getElementById('waveCrosshair');
    const waveLabelsWrap = document.getElementById('waveLabelsWrap');
    const gridLinesEl = document.getElementById('waveGridLines');
    if (!areaPathEl || !linePathEl) return;

    const goalLineEl = document.getElementById('waveGoalLine');
    if (isFourWeeksMode) {
      if (goalLineEl) goalLineEl.style.opacity = '0';
      const weekItems = [
        { label: '3 Wk Ago', fullLabel: '3 Weeks Ago', dateRange: (fourWeeksData[3] && fourWeeksData[3].dateRange) || '', seconds: (fourWeeksData[3] && fourWeeksData[3].totalSeconds) || 0, formattedTotal: (fourWeeksData[3] && fourWeeksData[3].formattedTotal) || '0m', periodVal: 'week3' },
        { label: '2 Wk Ago', fullLabel: '2 Weeks Ago', dateRange: (fourWeeksData[2] && fourWeeksData[2].dateRange) || '', seconds: (fourWeeksData[2] && fourWeeksData[2].totalSeconds) || 0, formattedTotal: (fourWeeksData[2] && fourWeeksData[2].formattedTotal) || '0m', periodVal: 'week2' },
        { label: 'Last Wk', fullLabel: 'Last Week', dateRange: (fourWeeksData[1] && fourWeeksData[1].dateRange) || '', seconds: (fourWeeksData[1] && fourWeeksData[1].totalSeconds) || 0, formattedTotal: (fourWeeksData[1] && fourWeeksData[1].formattedTotal) || '0m', periodVal: 'week1' },
        { label: 'This Wk', fullLabel: 'This Week', dateRange: (fourWeeksData[0] && fourWeeksData[0].dateRange) || '', seconds: (fourWeeksData[0] && fourWeeksData[0].totalSeconds) || 0, formattedTotal: (fourWeeksData[0] && fourWeeksData[0].formattedTotal) || '0m', periodVal: 'thisweek' }
      ];
      const maxWSec = Math.max(...weekItems.map(w => w.seconds), 1);
      const xs4 = [35, 105, 175, 245];
      const points4 = weekItems.map((w, i) => {
        const x = xs4[i];
        const ratio = w.seconds / maxWSec;
        const y = 50 - (ratio * 40);
        return { x, y };
      });
      const lineD = getMonotoneSplinePath(points4);
      const areaD = lineD + ' L 245 56 L 35 56 Z';
      linePathEl.setAttribute('d', lineD);
      linePathEl.style.opacity = '1';
      areaPathEl.setAttribute('d', areaD);
      areaPathEl.style.opacity = '1';
      if (ghostPathEl) ghostPathEl.style.opacity = '0';
      if (crosshair) {
        crosshair.setAttribute('x1', '245');
        crosshair.setAttribute('x2', '245');
        crosshair.style.opacity = '0.4';
      }
      if (gridLinesEl) {
        gridLinesEl.innerHTML = xs4.map(x => '<line x1="' + x + '" y1="8" x2="' + x + '" y2="52" stroke="rgba(255,255,255,.08)" stroke-width="1" />').join('');
      }
      if (waveLabelsWrap) waveLabelsWrap.style.gridTemplateColumns = 'repeat(4, 1fr)';

      for (let i = 0; i < 7; i++) {
        const node = document.getElementById('waveNode_' + i);
        const dot  = document.getElementById('waveDot_' + i);
        const lbl  = document.getElementById('waveLbl_' + i);
        if (i < 4) {
          const isThisWk = (i === 3);
          const tooltip = weekItems[i].formattedTotal + ' · ' + weekItems[i].fullLabel + ' (' + weekItems[i].dateRange + ')';
          if (node) {
            node.style.display = 'block';
            if (isThisWk) node.classList.add('selected');
            else node.classList.remove('selected');
            node.classList.remove('hovered');
            node.onclick = () => selectPeriod(weekItems[i].periodVal);
            node.onmouseenter = () => onHoverDay(i);
            node.onmouseleave = () => onLeaveDay();
            node.setAttribute('title', tooltip);
            let titleEl = node.querySelector('title');
            if (!titleEl) {
              titleEl = document.createElementNS('http://www.w3.org/2000/svg', 'title');
              node.appendChild(titleEl);
            }
            titleEl.textContent = tooltip;
            const hit = node.querySelector('rect');
            if (hit) {
              hit.setAttribute('x', String(xs4[i] - 35));
              hit.setAttribute('width', '70');
            }
          }
          if (dot) {
            dot.setAttribute('cx', points4[i].x.toFixed(1));
            dot.setAttribute('cy', points4[i].y.toFixed(1));
            dot.setAttribute('r', isThisWk ? '4' : '2.5');
          }
          if (lbl) {
            lbl.style.display = 'flex';
            if (isThisWk) lbl.classList.add('selected');
            else lbl.classList.remove('selected');
            lbl.classList.remove('hovered', 'today', 'goal-met');
            lbl.onclick = () => selectPeriod(weekItems[i].periodVal);
            lbl.onmouseenter = () => onHoverDay(i);
            lbl.onmouseleave = () => onLeaveDay();
            lbl.setAttribute('title', tooltip);
            const span = lbl.querySelector('.wave-lbl');
            if (span) span.textContent = weekItems[i].label;
          }
        } else {
          if (node) node.style.display = 'none';
          if (lbl) lbl.style.display = 'none';
        }
      }
      return;
    }

    if (!days || days.length === 0) return;

    if (gridLinesEl) {
      gridLinesEl.innerHTML = [20, 60, 100, 140, 180, 220, 260].map(x => '<line x1="' + x + '" y1="8" x2="' + x + '" y2="52" stroke="rgba(255,255,255,.08)" stroke-width="1" />').join('');
    }
    if (waveLabelsWrap) waveLabelsWrap.style.gridTemplateColumns = 'repeat(7, 1fr)';
    if (crosshair) crosshair.style.opacity = '0.4';

    const maxSec = Math.max(
      ...days.map(d => d.seconds),
      ...(prevDays && prevDays.length ? prevDays.map(d => d.seconds) : [0]),
      1
    );

    if (goalLineEl) {
      if (dailyGoalSeconds > 0) {
        const goalRatio = dailyGoalSeconds / maxSec;
        const goalY = 50 - (goalRatio * 40);
        if (goalY >= 6 && goalY <= 52) {
          goalLineEl.setAttribute('y1', goalY.toFixed(1));
          goalLineEl.setAttribute('y2', goalY.toFixed(1));
          goalLineEl.style.opacity = '0.65';
          let titleEl = goalLineEl.querySelector('title');
          if (!titleEl) {
            titleEl = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            goalLineEl.appendChild(titleEl);
          }
          titleEl.textContent = 'Daily Goal: ' + formatTime(dailyGoalSeconds);
        } else {
          goalLineEl.style.opacity = '0';
        }
      } else {
        goalLineEl.style.opacity = '0';
      }
    }

    const xs = [20, 60, 100, 140, 180, 220, 260];
    const points = days.map((d, i) => {
      const x = xs[i] || 20;
      const ratio = d.seconds / maxSec;
      const y = 50 - (ratio * 40);
      return { x, y, isToday: Boolean(d.isToday) };
    });

    const lineD = getMonotoneSplinePath(points);
    const areaD = lineD + ' L 260 56 L 20 56 Z';

    linePathEl.setAttribute('d', lineD);
    areaPathEl.setAttribute('d', areaD);

    if (ghostPathEl) {
      if (prevDays && prevDays.length === 7) {
        const prevPoints = prevDays.map((d, i) => {
          const x = xs[i] || 20;
          const ratio = d.seconds / maxSec;
          const y = 50 - (ratio * 40);
          return { x, y };
        });
        const ghostD = getMonotoneSplinePath(prevPoints);
        ghostPathEl.setAttribute('d', ghostD);
        ghostPathEl.style.opacity = '1';
      } else {
        ghostPathEl.style.opacity = '0';
      }
    }

    points.forEach((pt, i) => {
      const node = document.getElementById('waveNode_' + i);
      const dot = document.getElementById('waveDot_' + i);
      const lbl = document.getElementById('waveLbl_' + i);
      const isGoalMet = dailyGoalSeconds > 0 && days[i] && days[i].seconds >= dailyGoalSeconds;
      const goalInfo = (dailyGoalSeconds > 0 && days[i]) ? (isGoalMet ? ' · Goal Met' : ' · Goal: ' + Math.min(Math.round((days[i].seconds / dailyGoalSeconds) * 100), 100) + '%') : '';

      if (node && days[i]) {
        node.style.display = 'block';
        node.onclick = () => selectDay(i);
        node.onmouseenter = () => onHoverDay(i);
        node.onmouseleave = () => onLeaveDay();
        const tooltip = days[i].formattedTotal + goalInfo + ' · ' + (days[i].fullLabel || days[i].date);
        node.setAttribute('title', tooltip);
        let titleEl = node.querySelector('title');
        if (!titleEl) {
          titleEl = document.createElementNS('http://www.w3.org/2000/svg', 'title');
          node.appendChild(titleEl);
        }
        titleEl.textContent = tooltip;
        const hit = node.querySelector('rect');
        if (hit) {
          hit.setAttribute('x', String(pt.x - 20));
          hit.setAttribute('width', '40');
        }
      }
      if (dot) {
        dot.setAttribute('cx', pt.x.toFixed(1));
        dot.setAttribute('cy', pt.y.toFixed(1));
        dot.setAttribute('r', i === currentDayIndex ? '4' : '2.5');
      }
      if (lbl && days[i]) {
        lbl.style.display = 'flex';
        if (isGoalMet) lbl.classList.add('goal-met');
        else lbl.classList.remove('goal-met');
        lbl.onclick = () => selectDay(i);
        lbl.onmouseenter = () => onHoverDay(i);
        lbl.onmouseleave = () => onLeaveDay();
        const tooltip = days[i].formattedTotal + goalInfo + ' · ' + (days[i].fullLabel || days[i].date);
        lbl.setAttribute('title', tooltip);
        const span = lbl.querySelector('.wave-lbl');
        if (span) span.textContent = days[i].label;
      }
    });

    if (crosshair) {
      const x = getWaveX(currentDayIndex);
      crosshair.setAttribute('x1', x);
      crosshair.setAttribute('x2', x);
      crosshair.style.opacity = '0.4';
    }
  }

  function onHoverDay(idx) {
    const waveSvg = document.getElementById('waveSvg');
    if (waveSvg) waveSvg.classList.add('is-hovering');

    const crosshair = document.getElementById('waveCrosshair');
    if (crosshair) {
      const x = getWaveX(idx);
      crosshair.setAttribute('x1', x);
      crosshair.setAttribute('x2', x);
      crosshair.style.opacity = '0.85';
    }
    for (let i = 0; i < 7; i++) {
      const node = document.getElementById('waveNode_' + i);
      const dot  = document.getElementById('waveDot_' + i);
      const lbl  = document.getElementById('waveLbl_' + i);
      if (node) {
        if (i === idx) node.classList.add('hovered');
        else node.classList.remove('hovered');
      }
      if (dot) {
        if (i === idx) dot.setAttribute('r', '4.5');
        else dot.setAttribute('r', (activePeriod === 'fourweeks' ? (i === 3 ? '4' : '2.5') : (i === currentDayIndex ? '4' : '2.5')));
      }
      if (lbl) {
        if (i === idx) lbl.classList.add('hovered');
        else lbl.classList.remove('hovered');
      }
    }
  }

  function onLeaveDay() {
    const waveSvg = document.getElementById('waveSvg');
    if (waveSvg) waveSvg.classList.remove('is-hovering');

    const crosshair = document.getElementById('waveCrosshair');
    if (crosshair) {
      const x = getWaveX(activePeriod === 'fourweeks' ? 3 : currentDayIndex);
      crosshair.setAttribute('x1', x);
      crosshair.setAttribute('x2', x);
      crosshair.style.opacity = '0.4';
    }
    for (let i = 0; i < 7; i++) {
      const node = document.getElementById('waveNode_' + i);
      const dot  = document.getElementById('waveDot_' + i);
      const lbl  = document.getElementById('waveLbl_' + i);
      if (node) node.classList.remove('hovered');
      if (dot) dot.setAttribute('r', (activePeriod === 'fourweeks' ? (i === 3 ? '4' : '2.5') : (i === currentDayIndex ? '4' : '2.5')));
      if (lbl) lbl.classList.remove('hovered');
    }
  }

  function selectPeriod(period) {
    activePeriod = period;
    showAllFiles = false;
    showAllLangs = false;
    showAllProjects = false;

    const dropdown = document.getElementById('periodDropdown');
    if (dropdown) dropdown.value = period;

    const waveChartSection = document.getElementById('waveChartSection');
    const chartMeta = document.getElementById('chartMeta');

    if (isThisWeekPeriod(period) || period.startsWith('week')) {
      if (waveChartSection) waveChartSection.style.display = 'block';
      const wIdx = getWeekIndex(period);
      const wData = fourWeeksData[wIdx] || fourWeeksData[0];
      const prevWData = fourWeeksData[wIdx + 1];
      if (chartMeta) {
        chartMeta.textContent = wData.formattedTotal + ' total';
        chartMeta.title = '';
      }
      const heroFourWeeksMeta = document.getElementById('heroFourWeeksMeta');
      if (heroFourWeeksMeta) heroFourWeeksMeta.style.display = 'none';

      renderWaveChart(wData.days, prevWData ? prevWData.days : null, false);
      const dayIdx = (currentDayIndex >= 0 && currentDayIndex < 7) ? currentDayIndex : 6;
      selectDay(dayIdx, false);
    } else if (period === 'fourweeks') {
      if (waveChartSection) waveChartSection.style.display = 'block';
      const activeDaysCount = (fourWeeksAgg.activeDays !== undefined) ? fourWeeksAgg.activeDays : 0;
      if (chartMeta) {
        chartMeta.textContent = activeDaysCount + '/28 Active Days';
        const restDaysCount = Math.max(28 - activeDaysCount, 0);
        chartMeta.title = activeDaysCount + ' active days · ' + restDaysCount + ' rest days';
      }
      
      const heroLabel = document.getElementById('heroLabel');
      const heroTime = document.getElementById('heroTime');
      const heroStreak = document.getElementById('heroStreak');
      const heroStatusLine = document.getElementById('heroStatusLine');
      const heroFourWeeksMeta = document.getElementById('heroFourWeeksMeta');
      const goalTopWrap = document.getElementById('goalTopWrap');
      const goalTrack = document.getElementById('goalTrack');
      if (heroLabel) heroLabel.textContent = fourWeeksAgg.dateRange || 'Last 4 Weeks';
      if (heroTime) heroTime.textContent = formatTime(fourWeeksAgg.totalSeconds);
      if (heroStreak) heroStreak.style.display = 'none';
      if (heroStatusLine) heroStatusLine.style.display = 'none';
      if (goalTopWrap) goalTopWrap.style.display = 'none';
      if (goalTrack) goalTrack.style.display = 'none';

      if (heroFourWeeksMeta) {
        heroFourWeeksMeta.style.display = 'flex';
        const avgStr = formatTime(fourWeeksAgg.avgSecondsPerDay || 0) + '/d';
        const peakStr = fourWeeksAgg.peakDay ? formatTime(fourWeeksAgg.peakDay.seconds) : '-';
        const peakTitle = fourWeeksAgg.peakDay ? ('Peak day: ' + fourWeeksAgg.peakDay.label + ' (' + formatTime(fourWeeksAgg.peakDay.seconds) + ')') : 'No data';
        const maxStreak = fourWeeksAgg.maxStreak || 0;
        const avgTitle = 'Daily average: ' + avgStr;
        const streakTitle = 'Longest streak: ' + maxStreak + (maxStreak === 1 ? ' consecutive day' : ' consecutive days');

        const metaHtml = '<span title="' + escHtml(avgTitle) + '">Avg <strong class="hero-fourweeks-meta-val">' + escHtml(avgStr) + '</strong></span>' +
          '<span class="hero-fourweeks-meta-sep">·</span>' +
          '<span title="' + escHtml(peakTitle) + '">Peak <strong class="hero-fourweeks-meta-val">' + escHtml(peakStr) + '</strong></span>' +
          '<span class="hero-fourweeks-meta-sep">·</span>' +
          '<span title="' + escHtml(streakTitle) + '">Streak <strong class="hero-fourweeks-meta-val">' + maxStreak + 'd</strong></span>';
        heroFourWeeksMeta.innerHTML = metaHtml;
      }

      document.getElementById('filesTitle').textContent = 'Files';
      document.getElementById('langsTitle').textContent = 'Languages';
      document.getElementById('projectsTitle').textContent = 'Projects';
      renderWaveChart(null, null, true);
      renderFiles(fourWeeksAgg);
      renderLangs(fourWeeksAgg);
      renderProjects(fourWeeksAgg);
      renderRhythm(fourWeeksAgg);
    }
    persistState();
  }

  function renderRhythm(d) {
    const rhythmPeak = document.getElementById('rhythmPeak');
    const rhythmBars = document.getElementById('rhythmBars');
    if (!rhythmPeak || !rhythmBars) return;

    const hourly = (d && d.hourly) ? d.hourly : new Array(24).fill(0);
    const maxHourSec = (d && d.maxHourSec) ? d.maxHourSec : Math.max(...hourly, 1);
    rhythmPeak.textContent = 'Peak: ' + ((d && d.peakHour) ? d.peakHour : 'None');

    rhythmBars.innerHTML = hourly.map((sec, h) => {
      const hourStr = String(h).padStart(2, '0') + ':00';
      const isPeak = Boolean(d && d.peakHour && d.peakHour.startsWith(hourStr) && sec > 0);
      const title = hourStr + ' · ' + formatTime(sec) + (isPeak ? ' (Peak)' : '');
      const pct = maxHourSec > 0 ? Math.round((sec / maxHourSec) * 100) : 0;
      const barHeight = sec > 0 ? Math.max(pct, 12) : 6;
      const isEven = (h % 2 === 0);
      const activeClass = sec > 0 ? ' active ' + (isEven ? 'even' : 'odd') : '';
      return '<div class="rhythm-bar-col" title="' + escHtml(title) + '"><div class="rhythm-bar' + activeClass + '" style="height:' + barHeight + '%"></div></div>';
    }).join('');
  }

  function getCurrentData() {
    if (isThisWeekPeriod()) {
      return (fourWeeksData[0] && fourWeeksData[0].days && fourWeeksData[0].days[currentDayIndex]) || weekData[currentDayIndex];
    } else if (activePeriod.startsWith('week')) {
      const wIdx = getWeekIndex();
      const wData = fourWeeksData[wIdx] || fourWeeksData[0];
      return (wData.days && wData.days[currentDayIndex]) || wData;
    } else if (activePeriod === 'fourweeks') {
      return fourWeeksAgg;
    }
    return weekData[currentDayIndex];
  }

  function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  let currentSearchQuery = '';

  function onQuickSearch(q) {
    currentSearchQuery = (q || '').trim().toLowerCase();
    renderFiles(getCurrentData());
    renderLangs(getCurrentData());
    renderProjects(getCurrentData());
  }

  function getMoreBtnHtml(total, isShowingAll, toggleFnName, unitName) {
    if (currentSearchQuery || total <= INITIAL_LIMIT) return '';
    const moreCount = Math.min(total, EXPANDED_LIMIT) - INITIAL_LIMIT;
    const btnText = isShowingAll ? 'Show less' : ('+ ' + moreCount + ' more ' + unitName);
    return '<button class="more-btn" onclick="' + toggleFnName + '()">' + btnText + '</button>';
  }

  function renderFiles(d) {
    const filesList = document.getElementById('filesList');
    const allFiles = d.files || [];
    const filteredFiles = currentSearchQuery
      ? allFiles.filter(f => f.fname.toLowerCase().includes(currentSearchQuery) || f.file.toLowerCase().includes(currentSearchQuery))
      : allFiles;

    if (filteredFiles.length === 0) {
      filesList.innerHTML = '<div class="empty"><p>' + (currentSearchQuery ? 'No matching files' : 'No files tracked for this period') + '</p></div>';
      return;
    }

    const limit = currentSearchQuery ? filteredFiles.length : (showAllFiles ? EXPANDED_LIMIT : INITIAL_LIMIT);
    const visibleFiles = filteredFiles.slice(0, limit);
    const total = filteredFiles.length;

    let html = visibleFiles.map(f => \`
      <div class="lang-item clickable" onclick="openFile('\${escHtml(f.file)}')" title="\${escHtml(f.file)} · \${f.percent}%">
        <div class="lang-item-header">
          <div class="lang-item-left">
            \${f.iconHtml}
            <span class="lang-name">\${escHtml(f.fname)}</span>
          </div>
          <span class="lang-time">\${escHtml(f.formattedTime)}</span>
        </div>
        <div class="lang-bar-wrap">
          <div class="lang-bar" style="width:\${f.barWidth || 0}%;background:\${f.color || '#3794ff'}"></div>
        </div>
      </div>
    \`).join('');

    html += getMoreBtnHtml(total, showAllFiles, 'toggleFiles', 'files');
    filesList.innerHTML = html;
  }

  function renderLangs(d) {
    const langsList = document.getElementById('langsList');
    const allLangs = d.languages || [];
    const filteredLangs = currentSearchQuery
      ? allLangs.filter(l => l.displayName.toLowerCase().includes(currentSearchQuery) || (l.lang && l.lang.toLowerCase().includes(currentSearchQuery)))
      : allLangs;

    if (filteredLangs.length === 0) {
      if (langsList) langsList.innerHTML = '<div class="empty"><p>' + (currentSearchQuery ? 'No matching languages' : 'No languages tracked for this period') + '</p></div>';
      return;
    }

    const limit = currentSearchQuery ? filteredLangs.length : (showAllLangs ? EXPANDED_LIMIT : INITIAL_LIMIT);
    const visibleLangs = filteredLangs.slice(0, limit);
    const total = filteredLangs.length;

    let html = visibleLangs.map(l => \`
      <div class="lang-item" title="\${escHtml(l.displayName)} · \${l.percent}%">
        <div class="lang-item-header">
          <div class="lang-item-left">
            \${l.iconHtml}
            <span class="lang-name">\${escHtml(l.displayName)}</span>
          </div>
          <span class="lang-time">\${escHtml(l.formattedTime)}</span>
        </div>
        <div class="lang-bar-wrap">
          <div class="lang-bar" style="width:\${l.barWidth}%;background:\${l.color}"></div>
        </div>
      </div>
    \`).join('');

    html += getMoreBtnHtml(total, showAllLangs, 'toggleLangs', 'languages');
    langsList.innerHTML = html;
  }

  function renderProjects(d) {
    const projectsList = document.getElementById('projectsList');
    const allProjects = d.projects || [];
    const filteredProjects = currentSearchQuery
      ? allProjects.filter(p => p.project.toLowerCase().includes(currentSearchQuery) || (p.path && p.path.toLowerCase().includes(currentSearchQuery)))
      : allProjects;

    if (filteredProjects.length === 0) {
      projectsList.innerHTML = '<div class="empty"><p>' + (currentSearchQuery ? 'No matching projects' : 'No projects tracked for this period') + '</p></div>';
      return;
    }

    const limit = currentSearchQuery ? filteredProjects.length : (showAllProjects ? EXPANDED_LIMIT : INITIAL_LIMIT);
    const visibleProjects = filteredProjects.slice(0, limit);
    const total = filteredProjects.length;

    let html = visibleProjects.map(p => \`
      <div class="lang-item clickable" onclick="openProject('\${escHtml(p.path || p.project)}', '\${escHtml(p.project)}')" title="\${escHtml(p.path || p.project)} · \${p.percent}%">
        <div class="lang-item-header">
          <div class="lang-item-left">
            \${p.iconHtml}
            <span class="lang-name">\${escHtml(p.project)}</span>
          </div>
          <span class="lang-time">\${escHtml(p.formattedTime)}</span>
        </div>
        <div class="lang-bar-wrap">
          <div class="lang-bar" style="width:\${p.barWidth}%;background:#3794ff"></div>
        </div>
      </div>
    \`).join('');

    html += getMoreBtnHtml(total, showAllProjects, 'toggleProjects', 'projects');
    projectsList.innerHTML = html;
  }

  function toggleFiles() {
    showAllFiles = !showAllFiles;
    persistState();
    renderFiles(getCurrentData());
  }

  function toggleLangs() {
    showAllLangs = !showAllLangs;
    persistState();
    renderLangs(getCurrentData());
  }

  function toggleProjects() {
    showAllProjects = !showAllProjects;
    persistState();
    renderProjects(getCurrentData());
  }

  function selectDay(index, isManualClick = true) {
    currentDayIndex = index;
    if (isManualClick) {
      showAllFiles = false;
      showAllLangs = false;
      showAllProjects = false;
    }
    persistState();

    let activeWData = fourWeeksData[0];
    if (activePeriod.startsWith('week')) {
      const wIdx = getWeekIndex();
      if (wIdx >= 0 && wIdx < 4) activeWData = fourWeeksData[wIdx];
    }

    const d = (activeWData.days && activeWData.days[index]) ? activeWData.days[index] : weekData[index];

    // Highlight active day wave node and label
    for (let i = 0; i < 7; i++) {
      const node = document.getElementById('waveNode_' + i);
      const dot  = document.getElementById('waveDot_' + i);
      const lbl  = document.getElementById('waveLbl_' + i);
      if (node) {
        if (i === index) node.classList.add('selected');
        else node.classList.remove('selected');
      }
      if (dot) {
        dot.setAttribute('r', i === index ? '4' : '2.5');
      }
      if (lbl) {
        if (i === index) lbl.classList.add('selected');
        else lbl.classList.remove('selected');
      }
    }

    const crosshair = document.getElementById('waveCrosshair');
    if (crosshair) {
      const x = getWaveX(index);
      crosshair.setAttribute('x1', x);
      crosshair.setAttribute('x2', x);
      crosshair.style.opacity = '0.4';
    }

    // Hero header
    const heroLabel = document.getElementById('heroLabel');
    const heroTime = document.getElementById('heroTime');
    const heroStreak = document.getElementById('heroStreak');
    const heroStatusLine = document.getElementById('heroStatusLine');
    const heroFourWeeksMeta = document.getElementById('heroFourWeeksMeta');
    const goalTopWrap = document.getElementById('goalTopWrap');
    const goalTrack = document.getElementById('goalTrack');

    if (heroFourWeeksMeta) heroFourWeeksMeta.style.display = 'none';

    if (d && d.isToday) {
      if (heroLabel) {
        heroLabel.textContent = 'Today';
        heroLabel.setAttribute('title', d.fullLabel || 'Today');
      }
      if (heroTime) heroTime.textContent = formatTime(liveTodaySec);
      if (heroStreak) heroStreak.style.display = 'inline-flex';
      if (heroStatusLine) heroStatusLine.style.display = 'flex';
      updateGoalElements(liveTodaySec);
    } else if (d) {
      if (heroLabel) {
        heroLabel.textContent = d.fullLabel || (d.label + ' (' + d.date + ')');
        heroLabel.removeAttribute('title');
      }
      if (heroTime) heroTime.textContent = d.formattedTotal;
      if (heroStreak) heroStreak.style.display = 'none';
      if (heroStatusLine) heroStatusLine.style.display = 'none';
      updateGoalElements(d.seconds);
    }

    document.getElementById('projectsTitle').textContent = 'Projects';

    renderFiles(d);
    renderLangs(d);
    renderProjects(d);
    renderRhythm(d);
  }

  // Render initial period preserving saved state
  selectPeriod(activePeriod);
`;
}
