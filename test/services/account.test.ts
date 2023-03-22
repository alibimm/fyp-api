import assert from 'assert';
import app from '../../src/app';

describe('\'account\' service', () => {
  it('registered the service', () => {
    const service = app.service('account');

    assert.ok(service, 'Registered the service');
  });
});
