const isServer = typeof window === 'undefined';

const publicApi = process.env.NEXT_PUBLIC_API_URL;
const internalApi = process.env.API_URL_INTERNAL;


const BASE_URL = isServer
    ? (internalApi || publicApi )
    : (publicApi);

const API_URL = `${BASE_URL}/ask`;

export { API_URL };