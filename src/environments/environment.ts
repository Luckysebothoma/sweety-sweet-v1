
export const environment = {
	production: true,
//	apiUrl: 'https://node-js.justdo-it.uk'
    imagePath:"/upload",
    genearate_tempkey:"/images/temp-key",
	apiUrl: 'https://node-js.justdo-it.uk',
	redisPostgres:"https://redisPostgres.justdo-it.uk",
	auth:{ 
        domain: 'dev-3ocho460qagqipds.us.auth0.com',
        clientId: '5NZZICITa9LCg8U0dNQraVhGqNiEpUTi',
        audience:'https://linux.justdo-it.local:8083'
    },cloudflare_proxy:{
      webp:"https://expose_images.justdo-it.uk/webp",
      loader:"https://expose_images.justdo-it.uk/loader" 
    },
    expose_image:{
      r2bucket_png: "https://pub-6dc413a87c9f41549d36f8bdd8991609.r2.dev",
      r2bucket_webp: "https://pub-e0a0161176f44911add8cd4cf72ded4d.r2.dev",
      local_images:"https://expose_images.justdo-it.uk/local_images"
    },
    expose_image_gif:"https://expose_images.justdo-it.uk/images/gif",
	  nodejs:{
        full_api_path:'https://node-js.justdo-it.uk/api/v1/student',
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
        add2Pricing:'add2Pricing',}, 
        
    backend_get_endpoints:{
      getEstimates:"getEstimates",
      getPriceTracing:"getPriceTracing",
      getProductItemPricing:"getProductItemPricing",
      getProductList:"getProductList",
      getallAvailableItems:"getallAvailableItems",
      getallpricing:"getallpricing"

    }
    
};

export const metrics ={

    imagePath:"/upload",
    genearate_tempkey:"/images/temp-key",
    monitoring: {
        server: 'https://node-js.justdo-it.uk',
        frontendConsoleEndpoint: '/frontend-console-log',
        frontendErrorEndpoint: '/frontend-error',
        frontendMetricsEndpoint: '/frontend-metrics',
        frontendConsolePath: '/frontend-console-log',
        frontendErrorPath: '/frontend-error',
        frontendMetricsPath: '/frontend-metrics'
    },
    frontEndFullUrl: {
        
        frontendConsoleUrl: 'https://node-js.justdo-it.uk/frontend-console-log',
        frontendErrorUrl: 'https://node-js.justdo-it.uk/frontend-error',
        frontendMetricsUrl: 'https://node-js.justdo-it.uk/frontend-metrics'

    }
}
