import { formatTime } from '../utils/time';
import { escHtml } from '../constants/icons';
import { DashboardHtmlParams } from '../types/dashboard';
import { getDashboardStyles } from './dashboardStyles';
import { getDashboardScript } from './dashboardScript';


export function getDashboardHtml(p: DashboardHtmlParams): string {
    const styles = getDashboardStyles();
    const script = getDashboardScript(
        JSON.stringify(p.weekData),
        JSON.stringify(p.fourWeeksData),
        JSON.stringify(p.fourWeeksAgg),
        p.active,
        p.todaySec,
        p.idleSec,
        p.dailyGoalSeconds,
        p.initialItemsLimit,
        p.maxExpandedItems
    );

    return /* html */`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chronix</title>
    <style>
${styles}
    </style>
  </head>
  <body>
    <!-- Top Scope Bar -->
    <div class="top-scope-bar" id="topScopeBar">
      <select id="periodDropdown" class="period-dropdown" onchange="selectPeriod(this.value)">
        <option value="thisweek" title="${escHtml(p.fourWeeksData[0].dateRange)}">This Week</option>
        <option value="week1" title="${escHtml(p.fourWeeksData[1].dateRange)}">Last Week</option>
        <option value="week2" title="${escHtml(p.fourWeeksData[2].dateRange)}">2 Weeks Ago</option>
        <option value="week3" title="${escHtml(p.fourWeeksData[3].dateRange)}">3 Weeks Ago</option>
        <option value="fourweeks" title="${escHtml(p.fourWeeksAgg.dateRange)}">Last 4 Weeks</option>
      </select>
      <span class="title-meta" id="chartMeta">${escHtml(formatTime(p.weekTotalSec))} total</span>
    </div>

    <!-- Hero Header -->
    <div class="hero-header" id="heroHeader">
      <div class="hero-top-row">
        <div class="hero-top-left">
          <span class="hero-label" id="heroLabel" title="${escHtml(p.weekData[6]?.fullLabel || 'Today')}">Today</span>
          ${p.streak > 0 ? `<span class="streak-pill" id="heroStreak" title="${p.streak}d streak"><svg class="streak-flame-icon" viewBox="0 0 24 24" width="12" height="12" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg><span>${p.streak}d streak</span></span>` : '<span id="heroStreak" style="display:none"></span>'}
        </div>
        <div class="hero-top-right" id="goalTopWrap">
          ${p.dailyGoalSeconds > 0 ? `
          <span class="goal-top-badge ${p.goalDone ? 'achieved' : ''}" id="goalTopBadge" onclick="msg('setGoal')" title="Daily Goal: ${escHtml(formatTime(p.dailyGoalSeconds))} (${p.goalPct}%) · Click to edit">
            <span>${p.goalDone ? 'Goal Met' : `Goal: ${p.goalPct}%`}</span>
          </span>` : `
          <span class="goal-set-link" id="goalTopBadge" onclick="msg('setGoal')" title="Set daily goal">
            + Set Goal
          </span>`}
        </div>
      </div>
      <div class="hero-time" id="heroTime">${escHtml(formatTime(Math.max(p.todaySec, 0)))}</div>
      <div class="hero-status-line" id="heroStatusLine">
        <span class="status-dot ${p.active ? 'active' : 'idle'}"></span>
        ${p.active ? (p.curFileName ? `
        <span class="status-file">
          <span style="opacity:0.65">Editing:</span>
          ${p.curFileIconSvg}
          <span class="curr-filename" title="${escHtml(p.curFile)}">${escHtml(p.curFileName)}</span>
        </span>` : `<span>Active</span>`) : `<span id="heroIdleWrap">Idle <span class="hero-status-sep">·</span> <span id="heroIdleCount">${escHtml(formatTime(p.idleSec))}</span></span>`}
      </div>
      <div class="hero-fourweeks-meta" id="heroFourWeeksMeta" style="display:none">
        <span title="Daily average: ${escHtml(formatTime(p.fourWeeksAgg.avgSecondsPerDay))}/d">Avg <strong class="hero-fourweeks-meta-val">${escHtml(formatTime(p.fourWeeksAgg.avgSecondsPerDay))}/d</strong></span>
        <span class="hero-fourweeks-meta-sep">·</span>
        <span title="${p.fourWeeksAgg.peakDay ? escHtml('Peak day: ' + p.fourWeeksAgg.peakDay.label + ' (' + formatTime(p.fourWeeksAgg.peakDay.seconds) + ')') : 'No data'}">Peak <strong class="hero-fourweeks-meta-val">${p.fourWeeksAgg.peakDay ? escHtml(formatTime(p.fourWeeksAgg.peakDay.seconds)) : '-'}</strong></span>
        <span class="hero-fourweeks-meta-sep">·</span>
        <span title="Longest streak: ${p.fourWeeksAgg.maxStreak} consecutive day${p.fourWeeksAgg.maxStreak === 1 ? '' : 's'}">Streak <strong class="hero-fourweeks-meta-val">${p.fourWeeksAgg.maxStreak}d</strong></span>
      </div>
      ${p.dailyGoalSeconds > 0 ? `
      <div class="goal-track" id="goalTrack" onclick="msg('setGoal')" title="Daily Goal: ${escHtml(formatTime(p.dailyGoalSeconds))} (${p.goalPct}%) · Click to edit">
        <div class="goal-bar ${p.goalDone ? 'completed' : ''}" style="width:${p.goalPct}%"></div>
      </div>` : '<div id="goalTrack" style="display:none"></div>'}
    </div>

    <!-- Wave Chart Section -->
    <div class="section" id="waveChartSection" style="margin-bottom: 8px;">
      <div class="wave-chart-container" id="waveChartWrap">
        <svg class="wave-svg" id="waveSvg" viewBox="0 0 280 60" preserveAspectRatio="none">
          <defs>
            <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#3794ff" stop-opacity="0.38" />
              <stop offset="55%" stop-color="#3794ff" stop-opacity="0.08" />
              <stop offset="100%" stop-color="#3794ff" stop-opacity="0.00" />
            </linearGradient>
          </defs>
          <!-- Baseline track -->
          <line x1="8" y1="52" x2="272" y2="52" stroke="rgba(255,255,255,.07)" stroke-width="1" stroke-dasharray="2 3" />
          
          <!-- Day vertical grid lines -->
          <g id="waveGridLines">
            ${p.waveXs.map(x => `<line x1="${x}" y1="8" x2="${x}" y2="52" stroke="rgba(255,255,255,.08)" stroke-width="1" />`).join('')}
          </g>
          
          <!-- Goal horizontal dashed reference line -->
          <line id="waveGoalLine" class="wave-goal-line" x1="12" y1="52" x2="268" y2="52" stroke="rgba(76, 175, 80, 0.45)" stroke-width="1" stroke-dasharray="2 3" opacity="0" />

          <!-- Vertical guideline / crosshair -->
          <line id="waveCrosshair" class="wave-crosshair" x1="260" y1="4" x2="260" y2="52" stroke="#3794ff" stroke-width="1" stroke-dasharray="2 2" opacity="0.4" />
          
          <!-- Previous period ghost comparison curve -->
          <path id="waveGhostPath" class="wave-ghost-line" d="${p.initialGhostLineD}" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.25" stroke-dasharray="2.5 3" stroke-linecap="round" />
          
          <!-- Area gradient fill -->
          <path id="waveAreaPath" class="wave-area" d="${p.initialAreaD}" fill="url(#waveGradient)" />
          
          <!-- Smooth curve line -->
          <path id="waveLinePath" class="wave-line" d="${p.initialLineD}" fill="none" stroke="#3794ff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
          
          <!-- Interactive Data Dots -->
          ${p.initialPoints.map((pt, i) => `
            <g class="wave-node ${i === 6 ? 'selected' : ''}" id="waveNode_${i}" onclick="selectDay(${i})" onmouseenter="onHoverDay(${i})" onmouseleave="onLeaveDay()" data-idx="${i}" title="${p.weekData[i].formattedTotal} · ${escHtml(p.weekData[i].fullLabel || p.weekData[i].date)}">
              <title>${p.weekData[i].formattedTotal} · ${escHtml(p.weekData[i].fullLabel || p.weekData[i].date)}</title>
              <rect x="${pt.x - 20}" y="0" width="40" height="60" fill="transparent" cursor="pointer" />
              <circle class="wave-dot" id="waveDot_${i}" cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="${i === 6 ? '4' : '2.5'}" />
            </g>
          `).join('')}
        </svg>
        <div class="wave-labels" id="waveLabelsWrap">
          ${p.weekData.map((d, i) => `
            <div class="wave-lbl-col ${i === 6 ? 'selected' : ''}" id="waveLbl_${i}" onclick="selectDay(${i})" onmouseenter="onHoverDay(${i})" onmouseleave="onLeaveDay()" title="${d.formattedTotal} · ${escHtml(d.fullLabel || d.date)}">
              <span class="wave-lbl">${escHtml(d.label)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Hourly Activity Rhythm -->
    <div class="section">
      <div class="rhythm-wrap" id="rhythmWrap">
        <div class="rhythm-header">
          <span class="rhythm-title">Hourly Activity</span>
          <span class="rhythm-peak" id="rhythmPeak">Peak: ${escHtml(p.todayHourly.peakHour)}</span>
        </div>
        <div class="rhythm-chart" id="rhythmBars">
          ${p.todayHourly.hourly.map((sec: number, h: number) => {
            const hourStr = String(h).padStart(2, '0') + ':00';
            const isPeak = p.todayHourly.peakHour.startsWith(hourStr) && sec > 0;
            const title = `${hourStr} · ${formatTime(sec)}${isPeak ? ' (Peak)' : ''}`;
            const pct = p.todayHourly.maxHourSec > 0 ? Math.round((sec / p.todayHourly.maxHourSec) * 100) : 0;
            const barHeight = sec > 0 ? Math.max(pct, 12) : 6;
            const isEven = (h % 2 === 0);
            const activeClass = sec > 0 ? ` active ${isEven ? 'even' : 'odd'}` : '';
            return `<div class="rhythm-bar-col" title="${escHtml(title)}"><div class="rhythm-bar${activeClass}" style="height:${barHeight}%"></div></div>`;
          }).join('')}
        </div>
        <div class="rhythm-time-axis">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>23:00</span>
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <!-- Quick Search Bar -->
    <div style="margin: 6px 0">
      <input type="text" id="quickSearchInput" class="quick-search-input" placeholder="Search all files, languages, projects..." oninput="onQuickSearch(this.value)">
    </div>

    <!-- Files -->
    <div class="section">
      <div class="section-title" id="filesTitle">Files</div>
      <div id="filesList"></div>
    </div>

    <div class="divider"></div>

    <!-- Languages -->
    <div class="section">
      <div class="section-title" id="langsTitle">Languages</div>
      <div id="langsList"></div>
    </div>

    <div class="divider"></div>

    <!-- Projects -->
    <div class="section">
      <div class="section-title" id="projectsTitle">Projects</div>
      <div id="projectsList"></div>
    </div>

    <div class="divider"></div>

    <!-- Toolbar -->
    <div class="toolbar">
      <button class="btn" onclick="triggerExport()" title="Export coding report (Markdown, CSV)">Export</button>
      <button class="btn" onclick="msg('openStorage')" title="Open raw storage JSON">Storage</button>
      <button class="btn danger" onclick="msg('clearData')" title="Delete all tracked data">Clear</button>
    </div>

    <script>
${script}
    </script>
  </body>
</html>`;
}
