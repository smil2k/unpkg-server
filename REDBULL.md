### RB UNPKG
This fork of unpkg is able to connect to our private Artifactory repo, so that we can use our artifacts on CodePen.

### tl;dr
If you're looking for webcomponents; can find it here: https://rbmh-unpkg.appspot.com/browse/@rbmh-design-system/web-components@2.0.0/

### Local testing
Run like 
```
node server.js \
  --NPM_REGISTRY_URL=https://artifactory.redbullmediahouse.com/artifactory/api/npm/rb-web-components \
  --NPM_ACCESS_TOKEN={YOUR API KEY} \
  --PORT=8081
  --NODE_ENV=production
```
and navigate to 
```
http://localhost:8081/browse/@rbmh-design-system/web-components@2.0.0/
```
to browse content or to 
```
http://localhost:8081/@rbmh-design-system/web-components@2.0.0/dist/index.js
```
to fetch a file (e.g. to use it on codepen.io)



### CircleCI 
Provide the following env variables:
```
GCP_SERVICE_KEY
GCP_PROJECT_ID
NPM_REGISTRY_URL //don't use a trailing slash! unpkg is so freaking stupid.
NPM_ACCESS_TOKEN
```
