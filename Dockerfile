##### docker build ./ -t wekan-debian:1.0 ########
#
#FROM debian:8.9
#MAINTAINER wekan
#
## Declare Arguments
#ARG NODE_VERSION
#ARG METEOR_RELEASE
#ARG METEOR_EDGE
#ARG USE_EDGE
#ARG NPM_VERSION
#ARG FIBERS_VERSION
#ARG ARCHITECTURE
#ARG SRC_PATH
#
## Set the environment variables (defaults where required)
#ENV BUILD_DEPS="apt-utils wget curl bzip2 build-essential python git ca-certificates gcc-4.9"
#ENV GOSU_VERSION=1.10
#ENV NODE_VERSION ${NODE_VERSION:-v4.8.4}
#ENV METEOR_RELEASE ${METEOR_RELEASE:-1.4.4.1}
#ENV USE_EDGE ${USE_EDGE:-false}
#ENV METEOR_EDGE ${METEOR_EDGE:-1.5-beta.17}
#ENV NPM_VERSION ${NPM_VERSION:-4.6.1}
#ENV FIBERS_VERSION ${FIBERS_VERSION:-1.0.15}
#ENV ARCHITECTURE ${ARCHITECTURE:-linux-x64}
#ENV SRC_PATH ${SRC_PATH:-./}
#
#COPY ${SRC_PATH}/wekan-files /home/wekan/wekan-files
#
#RUN \
#    # Add non-root user wekan
#    useradd --user-group --system --home-dir /home/wekan wekan && \
#    \
#    # OS dependencies
#     apt-get update -y && apt-get dist-upgrade -y && apt-get install -y --no-install-recommends ${BUILD_DEPS} && \
#    \
#    # Install Node
#    cd /home/wekan/wekan-files && \
#    tar xvzf node-${NODE_VERSION}-${ARCHITECTURE}.tar.gz && \
#    rm node-${NODE_VERSION}-${ARCHITECTURE}.tar.gz && \
#    mv node-${NODE_VERSION}-${ARCHITECTURE} /opt/nodejs && \
#    ln -s /opt/nodejs/bin/node /usr/bin/node && \
#    ln -s /opt/nodejs/bin/npm /usr/bin/npm && \
#    cd / && \
#    \
#    # Install Node dependencies
#    npm install -g cnpm --registry=https://registry.npm.taobao.org && \
#    ln -s /opt/nodejs/bin/cnpm /usr/local/bin && \
#    npm install -g npm@${NPM_VERSION} && \
#    npm install -g node-gyp && \
#    npm install -g fibers@${FIBERS_VERSION} && \
#    \
#    # Change user to wekan and install meteor
#    cd /home/wekan/ && \
#    chown wekan:wekan --recursive /home/wekan && \
##    curl https://install.meteor.com -o ./install_meteor.sh && \
#    mv /home/wekan/wekan-files/install_meteor.sh ./ && \
#    sed -i "s|RELEASE=.*|RELEASE=${METEOR_RELEASE}\"\"|g" ./install_meteor.sh && \
#    echo "Starting meteor ${METEOR_RELEASE} installation...   \n" && \
#    chown wekan:wekan ./install_meteor.sh && \
#    \
#    # Gosu installation
#    mv /home/wekan/wekan-files/gosu-amd64  /usr/local/bin/gosu && \
#    chmod +x /usr/local/bin/gosu && \
#    \
#    # Check if opting for a release candidate instead of major release
#    if [ "$USE_EDGE" = false ]; then \
#      gosu wekan:wekan sh ./install_meteor.sh; \
#    else \
#      gosu wekan:wekan git clone --recursive --depth 1 -b release/METEOR@${METEOR_EDGE} git://github.com/meteor/meteor.git /home/wekan/.meteor; \
#    fi; \
#    \
#    # Get additional packages
#    mkdir -p /home/wekan/app/packages && \
#    chown wekan:wekan --recursive /home/wekan && \
#    cd /home/wekan/app/packages && \
#    gosu wekan:wekan git clone --depth 1 -b master git://github.com/wekan/flow-router.git kadira-flow-router && \
#    gosu wekan:wekan git clone --depth 1 -b master git://github.com/meteor-useraccounts/core.git meteor-useraccounts-core && \
#    sed -i 's/api\.versionsFrom/\/\/api.versionsFrom/' /home/wekan/app/packages/meteor-useraccounts-core/package.js && \
#    cd /home/wekan/.meteor && \
#    gosu wekan:wekan /home/wekan/.meteor/meteor -- help; \
#    \
#    #复制文件（下载不了）
#    mv /home/wekan/wekan-files/meteor_packages/rajit_bootstrap3-datepicker /home/wekan/.meteor/packages && \
#    mkdir -p /tmp/phantomjs && chown wekan:wekan /tmp/phantomjs && mv /home/wekan/wekan-files/phantomjs-1.9.8-linux-x86_64.tar.bz2 /tmp/phantomjs && \
#    \
#    #Clean Up
#    apt-get clean -y && \
#    apt-get autoremove -y && \
#    rm -R /home/wekan/wekan-files

#### docker build ./ -t wekan-docker:1.0 ########

FROM wekan-debian:1.0

COPY ${SRC_PATH} /home/wekan/app

RUN \
    # Build app
    chown wekan:wekan --recursive /home/wekan && \
    cd /home/wekan/app && \
    gosu wekan:wekan /home/wekan/.meteor/meteor add standard-minifier-js && \
    gosu wekan:wekan /home/wekan/.meteor/meteor npm install && \
    gosu wekan:wekan /home/wekan/.meteor/meteor npm install --save jquery meteor-babel-helpers source-map \
    coffee-script meteor-ecmascript-runtime reify meteor-promise fibers promise \
    es5-shim page cli-color bcryptjs lolex underscore load-script core-js@2.4.1 && \
    \
    #删除没用文件（致使npm install capp 失败）
    rm -f /home/wekan/app/sandstorm.js && \
    \
    gosu wekan:wekan /home/wekan/.meteor/meteor build --directory /home/wekan/app_build && \
    cp /home/wekan/app/fix-download-unicode/cfs_access-point.txt /home/wekan/app_build/bundle/programs/server/packages/cfs_access-point.js && \
    chown wekan:wekan /home/wekan/app_build/bundle/programs/server/packages/cfs_access-point.js && \
    gosu wekan:wekan sed -i "s|build\/Release\/bson|browser_build\/bson|g" /home/wekan/app_build/bundle/programs/server/npm/node_modules/meteor/cfs_gridfs/node_modules/mongodb/node_modules/bson/ext/index.js && \
    gosu wekan:wekan rm -rf node_modules/bcrypt && \
    gosu wekan:wekan cnpm install bcrypt && \
    cd /home/wekan/app_build/bundle/programs/server/ && \
    gosu wekan:wekan npm install && \
    mv /home/wekan/app_build/bundle /build && \
    # Cleanup
    apt-get remove --purge -y ${BUILD_DEPS} && \
    apt-get autoremove -y && \
    npm remove -g cnpm && \
    rm -R /var/lib/apt/lists/* && \
    rm -R /home/wekan/.meteor && \
#    rm -R /home/wekan/wekan-files && \
    rm -R /home/wekan/app && \
    rm -R /home/wekan/app_build && \
    rm /home/wekan/install_meteor.sh

ENV PORT=80
EXPOSE $PORT

CMD ["node", "/build/main.js"]
