/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-10
 * moonion.com;
 */

import apiServer from './api';
import socketServer from './child-chain/socketServer';
import server from './child-chain'


socketServer(async () => {
  await apiServer()
});
