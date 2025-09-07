declare module 'amadeus' {
  interface AmadeusConfig {
    clientId: string;
    clientSecret: string;
    hostname?: 'test' | 'production';
  }

  interface AmadeusResponse<T> {
    data: T;
    meta?: any;
    warnings?: any[];
  }

  class Amadeus {
    constructor(config: AmadeusConfig);
    
    shopping: {
      flightOffersSearch: {
        get(params: any): Promise<AmadeusResponse<any[]>>;
      };
    };
    
    referenceData: {
      locations: {
        get(params: any): Promise<AmadeusResponse<any[]>>;
      };
    };
    
    analytics: {
      itineraryPriceMetrics: {
        get(params: any): Promise<AmadeusResponse<any>>;
      };
    };
  }

  export = Amadeus;
}
