#!/bin/bash
set -e
if [  ! -f "/etc/letsencrypt/live/${NEW_OPENIMIS_HOST}/fullchain.pem" ]; then
  mkdir -p /etc/letsencrypt/live/${NEW_OPENIMIS_HOST}
  echo "copying certificates to  /etc/letsencrypt/live/${NEW_OPENIMIS_HOST}/"
  cp -a /etc/nginx/ssl/live/host/. /etc/letsencrypt/live/${NEW_OPENIMIS_HOST}/
fi
REF=$(date +'%m%d%Y%p')
[[ ${FORCE_RELOAD} -eq 1 ]] && REDIRECT_TAIL="&${REF}" || REDIRECT_TAIL=''
rm -f /etc/nginx/conf.d/openIMIS.confs
rm -f /etc/nginx/conf.d/default.conf

VARS_TO_REPLACE="$(printenv | grep -Eo "^([A-Z_]*)" | xargs -I % echo \$\{%\}, | xargs)"
echo "replacing ENV vars in openIMIS.conf"
envsubst  "\${REDIRECT_TAIL}, ${VARS_TO_REPLACE::-1}" < /conf/openimis.conf > /etc/nginx/conf.d/openIMIS.conf

# add the parts
if [ -d '/conf/locations' ]; then
  echo "loading the location specific conf in openIMIS.conf"
  if [ !  -d '/etc/nginx/conf.d/locations' ]; then
      mkdir -p /etc/nginx/conf.d/locations
  else
    rm /etc/nginx/conf.d/locations/*
  fi
  if [ !  -d '/etc/nginx/conf.d/variables' ]; then
      mkdir -p /etc/nginx/conf.d/variables
  fi
  cp /conf/variables/var.conf /etc/nginx/conf.d/variables/var.conf
    multiline_content="#include the configuration use in the loc files\ninclude conf.d/variables/var.conf;\n# include the>
  echo "cleaning old config"

  # Use sed to replace ###PLACEHOLDER### with multiline content
  sed -i "s|###INCLUDE_PLACEHOLDER###|${multiline_content}|g" /etc/nginx/conf.d/openIMIS.conf
  for file in /conf/locations/*
  do
    [ -f "$file" ] || continue
    filename=$(basename "$file")
    echo "${file} saved in /etc/nginx/conf.d/locations/$filename"
    envsubst  "${VARS_TO_REPLACE::-1}" < "$file" > "/etc/nginx/conf.d/locations/$filename"
  done

fi

ln -s -f  /usr/share/nginx/html /usr/share/nginx/html/${PUBLIC_URL}
echo "Hosting on https://""$NEW_OPENIMIS_HOST"
echo "root uri $PUBLIC_URL"
echo "root api $REACT_APP_API_URL"
echo "root restapi $ROOT_MOBILEAPI"
echo "OpenSearch proxy base root $OPENSEARCH_PROXY_ROOT"



#####  Specific local module loading entrypoint
echo "start of Specific local script loading"
curl -sL https://deb.nodesource.com/setup_18.x -o nodesource_setup.sh
bash nodesource_setup.sh
echo "start apt install node + git + nano"
apt -y install nodejs git nano

echo "node & npm versions"
node -v
npm -v

echo "start npm install"
npm install --global yarn

echo "--- yarn Install openimis-fe_js"
cd /conf/openimis-fe_js
yarn  load-config openimis.json
yarn install

echo "--- yarn Install Build openimis-fe-insuree"
cd /conf/openimis-fe-insuree_js
yarn install
yarn build
yarn link


echo "start apt remove nodejs 18"
apt-get remove nodejs -y
curl -sL https://deb.nodesource.com/setup_16.x -o nodesource_setup.sh
bash nodesource_setup.sh

echo "start apt install nodejs 16"
apt-get install nodejs -y
cd /conf/openimis-fe_js
yarn link "@openimis/fe-insuree"

echo "--- yarn Build openimis-fe_js with custom modules"
yarn build

echo "--- Copy build files to nginx html/front directory"
mkdir -p /usr/share/nginx/html/front
rm -rf /usr/share/nginx/html/front/*
cp -r /conf/openimis-fe_js/build/* /usr/share/nginx/html/front/

echo "end of Specific local script loading"

nginx -t || exit 1
nginx -g "daemon off;"