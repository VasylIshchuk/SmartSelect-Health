const DOCKER_DEFAULT = "http://backend:8000";
const CLIENT_DEFAULT = "http://localhost:8000";

const isServer = typeof window === 'undefined';

const urlDocker = process.env.API_URL_INTERNAL
const urlBrowser = process.env.NEXT_PUBLIC_API_URL;
const urlRender = process.env.NEXT_PUBLIC_API_URL;


const BASE_URL = isServer
    ? (urlDocker || urlRender || DOCKER_DEFAULT)
    : (urlBrowser || CLIENT_DEFAULT);

const API_URL = `${BASE_URL}/ask`;

export { API_URL };