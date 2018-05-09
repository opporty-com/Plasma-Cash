
// import Promise from 'bluebird';
import fs from 'fs';

/**
 * Create directory if not exists
 * @param directory
 */
exports.mkdirSyncRecursive = function(directory) {
  if (!fs.existsSync(directory)) {
    let path = directory.replace(/\/$/, '').split('/');
    for (let i = 1; i <= path.length; i++) {
      let segment = path.slice(0, i).join('/');
      if (segment.length > 10 && !fs.existsSync(segment)) {
        fs.mkdirSync(segment);
      }
    }
  }
};
