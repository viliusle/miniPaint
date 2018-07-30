FROM centos:latest
MAINTAINER Basit Mohammad <basit.mohammad@microhealthllc.com>

RUN yum update -y
RUN yum install epel-release -y
RUN yum install git -y
RUN yum install nodejs -y
RUN yum install gcc-c++ make -y
RUN npm update -y
RUN npm init -y
RUN npm install -y
RUN git clone https://github.com/viliusle/miniPaint.git
RUN cd miniPaint
RUN npm run build
