counter = 0

request = function()
   wrk.headers["test"] = counter
   counter = counter + 1
   return wrk.format(wrk.method,nil,wrk.headers,wrk.body)
end

function done(summary, latency, requests)
  os.execute('clear');
  io.write("------------------------------------------\n");
  io.write( string.format("Latency min:   %.2f,\n", latency.min));
  io.write( string.format("Latency max:   %.2f,\n", latency.max));
  io.write( string.format("Latency mean:  %.2f,\n", latency.mean));
  io.write( string.format("Latency stdev: %.2f,\n", latency.stdev));
  io.write(string.format("Errors 400:    %d\n", summary.errors.status))
  io.write(string.format("Err Timeouts:  %d\n", summary.errors.timeout))
  io.write(string.format("Duration:      %d,\n", summary.duration))
  io.write(string.format("Bytes:         %d,\n", summary.bytes))
  io.write(string.format("Requests/sec:  %0.2f,\n", (summary.requests/summary.duration)*1e6))
  io.write(string.format("Transfer/sec:  %0.2f kB,\n", (summary.bytes/summary.duration/1024)*1e6))
  io.write("------------------------------------------\n");
end
