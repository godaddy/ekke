import nock from 'nock';

const example = nock('http://example.com');

example.persist().get('/foo').reply(200, 'this is a reply');
example.persist().get('/404').reply(404, 'Missing');
example.persist().get('/500').reply(500, 'Error');

example
  .persist()
  .get('/error')
  .replyWithError('All the pipes broke');

example
  .persist()
  .get('/timeout')
  .reply(200, (uri, body, fn) => {
    setTimeout(fn.bind(fn, null, [200, 'Done']), 2000);
  });
