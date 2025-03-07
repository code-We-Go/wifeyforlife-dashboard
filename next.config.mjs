/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
              remotePatterns: [
                {
                  protocol: "https",
                  hostname: "tyfa2qhumr.ufs.sh",
                },
                      {
                        protocol: "https",
                        hostname: "images.pexels.com",
    
                      },
                      {
                        protocol: "https",
                        hostname: "utfs.io",
    
                      },
              ]
          
          }
};

export default nextConfig;
