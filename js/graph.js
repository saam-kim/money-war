/* Graph geometry uses the live panel width so labels keep their readable size. */
window.MWGraph = {
  render(container, causeCode, reveal) {
    const cause = MWData.causes[causeCode];
    const width = Math.max(230, Math.floor(container.getBoundingClientRect().width));
    const height = typeof window.matchMedia === 'function' && window.matchMedia('(min-width: 1200px) and (max-height: 850px)').matches ? 280 : 340;
    const x0 = 42, x1 = width - 28, y0 = 46, y1 = height - 56;
    const x = v => x0 + v * (x1 - x0), y = v => y0 + v * (y1 - y0);
    const shift = cause.change === 'increase' ? .18 : -.18;
    const dShift = cause.market === 'demand' ? -shift : 0;
    const sShift = cause.market === 'supply' ? shift : 0;
    const line = (type, moved) => {
      const delta = moved ? shift : 0;
      const from = Math.max(.06, .06 + delta), to = Math.min(.94, .94 + delta);
      const value = q => type === 'demand' ? q - delta : 1 - q + delta;
      return `<line x1="${x(from)}" y1="${y(value(from))}" x2="${x(to)}" y2="${y(value(to))}" class="${moved ? 'shifted' : type === cause.market ? 'original original-moving' : 'original'}"/>`;
    };
    const eX = (1 + sShift - dShift) / 2, eY = eX + dShift;
    const curve = cause.market === 'demand' ? 'D' : 'S';
    const labelQ = Math.min(.94, .94 + shift);
    const movedY = cause.market === 'demand' ? labelQ - shift : 1 - labelQ + shift;
    // At a fixed exchange rate, a horizontal shift connects both curves.
    const arrowY = cause.market === 'demand' ? .3 : .75;
    const arrowQ = cause.market === 'demand' ? arrowY : 1 - arrowY;
    const parts = [
      '<title>달러 외환 시장</title>',
      `<text x="4" y="22">환율(원/달러)</text><text x="${width / 2}" y="${height - 6}" text-anchor="middle">달러 거래량</text>`,
      `<path d="M ${x0} ${y0 - 5} V ${y1} H ${x1 + 10}" class="axis"/>`,
      line('demand', false), line('supply', false), line(cause.market, true),
      `<text x="${x(.94)}" y="${y(.94) + 13}" class="curve-label">D</text><text x="${x(.94)}" y="${y(.06)}" class="curve-label">S</text>`,
      `<text x="${x(labelQ) + 4}" y="${y(movedY) + (cause.market === 'demand' ? 13 : -8)}" class="shift-label">${curve}′</text>`,
      `<line x1="${x(arrowQ)}" y1="${y(arrowY)}" x2="${x(arrowQ + shift)}" y2="${y(arrowY)}" class="shifted" marker-end="url(#shift-arrow)"/>`
    ];
    if (reveal >= 3) parts.push(
      `<path d="M ${x0} ${y(.5)} H ${x(.5)} M ${x0} ${y(eY)} H ${x(eX)}" class="guide"/>`,
      `<circle cx="${x(.5)}" cy="${y(.5)}" r="5" class="old-point"/><text x="${x(.5) - 25}" y="${y(.5) + 25}">E₀</text>`,
      `<circle cx="${x(eX)}" cy="${y(eY)}" r="5" class="new-point"/><text x="${x(eX) + 7}" y="${y(eY) - 7}" class="shift-label">E₁</text>`,
      `<line x1="${x0 - 16}" y1="${y(.5)}" x2="${x0 - 16}" y2="${y(eY)}" class="shifted rate-direction" marker-end="url(#shift-arrow)"/>`
    );
    const text = `${cause.label}. ${curve}에서 ${curve}′로 ${cause.change === 'increase' ? '오른쪽' : '왼쪽'} 이동합니다.${reveal >= 3 ? ' 원/달러 환율은 ' + (cause.rate === 'up' ? '상승' : '하락') + '합니다.' : ''}`;
    container.innerHTML = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${text}"><defs><marker id="shift-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" class="arrow-head"/></marker></defs>${parts.join('')}</svg><p class="chart-note">D 수요 · S 공급 · 점선: 이동 전 · D′·S′: 이동 후</p>`;
  }
};
