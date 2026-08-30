export function getDashboardStyles(): string {
    return /* css */`
  *, *::before, *::after {
    box-sizing: border-box;
  }
  body {
    font-family: var(--vscode-font-family);
    font-size: 12px;
    color: var(--vscode-foreground);
    background: var(--vscode-sideBar-background);
    padding: 0 8px 16px;
    line-height: 1.4;
    overflow-x: hidden;
  }

  /* Top Scope Bar */
  .top-scope-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    padding: 6px 2px 8px;
    margin-bottom: 6px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  }

  /* Hero Header */
  .hero-header {
    padding: 2px 2px 10px;
    margin-bottom: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  }
  .hero-top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2px;
    gap: 8px;
  }
  .hero-top-left {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }
  .hero-top-right {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }
  .hero-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .07em;
    text-transform: uppercase;
    color: var(--vscode-descriptionForeground);
    opacity: .75;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }
  .streak-pill {
    font-size: 10px;
    font-weight: 600;
    color: #e5a93c;
    cursor: default;
    display: inline-flex;
    align-items: center;
    gap: 3.5px;
    flex-shrink: 0;
  }
  .streak-flame-icon {
    flex-shrink: 0;
    width: 12px;
    height: 12px;
  }
  .goal-top-badge {
    font-size: 10px;
    font-weight: 500;
    color: var(--vscode-descriptionForeground);
    opacity: .7;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    transition: opacity .15s ease, color .15s ease;
    user-select: none;
  }
  .goal-top-badge:hover {
    opacity: 1;
    color: var(--vscode-textLink-foreground, #3794ff);
    text-decoration: underline;
  }
  .goal-top-badge.achieved {
    color: #4caf50;
    opacity: 1;
    font-weight: 600;
  }
  .hero-time {
    font-size: 24px;
    font-weight: 700;
    letter-spacing: -.02em;
    line-height: 1.15;
    color: var(--vscode-foreground);
    margin: 3px 0 5px;
    font-variant-numeric: tabular-nums;
  }
  .hero-status-line {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 10px;
    color: var(--vscode-descriptionForeground);
    margin-bottom: 6px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    opacity: .75;
  }
  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .status-dot.active {
    background: #4caf50;
  }
  .status-dot.idle {
    background: #777777;
    opacity: .7;
  }
  .status-file {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .status-file svg {
    opacity: .8;
    flex-shrink: 0;
  }
  .hero-status-sep {
    opacity: .35;
    margin: 0 1.5px;
    user-select: none;
  }
  .hero-fourweeks-meta {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex-wrap: wrap;
    row-gap: 2px;
    column-gap: 6px;
    font-size: 10px;
    line-height: 1.4;
    color: var(--vscode-descriptionForeground);
    margin-bottom: 6px;
    opacity: .75;
    user-select: none;
  }
  .hero-fourweeks-meta > span:not(.hero-fourweeks-meta-sep) {
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
    gap: 2.5px;
  }
  .hero-fourweeks-meta-val {
    color: var(--vscode-foreground);
    font-weight: 500;
    opacity: .85;
  }
  .hero-fourweeks-meta-sep {
    opacity: .3;
    user-select: none;
  }
  .curr-filename {
    color: var(--vscode-descriptionForeground);
    font-weight: 400;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    opacity: .85;
    transition: opacity .15s ease, color .15s ease;
  }
  .curr-filename:hover {
    color: var(--vscode-foreground);
    opacity: 1;
  }

  /* Daily Goal Progress */
  .goal-track {
    height: 2px;
    background: rgba(255, 255, 255, 0.07);
    border-radius: 1px;
    overflow: hidden;
    margin-top: 6px;
    cursor: pointer;
  }
  .goal-bar {
    height: 100%;
    background: #3794ff;
    border-radius: 1px;
    transition: width .3s ease;
  }
  .goal-bar.completed {
    background: #4caf50;
  }
  .goal-set-link {
    font-size: 10px;
    font-weight: 500;
    color: var(--vscode-descriptionForeground);
    opacity: .65;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    transition: opacity .15s ease, color .15s ease;
    user-select: none;
  }
  .goal-set-link:hover {
    opacity: 1;
    color: var(--vscode-charts-blue, var(--vscode-textLink-foreground, #79b8ff));
    text-decoration: underline;
  }

  /* 24-Hour Productivity Rhythm */
  .rhythm-wrap {
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px solid rgba(255,255,255,.06);
  }
  .rhythm-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
    font-size: 9.5px;
  }
  .rhythm-title {
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .05em;
    opacity: .5;
  }
  .rhythm-peak {
    color: var(--vscode-descriptionForeground);
    opacity: .75;
    font-weight: 500;
    font-size: 9.5px;
  }
  .rhythm-chart {
    display: grid;
    grid-template-columns: repeat(24, 1fr);
    align-items: end;
    gap: 2px;
    height: 28px;
  }
  .rhythm-bar-col {
    height: 100%;
    display: flex;
    align-items: flex-end;
    cursor: pointer;
  }
  .rhythm-bar {
    width: 100%;
    min-height: 2px;
    border-radius: 1.5px 1.5px 0 0;
    background: rgba(255,255,255,.06);
    transition: height .15s ease, background .15s ease;
  }
  .rhythm-bar.active {
    background: #3794ff;
  }
  .rhythm-bar.active.even {
    background: #3794ff;
  }
  .rhythm-bar.active.odd {
    background: #1e5db5;
  }
  .rhythm-bar-col:hover .rhythm-bar {
    background: #58a6ff;
  }
  .rhythm-bar-col:hover .rhythm-bar.active {
    background: #68b5ff;
    box-shadow: 0 0 5px rgba(55, 148, 255, 0.45);
  }
  .rhythm-time-axis {
    display: flex;
    justify-content: space-between;
    font-size: 8.5px;
    color: var(--vscode-descriptionForeground);
    opacity: .55;
    margin-top: 4px;
    line-height: 1;
  }

  /* Chart Section & Period Dropdown */
  .section { margin-bottom: 8px; }
  .section-title {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .06em;
    text-transform: uppercase;
    opacity: .55;
  }
  .title-meta {
    font-size: 11px;
    font-weight: 500;
    color: var(--vscode-descriptionForeground);
    opacity: .85;
    letter-spacing: normal;
    text-transform: none;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .period-dropdown {
    background: rgba(255,255,255,.03);
    border: 1px solid rgba(255,255,255,.08);
    color: var(--vscode-foreground);
    font-family: inherit;
    font-size: 11px;
    font-weight: 500;
    padding: 2.5px 6px;
    border-radius: 4px;
    cursor: pointer;
    outline: none;
    transition: background .15s, border-color .15s;
    width: auto;
    max-width: 185px;
    min-width: 0;
    flex-shrink: 1;
  }
  .period-dropdown:hover,
  .period-dropdown:focus {
    background: rgba(255,255,255,.07);
    border-color: rgba(255,255,255,.15);
    outline: none;
  }
  .period-dropdown option {
    background: var(--vscode-sideBar-background);
    color: var(--vscode-foreground);
  }

  /* Smooth Area Wave Chart */
  .wave-chart-container {
    width: 100%;
    margin-top: 4px;
    margin-bottom: 2px;
    user-select: none;
    position: relative;
  }
  .wave-svg {
    width: 100%;
    height: 56px;
    overflow: visible;
    display: block;
  }
  .wave-crosshair {
    pointer-events: none;
    transition: opacity .15s ease, x1 .15s ease, x2 .15s ease;
  }
  .wave-goal-line {
    pointer-events: stroke;
    transition: y1 .3s ease, y2 .3s ease, opacity .3s ease;
  }
  .wave-line {
    transition: d .3s ease;
    filter: drop-shadow(0 2px 4px rgba(55, 148, 255, 0.35));
  }
  .wave-ghost-line {
    pointer-events: none;
    transition: d .3s ease, opacity .3s ease;
  }
  .wave-area {
    transition: d .3s ease;
  }
  .wave-node {
    cursor: pointer;
  }
  .wave-dot {
    opacity: 0;
    fill: #ffffff;
    stroke: #3794ff;
    stroke-width: 2px;
    cursor: pointer;
    transition: opacity .15s ease, r .15s ease;
  }
  .wave-node.selected .wave-dot {
    opacity: 1;
    fill: #ffffff;
    stroke: #3794ff;
    stroke-width: 2.2px;
    filter: drop-shadow(0 1px 4px rgba(0, 0, 0, 0.7));
  }
  .wave-svg.is-hovering .wave-node.selected .wave-dot {
    opacity: 0;
  }
  .wave-node.hovered .wave-dot {
    opacity: 1 !important;
    fill: #ffffff !important;
    stroke: #58a6ff !important;
    stroke-width: 2.2px !important;
    filter: drop-shadow(0 1px 4px rgba(0, 0, 0, 0.7));
  }
  .wave-labels {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    width: 100%;
    margin-top: 3px;
  }
  .wave-lbl-col {
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    cursor: pointer;
    padding: 2px 0;
    user-select: none;
    transition: opacity .15s ease;
  }
  .wave-lbl {
    font-size: 9.5px;
    font-weight: 500;
    color: var(--vscode-descriptionForeground);
    opacity: .55;
    text-align: center;
    display: block;
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: opacity .15s ease, color .15s ease;
  }
  .wave-lbl-col:hover .wave-lbl,
  .wave-lbl-col.hovered .wave-lbl {
    opacity: .85;
    color: var(--vscode-foreground);
  }
  .wave-lbl-col.selected .wave-lbl {
    opacity: 1;
    font-weight: 500;
    color: var(--vscode-foreground);
  }
  .wave-lbl-col.goal-met .wave-lbl::after {
    content: '';
    display: block;
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: #4caf50;
    margin: 2px auto 0;
  }

  /* Breakdown List (Slim 2-Line) */
  .lang-item {
    padding: 2.5px 5px 3.5px;
    border-radius: 4px;
    margin-bottom: 2px;
    cursor: default;
    transition: background .15s ease;
  }
  .lang-item.clickable {
    cursor: pointer;
  }
  .lang-item:hover {
    background: rgba(255, 255, 255, 0.05);
  }
  .lang-item-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2.5px;
    font-size: 11px;
    line-height: 1.4;
  }
  .lang-item-left {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    flex: 1;
    overflow: hidden;
    padding-bottom: 1px;
  }
  .lang-icon,
  .file-icon-svg {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
  }
  .lang-name {
    font-size: 11px;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding-bottom: 1px;
  }
  .lang-time {
    font-size: 10px;
    opacity: .6;
    color: var(--vscode-foreground);
    white-space: nowrap;
    margin-left: 6px;
    flex-shrink: 0;
  }
  .lang-bar-wrap {
    width: 100%;
    height: 2px;
    border-radius: 1px;
    background: rgba(255, 255, 255, 0.07);
    overflow: hidden;
  }
  .lang-bar {
    height: 100%;
    border-radius: 1px;
    transition: width .3s ease;
  }

  /* Empty state */
  .empty {
    text-align: center;
    padding: 16px 8px;
    opacity: .45;
    font-size: 11px;
    line-height: 1.8;
  }

  /* Divider */
  .divider {
    height: 1px;
    background: rgba(255,255,255,.07);
    margin: 10px 0;
  }

  /* Quick Search Input */
  .quick-search-input {
    width: 100%;
    box-sizing: border-box;
    padding: 4px 8px;
    font-size: 11px;
    font-family: var(--vscode-font-family);
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.03);
    color: var(--vscode-foreground);
    outline: none;
    box-shadow: none;
    transition: border-color .15s ease;
  }
  .quick-search-input:focus {
    border-color: rgba(255, 255, 255, 0.16);
    background: rgba(255, 255, 255, 0.03);
    outline: none;
    box-shadow: none;
  }

  /* Toolbar */
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
    margin-bottom: 2px;
  }
  .btn {
    flex: 1;
    min-width: 70px;
    padding: 5px 8px;
    font-size: 11px;
    font-weight: 500;
    font-family: var(--vscode-font-family);
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
    color: var(--vscode-foreground);
    cursor: pointer;
    transition: background .15s ease, border-color .15s ease;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .btn:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.16);
  }
  .btn.danger {
    background: transparent;
    border: 1px solid rgba(239, 83, 80, 0.28);
    color: #ef5350;
  }
  .btn.danger:hover {
    background: rgba(239, 83, 80, 0.1);
    border-color: rgba(239, 83, 80, 0.45);
  }

  .more-btn {
    width: 100%;
    background: none;
    border: none;
    color: var(--vscode-charts-blue, var(--vscode-textLink-foreground, #58a6ff));
    font-family: inherit;
    font-size: 11px;
    font-weight: 500;
    padding: 3px 0;
    margin-top: 3px;
    cursor: pointer;
    text-align: center;
    opacity: .85;
    transition: opacity .15s ease, color .15s ease;
    user-select: none;
  }
  .more-btn:hover {
    opacity: 1;
    color: var(--vscode-charts-blue, var(--vscode-textLink-foreground, #79b8ff));
    text-decoration: underline;
  }
`;
}
