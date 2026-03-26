//This function may be user on client side and server side
export const getURL = () => {
  // if you change port - change it here as well
  const rawUrl =
    process.env.NODE_ENV === "development"
      ? process.env.NEXT_DEVELOPMENT_URL
      : process.env.NEXT_PRODUCTION_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_VERCEL_URL

  let url = rawUrl || "http://localhost:3029"

  if (!url.includes("http")) {
    url = url.startsWith("localhost") || url.startsWith("127.0.0.1") ? `http://${url}` : `https://${url}`
  }
  url = url.charAt(url.length - 1) === "/" ? url : `${url}/`

  return url
}
