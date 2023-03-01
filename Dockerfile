# https://github.com/bluenevus/docker-minipaint
FROM centos:latest
EXPOSE 8080/tcp
RUN yum update -y
RUN yum install epel-release -y
RUN yum install git -y
RUN yum install curl -y
RUN curl -sL https://rpm.nodesource.com/setup_10.x | bash -
RUN yum install nodejs -y
RUN npm install -g npm -y
RUN mkdir /var/www
WORKDIR /var/www
RUN git clone https://github.com/viliusle/miniPaint.git
WORKDIR /var/www/miniPaint
RUN npm update -y
RUN npm init -y
CMD bash -c "npm run server"
