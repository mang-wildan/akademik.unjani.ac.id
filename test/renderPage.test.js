const test = require('node:test');
const assert = require('node:assert/strict');
const renderPage = require('../middleware/renderPage');

const response = (query = {}, error) => {
  const res = {
    calls: [], headers: {}, statusCode: 200, errors: [],
    set(name, value) { this.headers[name] = value; return this; },
    render(view, locals, callback) {
      this.calls.push({ view, locals });
      if (callback) callback(error, '<form>Content</form>');
      return this;
    },
  };
  let nextCalls = 0;
  renderPage({ query }, res, err => {
    nextCalls += 1;
    if (err) res.errors.push(err);
  });
  assert.equal(nextCalls, 1);
  return res;
};

test('full pages keep the default or explicit layout and locals', () => {
  for (const partial of [undefined, '0', 'true', 1, ['1'], { value: '1' }]) {
    const res = response({ partial });
    res.renderPage('form');
    assert.deepEqual(res.calls, [
      { view: 'form', locals: {} },
      { view: 'layouts/public', locals: { body: '<form>Content</form>' } },
    ]);
    assert.equal(res.headers['Cache-Control'], undefined);
  }
  const res = response();
  res.renderPage('form', { title: 'Edit' }, 'layouts/admin-v2');
  assert.deepEqual(res.calls[1], {
    view: 'layouts/admin-v2', locals: { title: 'Edit', body: '<form>Content</form>' },
  });
});

test('partial pages render only the view, disable caching and preserve status and locals', () => {
  for (const status of [200, 422]) {
    const res = response({ partial: '1' });
    res.statusCode = status;
    res.set('Cache-Control', 'public, max-age=3600');
    const locals = { errors: { title: 'Required' }, partial: false };
    res.renderPage('form', locals, 'layouts/admin-v2');
    assert.deepEqual(res.calls, [{ view: 'form', locals: { ...locals, partial: true } }]);
    assert.equal(res.statusCode, status);
    assert.equal(res.headers['Cache-Control'], 'no-store');
    assert.equal(locals.partial, false);
  }
});

test('view errors are forwarded without rendering a layout', () => {
  const error = new Error('render failed');
  const res = response({}, error);
  res.renderPage('form');
  assert.equal(res.calls.length, 1);
  assert.deepEqual(res.errors, [error]);
});
