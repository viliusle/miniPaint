FROM centos:latest
MAINTAINER Basit Mohammad <basit.mohammad@microhealthllc.com>

RUN yum update -y
RUN yum install epel-release -y
RUN yum install git -y
RUN yum install -y gcc-c++ make
RUN yum install curl -y
RUN curl -sL https://rpm.nodesource.com/setup_6.x | sudo -E bash -
RUN yum install nodejs
RUN git clone https://github.com/viliusle/miniPaint.git
RUN cd miniPaint
RUN npm update -y
RUN npm run server
