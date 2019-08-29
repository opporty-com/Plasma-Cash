import config from "../config"
import net from 'net'

const promiseFromEvent = data => new Promise( ( resolve, reject ) => {
  const client = net.createConnection( config.socketPath, ()=> {
    client.write( JSON.stringify( data ) )
  });

  client.on("data", result => {
    const res =  JSON.parse(result),
          { error } = res

    if ( error ) reject( error )

    resolve( res )
  });

})

export { promiseFromEvent }
