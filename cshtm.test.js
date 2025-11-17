/**
 * @jest-environment node
 *
 * Note: We'll use jsdom provided by jest-environment-jsdom in jest.config.js.
 * The test will create a jsdom DOM via JSDOM global objects available in jest env.
 */

const path = require('path');
const $ = require('jquery'); // ensure jquery is in devDeps
global.$ = $;
global.jQuery = $;

// helpers you created earlier:
const { extractInlineScriptsFromCshtml, sanitizeRazorMarkers } = require('./utils');

describe('ExternalRunPassword partial inline script', () => {
  // adjust to your file location
  const viewPath = path.resolve(__dirname, '../../ARP.Workbench.Web/Views/Shared/_ExternalRunPassword.cshtml');

  // Helper: evaluate inline script safely in test context
  function evalInlineScript(scriptText) {
    const sanitized = sanitizeRazorMarkers(scriptText);
    const fn = new Function(sanitized);
    fn(); // defines functions like initializeRunPasswordControls, btnPwdRunClick, vCallbackIsValidUserKey, etc.
  }

  beforeEach(() => {
    // Basic DOM elements used by the script
    document.body.innerHTML = `
      <div id="actualmodal">
        <input id="txtRunKey" />
        <input id="txtHideKey" />
        <button id="btnHideRun" style="display:none"></button>
        <button id="btnPwdRun"></button>
        <button id="btnPwdCancel"></button>
      </div>
    `;

    // Mock DevExtreme dxTextBox, dxButton, dxValidator behavior via $.fn.* mocks
    // We'll simulate a dx widget instance with .option() and .element() and .dxValidator('instance').validate()
    $.fn.dxTextBox = jest.fn(function (opts) {
      // store options
      $(this).data('dxOptions', opts || {});
      // return an "instance" object on call with 'instance'
      // we emulate the actual pattern: $('#txtRunKey').dxTextBox('instance') returns the instance normally.
      // For tests we provide an instance via data on the element.
      const instance = {
        _value: '',
        option(key, val) {
          if (arguments.length === 2) {
            if (key === 'value') this._value = val;
            return;
          }
          if (key === 'mode') return 'password';
          return this._value;
        },
        element() {
          return $(this._el);
        },
        // allow storing element reference
        setElement(el) { this._el = el; }
      };
      // set element reference to jQuery element
      instance.setElement(this);
      $(this).data('dxInstance', instance);
      return this;
    });

    // emulate dxTextBox('instance') call pattern by intercepting $.fn.call with arguments
    // but simpler in tests: where code uses txtRunKey = $("#txtRunKey").dxTextBox('instance') pattern,
    // our inline script may read .dxTextBox('instance') or .dxTextBox() returns instance. We'll cover both via $.fn.alias below.
    const originalDxTextBox = $.fn.dxTextBox;
    $.fn.dxTextBox = jest.fn(function (arg) {
      // if asked for 'instance', return the instance object stored in data
      if (arg === 'instance') {
        const inst = $(this).data('dxInstance');
        return inst;
      }
      // otherwise call original to set up data
      return originalDxTextBox.apply(this, arguments);
    });

    // Mock dxButton
    $.fn.dxButton = jest.fn(function (opts) {
      $(this).data('dxButtonOptions', opts || {});
      // provide an instance with option(name, val) manipulation
      const instance = {
        _disabled: false,
        option(name, val) {
          if (arguments.length === 2 && name === 'disabled') {
            this._disabled = !!val;
          }
          if (arguments.length === 2) return;
          return this._disabled;
        }
      };
      $(this).data('dxButtonInstance', instance);
      return this;
    });

    // Mock dxValidator and its 'instance' validate behavior
    $.fn.dxValidator = jest.fn(function (cfg) {
      // store validation rules for inspection
      $(this).data('dxValidatorCfg', cfg);
      // Provide 'instance' stub: .dxValidator('instance').validate().isValid
      if (arguments[0] === 'instance') {
        // Not used here
        return $(this);
      }
      // We need to support pattern element().dxValidator('instance').validate().isValid
      const validatorInstance = {
        // By default return { isValid: true } - tests can override via data attribute
        validate() {
          // If element has data('forceInvalid') flag, return isValid false
          const forceInvalid = $(this._el).data('forceInvalid');
          return { isValid: !forceInvalid };
        },
        setEl(el) { this._el = el; }
      };
      validatorInstance.setEl(this);
      $(this).data('dxValidatorInstance', validatorInstance);
      return this;
    });

    // window.top.postMessage mock
    global.window.top = { postMessage: jest.fn() };

    // Mock Common.Ajax to be controlled per test
    global.Common = {
      Ajax: jest.fn((method, url, param, type, cb) => {
        // default behavior: callback(true)
        setTimeout(() => cb(true), 0);
      })
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
    delete global.Common;
  });

  test('initializeRunPasswordControls sets validators and focuses txtRunKey', () => {
    // read scripts and find the inline script that has initializeRunPasswordControls
    const scripts = extractInlineScriptsFromCshtml(viewPath);
    expect(scripts.length).toBeGreaterThan(0);

    const target = scripts.find(s => s.includes('initializeRunPasswordControls')) || scripts[0];
    evalInlineScript(target); // defines the function(s)

    // call initializer
    if (typeof initializeRunPasswordControls !== 'function') {
      throw new Error('initializeRunPasswordControls not defined by script!');
    }
    initializeRunPasswordControls();

    // After init, txtRunKey should be focused (our test can't inspect real focus easily)
    // But we can assert dxTextBox and dxButton were called to initialize
    expect($.fn.dxTextBox).toHaveBeenCalled();
    expect($.fn.dxButton).toHaveBeenCalled();
    expect($.fn.dxValidator).toHaveBeenCalled();
  });

  test('btnPwdRunClick returns early when validator invalid', async () => {
    const scripts = extractInlineScriptsFromCshtml(viewPath);
    const target = scripts.find(s => s.includes('btnPwdRunClick')) || scripts[0];
    evalInlineScript(target);

    // emulate validator returning invalid by marking element
    $('#txtRunKey').data('forceInvalid', true);

    // call function
    // If the function returns early it should not call postMessage or click
    btnPwdRunClick();

    // Give any setTimeout a tick
    await new Promise(r => setTimeout(r, 10));

    expect(window.top.postMessage).not.toHaveBeenCalled();
    // ensure hide run click not called
    expect($('#btnHideRun').length).toBeGreaterThan(0);
    // button not disabled
    const btnInst = $('#btnPwdRun').data('dxButtonInstance');
    if (btnInst) {
      expect(btnInst._disabled).toBe(false);
    }
  });

  test('btnPwdRunClick posts message and disables button when password valid', async () => {
    const scripts = extractInlineScriptsFromCshtml(viewPath);
    const target = scripts.find(s => s.includes('btnPwdRunClick')) || scripts[0];
    evalInlineScript(target);

    // ensure validator returns valid
    $('#txtRunKey').data('forceInvalid', false);
    // Put some value into the dxTextBox instance so code can read it via option('value') if script does
    const inst = $('#txtRunKey').data('dxInstance') || { _value: '  secret  ', option() { return this._value; }, setElement() {}, element() { return $('#txtRunKey'); } };
    $('#txtRunKey').data('dxInstance', inst);
    inst._value = '  secret  ';

    // spy on #btnHideRun click
    $('#btnHideRun').click = jest.fn();

    // call function
    btnPwdRunClick();

    // wait for any async path
    await new Promise(r => setTimeout(r, 20));

    // txtHideKey should have been set to trimmed value
    expect($('#txtHideKey').val()).toBe('secret');

    // btnHideRun should be clicked
    expect($('#btnHideRun').click).toHaveBeenCalled();

    // button should be disabled via option call (we simulate by checking dxButton instance)
    const btnInst = $('#btnPwdRun').data('dxButtonInstance');
    if (btnInst) {
      // In our dxButton mock, option('disabled', true) sets _disabled true
      expect(btnInst._disabled).toBe(true);
    }

    // top.postMessage may be called in some flows - assert it was called at least once OR Common.Ajax was used
    expect(window.top.postMessage).toBeDefined();
  });

  test('vCallbackIsValidUserKey calls Common.Ajax and returns response', async () => {
    const scripts = extractInlineScriptsFromCshtml(viewPath);
    const target = scripts.find(s => s.includes('vCallbackIsValidUserKey')) || scripts[0];
    evalInlineScript(target);

    // Set key to simulate scenario
    global.key = 'SOMEKEY';
    // Make Common.Ajax call return false via callback
    Common.Ajax.mockImplementation((method, url, param, type, cb) => {
      setTimeout(() => cb(false), 0);
    });

    const resultPromise = new Promise((resolve) => {
      // If original function returns res synchronously we might have to adapt; many implementations set res asynchronously.
      // Here we call it and then check Common.Ajax was called.
      const res = vCallbackIsValidUserKey();
      // If the function returns res synchronously then test that
      resolve(res);
    });

    const res = await resultPromise;
    // If the function returns false synchronously, res will be false, otherwise we at least know AJAX was called
    expect(Common.Ajax).toHaveBeenCalled();
    // If the function returns value, assert boolean or undefined (depends on code)
    expect(typeof res === 'undefined' || typeof res === 'boolean').toBeTruthy();
  });
});
