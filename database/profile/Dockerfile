FROM postgres:latest

USER postgres

ENV POSTGRES_USERNAME=postgres
ENV POSTGRES_PASSWORD=postgres
ENV POSTGRES_DB=profile

ADD init.sql /docker-entrypoint-initdb.d/

EXPOSE 5432
