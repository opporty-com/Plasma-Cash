const router    = require('router')();

import EntitiesCtrl           from 'controllers/Entities';
import TransactionCtrl        from 'controllers/Transaction';

router.use('/',               EntitiesCtrl);
router.use('/tx',             TransactionCtrl);

exports.router = router;
