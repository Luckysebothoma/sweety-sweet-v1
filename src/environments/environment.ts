// Inline placeholder: no network request, so it can never 404 (previously pointed at
// <host>/failures/failure.webp, which the API/nginx did not serve -> a 404 per broken <img>).
const FALLBACK_IMAGE = "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' rx='12' fill='%23f1f3f5'/%3E%3Cpath d='M30 84l22-26 16 18 10-12 12 20z' fill='%23ced4da'/%3E%3Ccircle cx='44' cy='40' r='8' fill='%23ced4da'/%3E%3Cpath d='M20 20l80 80' stroke='%23adb5bd' stroke-width='5' stroke-linecap='round'/%3E%3C/svg%3E";
export const environment = {
	production: false,
  stock_nodejs_server_endpoint:"https://stock-backend:8080/api/stock/process", 
    imagePath:"/upload",
    genearate_tempkey:"/images/temp-key",
//	apiUrl: 'https:/node-js.justdo-it.uk'
	apiUrl: 'https://192.168.0.140:8183',

	redisPostgres:"https://redisPostgres.justdo-it.uk",
	auth:{ 
        domain: 'dev-3ocho460qagqipds.us.auth0.com',
        clientId: '5NZZICITa9LCg8U0dNQraVhGqNiEpUTi',
        audience:'https://linux.justdo-it.local:8083'
    },
 
    expose_image:{
      r2bucket_png: "https://pub-6dc413a87c9f41549d36f8bdd8991609.r2.dev",
      r2bucket_webp: "https://pub-e0a0161176f44911add8cd4cf72ded4d.r2.dev",
            local_images:"https://192.168.0.140:3007",
            nginx:"https://192.168.0.140:3007",
            hono:"https://192.168.0.140:3009/images",
            fallbackImage: FALLBACK_IMAGE

    },
    expose_gif_failures:{
            cross:"https://192.168.0.140:8183/images/failures/failure_cross.gif",
            shake:"https://192.168.0.140:8183/images/failures/failure_shake.gif",
            sad:"https://192.168.0.140:3009/images/failures/failure_sad.gif",
            fallbackImage: FALLBACK_IMAGE

    },expose_gif_loading:{
            gear:"https://192.168.0.140:8183/loading/loading_gear.gif",
            infinite:"https://192.168.0.140:8183/loading/loading_infinite.gif",
            maze:"https://192.168.0.140:3009/loading/loading_maze.gif",
            fallbackImage: FALLBACK_IMAGE

    },cloudflare_proxy:{
      webp:"https://192.168.0.140:8183/webp",
      loader:"https://192.168.0.140:8183/loader" 

    },
        expose_image_gif:"https://192.168.0.140:8183/images/gif",

	  nodejs:{
        full_api_path:'https://192.168.0.140:8183/api/v1/student',
    },
    backend_endpoints:{
        addPriceTracing:'addPriceTracing',
        addEstimates:'addEstimates',
        addProductItemPricing:'addProductItemPricing',
        addStock:'addStock',
        addSodEodItems:'addSodEodItems',
        addSodEodList:'addSodEodList',
        addAvailableItems:'addAvailableItems',
        addProduct:'addProduct',
        add2cart:'add2cart',
        add2Pricing:'add2Pricing',
        addSod_Eod_List:"addListOfSodEod"
    }, 
    backend_get_endpoints:{
      getEstimates:"getEstimates",
      getPriceTracing:"getPriceTracing",
      getProductItemPricing:"getProductItemPricing",
      getProductList:"getProductList",
      getallAvailableItems:"getallAvailableItems",
      getallpricing:"getallpricing"

    }
    
};
  
export const metrics = {
  monitoring: {
    server: 'https://192.168.0.140:8183', // 🔧 Replace with process.env or override during deployment
    frontendConsoleEndpoint: '/frontend-console-log',
    frontendErrorEndpoint: '/frontend-error',
    frontendMetricsEndpoint: '/frontend-metrics',
    frontendConsolePath: '/frontend-console-log',
    frontendErrorPath: '/frontend-error',
    frontendMetricsPath: '/frontend-metrics',
    frontendConsoleUrl: '/frontend-console-log',
  },
  frontEndFullUrl: {
    frontendConsoleUrl: 'https://192.168.0.140:8183/frontend-console-log',
    frontendErrorUrl: 'https://192.168.0.140:8183/frontend-error',
    frontendMetricsUrl: 'https://192.168.0.140:8183/frontend-metrics',
 

  }
};