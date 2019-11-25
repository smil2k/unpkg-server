### RB UNPKG
This fork of unpkg is able to connect to our private Artifactory repo, so that we can use our artifacts on CodePen.

### Local testing
Run like 
```
node server.js \
  --NPM_REGISTRY_URL=https://artifactory.redbullmediahouse.com/api/npm/rb-web-components \
  --NPM_ACCESS_TOKEN={YOUR API KEY} \
  --PORT=8081
  --NODE_ENV=production
```
and navigate to 
```
http://localhost:8081/browse/@rbmh-design-system/web-components/
```

### CircleCI 
Provide the following env variables:
```
GCP_SERVICE_KEY
GCP_PROJECT_ID
NPM_REGISTRY_URL
NPM_ACCESS_TOKEN
```