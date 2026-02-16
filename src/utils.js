var APIHost, Host;

if (window.location.href.startsWith('http://localhost')) {
  Host = 'http://localhost:3000';
  APIHost =
    process.env.REACT_APP_API_HOST ||
    'http://localhost:5002';
} else if (process.env.REACT_APP_API_HOST) {
  Host = window.location.origin;
  APIHost = process.env.REACT_APP_API_HOST;
} else if (window.location.hostname.endsWith('.vercel.app')) {
  Host = window.location.origin;
  APIHost = window.location.origin;
} else if (window.location.href.startsWith('https://safarimixer.beta.rehab')) {
  Host = 'https://safarimixer.beta.rehab';
  APIHost = 'https://us-central1-animixer-1d266.cloudfunctions.net';
} else {
  Host = 'https://animixer-dev.firebaseapp.com';
  APIHost = 'https://us-central1-animixer-dev.cloudfunctions.net';
}

function capitalizeFirstLetter(string) {
  if (!string) {
    return;
  }
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function isIEorEDGE() {
  return (
    navigator.appName === 'Microsoft Internet Explorer' ||
    (navigator.appName === 'Netscape' &&
      navigator.appVersion.indexOf('Edge') > -1)
  );
}

function isSafari() {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

function isChrome() {
  return (
    /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor)
  );
}

function getAnimalUrl(animal1, animal2, animal3) {
  let animalPath = `/${animal1}/${animal2}/${animal3}`;
  return APIHost + '/api/mixipedia' + animalPath;
}

function getShareUrl(animal1, animal2, animal3) {
  let urlArgs = `?animal1=${animal1}&animal2=${animal2}&animal3=${animal3}`;
  return Host + urlArgs;
}

const CONTRACT_ADDRESS = 'GPQUKSKqSTGEqrYGxgEaHQ7Q1mAKw6EoCJ3eHjYEpump';
const TWITTER_HANDLE = 'Safari_Mixer';

export default {
  APIHost,
  Host,
  CONTRACT_ADDRESS,
  TWITTER_HANDLE,
  capitalizeFirstLetter,
  getAnimalUrl,
  getShareUrl,
  isChrome,
  isIEorEDGE,
  isSafari
};
