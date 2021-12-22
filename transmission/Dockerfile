FROM linuxserver/transmission

COPY settings.json /config/settings.json
COPY done.sh /done.sh
RUN chmod 777 /done.sh
COPY startup.sh /startup.sh
RUN chmod 744 /startup.sh

CMD ["/startup.sh"]
