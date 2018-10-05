import util from 'util'

const strRandom = () => {
  let result = ''
  let words = '0123456789qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM'
  let maxPosition = words.length - 1
  for (let i = 0; i < 10; ++i ) {
    let position = Math.floor( Math.random() * maxPosition)
    result = result + words.substring(position, position + 1)
  }
  return result
}

const parseMulti = (req, cb) => {
  let body = []
  req.on('data', (chunk) => {
    body.push(chunk)
  }).on('end', () => {
    let bodys = Buffer.concat(body).toString()
    if (bodys.length > 0) {
      try {
        req.body = JSON.parse(bodys)
      } catch (e) {
        req.body = ''
      }
    }
    return cb()
  })
}
let parseM = util.promisify(parseMulti)

export {parseM, strRandom}
