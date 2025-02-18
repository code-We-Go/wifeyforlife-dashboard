/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains:["tyfa2qhumr.ufs.sh","images.pexels.com"],
              remotePatterns: [
                      {
                        protocol: "https",
                        hostname: "images.pexels.com",
    
                      },
              ]
          
          }
};

export default nextConfig;
