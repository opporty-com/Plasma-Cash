FROM ubuntu:xenial

ENV DEBIAN_FRONTEND noninteractive

#RUN mkdir -p /root/geth_ipc && \
#    mkdir -p /root/.ethereum && \
#    ln -s /root/.ethereum/geth.ipc /root/geth_ipc/geth.ipc

RUN apt-get update && \
    apt-get -y -qq upgrade && \
    apt-get -y -qq install software-properties-common && \
    add-apt-repository ppa:ethereum/ethereum && \
    apt-get update && \
    apt-get -y -qq install geth solc ntp && \
    apt-get autoremove -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY bin/* /root/

RUN chmod +x /root/*.sh
EXPOSE 30303 30303/udp
ENTRYPOINT ["geth"]
