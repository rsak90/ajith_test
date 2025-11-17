/**
 * @jest-environment jsdom
 */
const path = require('path');
const $ = require('jquery');

const { extractInlineScriptsFromCshtml, sanitizeRazorMarkers } = require('./utils');

describe('Inline SortSet script (loaded from cshtml)', () => {
  // Update this path if your view is elsewhere
  const viewPath = path.resolve(__dirname, '../../ARP.Workbench.Web/Views/SortSet/SortSet.cshtml');

  beforeEach(() => {
    // prepare DOM element expected by script
    document.body.innerHTML = '<div id="actualdataGridload"></div>';

    // Provide a global Common.Ajax stub used by many legacy apps
    global.Common = {
      Ajax: jest.fn((method, url, param, dataType, callback) => {
        // emulate async ajax, call callback with fake data
        setTimeout(() => {
          callback([
            { sortingsetname: 'S1', notes: 'n1', studyid: 'st1' },
            { sortingsetname: 'S2', notes: 'n2', studyid: 'st2' }
          ]);
        }, 0);
      })
    };

    // Mock DevExtreme dxDataGrid (attach to jQuery prototype)
    $.fn.dxDataGrid = jest.fn(function (opts) {
      // store options on element for assertions
      $(this).data('dxDataGridOptions', opts);
      return this;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
    delete global.Common;
  });

  test('evaluates inline script and loadSponsorValues initializes dxDataGrid', async () => {
    const scripts = extractInlineScriptsFromCshtml(viewPath);
    expect(scripts.length).toBeGreaterThan(0);

    // pick script that contains loadSponsorValues (best-effort)
    const targetScript = scripts.find(s => s.includes('loadSponsorValues')) || scripts[0];

    const sanitized = sanitizeRazorMarkers(targetScript);

    // Evaluate script in global scope
    const scriptRunner = new Function(sanitized);
    scriptRunner(); // defines functions from the inline script, e.g. loadSponsorValues

    // find the function defined by the inline script
    const caller = (typeof loadSponsorValues === 'function') ? loadSponsorValues : (typeof window !== 'undefined' && typeof window.loadSponsorValues === 'function' ? window.loadSponsorValues : global.loadSponsorValues);

    expect(typeof caller).toBe('function');

    // Call it — it should call Common.Ajax and then init dxDataGrid
    caller('selected123');

    // wait for the mocked async callback
    await new Promise(r => setTimeout(r, 20));

    expect(global.Common.Ajax).toHaveBeenCalled();

    const $grid = $('#actualdataGridload');
    expect($.fn.dxDataGrid).toHaveBeenCalled();
    const opts = $grid.data('dxDataGridOptions');
    expect(opts).toBeDefined();
    expect(Array.isArray(opts.dataSource)).toBe(true);
    expect(opts.sorting && opts.sorting.mode).toBe('multiple');
  }, 30000);
});
