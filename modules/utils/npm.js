import url from 'url';
import https from 'https';
import gunzip from 'gunzip-maybe';
import LRUCache from 'lru-cache';

import bufferStream from './bufferStream.js';

const npmRegistryURL =
  process.env.NPM_REGISTRY_URL || 'https://registry.npmjs.org';

const npmRegistryAccessToken =
  process.env.NPM_ACCESS_TOKEN || null;

const agent = new https.Agent({
  keepAlive: true
});

const oneMegabyte = 1024 * 1024;
const oneSecond = 1000;
const oneMinute = oneSecond * 60;

const cache = new LRUCache({
  max: 500,
  // alexgorbatchev: fixes for `lru-cache@^7.0.0`
  ttl: oneSecond,
  sizeCalculation: value => Buffer.byteLength(value),
  maxSize: oneMegabyte,
});

const notFound = '';

function get(options) {
  return new Promise((accept, reject) => {
    https.get(options, accept).on('error', reject);
  });
}

function isScopedPackageName(packageName) {
  return packageName.startsWith('@');
}

function encodePackageName(packageName) {
  return isScopedPackageName(packageName)
    ? `@${packageName.substring(1)}`
    : packageName;
}

function assembleOptions(target){
  const { hostname, pathname, port } = url.parse(target);
  const options = {
    agent: agent,
    hostname: hostname,
    path: pathname,
    port: port || 443,
    headers: {
      Accept: 'application/json',
      'X-JFrog-Art-Api': npmRegistryAccessToken
    },
  };
  return options;
}

async function fetchPackageInfo(packageName, log) {
  const name = encodePackageName(packageName);
  const infoURL = `${npmRegistryURL}/${name}`;
  log.info('Fetching package info for %s from %s', packageName, infoURL);

  const options = assembleOptions(infoURL)
  const res = await get(options);
  log.info('Received response status: ' +res.statusCode);

  if (res.statusCode === 200) {
    return bufferStream(res).then(JSON.parse);
  }

  if (res.statusCode === 404) {
    return null;
  }

  const content = (await bufferStream(res)).toString('utf-8');

  log.error(
    'Error fetching info for %s (status: %s)',
    packageName,
    res.statusCode
  );
  log.error(content);

  return null;
}

async function fetchVersionsAndTags(packageName, log) {
  const info = await fetchPackageInfo(packageName, log);
  return info && info.versions
    ? { versions: Object.keys(info.versions), tags: info['dist-tags'] }
    : null;
}

/**
 * Returns an object of available { versions, tags }.
 * Uses a cache to avoid over-fetching from the registry.
 */
export async function getVersionsAndTags(packageName, log) {
  const cacheKey = `versions-${packageName}`;
  const cacheValue = cache.get(cacheKey);

  if (cacheValue != null) {
    return cacheValue === notFound ? null : JSON.parse(cacheValue);
  }

  const value = await fetchVersionsAndTags(packageName, log);

  if (value == null) {
    cache.set(cacheKey, notFound, 5 * oneMinute);
    return null;
  }

  cache.set(cacheKey, JSON.stringify(value), oneMinute);
  return value;
}

// All the keys that sometimes appear in package info
// docs that we don't need. There are probably more.
const packageConfigExcludeKeys = [
  'browserify',
  'bugs',
  'directories',
  'engines',
  'files',
  'homepage',
  'keywords',
  'maintainers',
  'scripts'
];

function cleanPackageConfig(config) {
  return Object.keys(config).reduce((memo, key) => {
    if (!key.startsWith('_') && !packageConfigExcludeKeys.includes(key)) {
      memo[key] = config[key];
    }

    return memo;
  }, {});
}

async function fetchPackageConfig(packageName, version, log) {
  const info = await fetchPackageInfo(packageName, log);
  return info && info.versions && version in info.versions
    ? cleanPackageConfig(info.versions[version])
    : null;
}

/**
 * Returns metadata about a package, mostly the same as package.json.
 * Uses a cache to avoid over-fetching from the registry.
 */
export async function getPackageConfig(packageName, version, log) {
  const cacheKey = `config-${packageName}-${version}`;
  const cacheValue = cache.get(cacheKey);

  if (cacheValue != null) {
    return cacheValue === notFound ? null : JSON.parse(cacheValue);
  }

  const value = await fetchPackageConfig(packageName, version, log);

  if (value == null) {
    cache.set(cacheKey, notFound, 5 * oneMinute);
    return null;
  }

  cache.set(cacheKey, JSON.stringify(value), oneMinute);
  return value;
}

async function getFollowRedirects(options, log) {
  const res = await get(options)
  if(res.statusCode === 302){
    const redirectTarget = res.headers.location;
    log.info('Need to redirect to: ' + redirectTarget);
    return getFollowRedirects(redirectTarget);
  }
  return res
}

/**
 * Returns a stream of the tarball'd contents of the given package.
 */
export async function getPackage(packageName, version, log) {
  log.info('Get package %s in version %s', packageName, version);
  const basePath = `${npmRegistryURL}/${packageName}/-/`;
  const isScopedPackage = isScopedPackageName(packageName);
  const packageNameWithoutScope = isScopedPackage
    ? packageName.split('/').pop()
    : packageName
  const fileNameNameWithoutScope = `${packageNameWithoutScope}-${version}.tgz`;
  const tarballURL = basePath + fileNameNameWithoutScope
  log.info('Fetching package %s from %s', packageName, tarballURL);

  const options = assembleOptions(tarballURL)
  let res = await getFollowRedirects(options, log);
  log.info('Fetching package %s returned with status code %s', packageName, res.statusCode)

  if(res.statusCode === 404 && isScopedPackage) {
    log.info(`Could not find package ${packageName} but packaged is scoped. Retrying with scoped filename...`);
    const fileNameWithScope = `${packageName}-${version}.tgz`;
    // this hack is needed, because our RBMH Artifactory produces "uncommon" URLs
    // the scope is usually not included in the file name, but Artifactory ignores that
    // further reading: https://www.jfrog.com/jira/browse/RTFACT-24151
    const alternativeTarballURL = basePath + fileNameWithScope
    const options = assembleOptions(alternativeTarballURL)
    res = await getFollowRedirects(options, log);
  }

  if (res.statusCode === 200) {
    log.info(`Package ${packageName} found.`)
    return await res.pipe(gunzip());
  } else if (res.statusCode === 404) {
    log.info(`Could not download package ${packageName}.`)
    return null;
  } else {
    log.info(`Something bad happened to package ${packageName}. Server returned: ${res.statusCode}`)
    return null;
  }
}
