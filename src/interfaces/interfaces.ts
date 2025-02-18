
  
 export interface Variant {
    color: string;
    images:string[];
    stock: number;
    featured:Boolean
  }
  export type price={
   local:number;
   global:number;
  }

 export interface Product {
    _id: string;
    title: string;
    description: string;
    price: price;
    variations: Variant[];
    productDimensions:string[];
      productDetails:string[];
      productCare:string[];
  }


  export interface ImageVariant
  {
     image:string;
     color:string 
  }
  export interface Size
  {
     type:string;
     name:string 
  }
  export interface CartItem 
  {
   id:number;
   productId: string,
   productName: string,
   price: number,
   quantity: number,
   imageUrl: string,
   color: string

  }

  export type FeaturedProduct = Omit<CartItem, 'id' | 'quantity'>;

//   export interface FeaturedProduct 
//   {
//    productId: string,
//    productName: string,
//    price: number,
//    imageUrl: string,
//    color:string
//   }
  export interface User {
   email:string;
   userId:string;
   userCountry:string;
   firstName:string;
   lastName:string;
   title:string;
   phoneNumber:string;
   address:string;
   // phoneCode:string;
   dob:string;
  }
export interface IOrder {
    _id:string;
    email: string;
    orderID?: string;
    country?: string;
    firstName?: string;
    lastName?: string;
    address?: string;
    apartment?: string;
    postalZip?: string;
    city?: string;
    state?: string;
    phone?: string;
    cash?: boolean;
    cart?: CartItem[]; // Assuming CartItem interface exists
    total?: number;
    currency?: string;
    status?: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
    payment?: "pending" | "failed" | "confirmed";
    billingCountry?: string;
    billingFirstName?: string;
    billingState?: string;
    billingLastName?: string;
    billingAddress?: string;
    billingApartment?: string;
    billingPostalZip?: string;
    billingCity?: string;
    billingPhone?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
