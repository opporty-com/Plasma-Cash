import util from 'util';

function parseMulti(req, cb) {
  let body = [];
  req.on('data', (chunk) => {
    body.push(chunk);
  }).on('end', () => {
    let bodys = Buffer.concat(body).toString();
    if (bodys.length > 0) {
      try {
        req.body = JSON.parse(bodys);
      } catch (e) {
        req.body = '';
      }
    }
    return cb();
  });
}
let parseM = util.promisify(parseMulti); 

export { parseM };