SERVER='188.68.218.157'
FOLDER='/www/kaizen-server'








echo "BUILD"
npm run build



tar czf src.tar.gz dist package.json  package-lock.json tsconfig.build.json tsconfig.json

echo "UPLOAD..."
scp -r src.tar.gz root@$SERVER:$FOLDER

echo "EXTRACT..."
ssh -tt root@$SERVER << EOF
su root;
 cd $FOLDER;
 tar -zxvf src.tar.gz;
 pm2 stop  ecosystem.config.js;
 pm2 start ecosystem.config.js
 pm2 logs;
EOF


echo "generate SDK"
npm run generateSDK

echo "CLEAR..."
rm src.tar.gz
