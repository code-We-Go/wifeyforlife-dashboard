import ordersModel from "@/app/models/ordersModel";
import productsModel from "@/app/models/productsModel";
import productModel from "@/app/models/productsModel";
import { ConnectDB } from "@/config/db";
import { NextResponse } from "next/server";

const loadDB = async () => {
    await ConnectDB();
};

loadDB();
export async function POST (req: Request, res: Response){
    console.log('working');
    try {
        const data = await req.json();
        console.log(data)
        const newProduct = await productModel.create(data);
        return NextResponse.json({ data: newProduct }, { status: 200 });
    } catch (error:any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
export async function DELETE(request:Request){
    console.log('working');
    const req=await request.json()
    console.log(req)
    
    console.log('working');
    try {
        const res= await productModel.findByIdAndDelete(req.productID)
        console.log(res);

     return new Response(JSON.stringify(res),{
            headers: { 'Content-Type': 'application/json' },
                status:200
            }
        )
   
    }
    catch(error:any){

        //  return NextResponse.json({msg:'error'}),
        //  {status:500}
        return Response.json({ error: error.message }, { status: 500 });
     }
   

}
export async function PUT(request:Request){
    const { searchParams } = new URL(request.url);
    const productID = searchParams.get("productID") 
    console.log('working');
    const req=await request.json()
    console.log(req)
    
    console.log('working');
    try {
        const res = await productsModel.findByIdAndUpdate(productID, req, { new: true, runValidators: true });
        return NextResponse.json({data:res},{status:200})
    }
    catch(error:any){
        return Response.json({ error: error.message }, { status: 500 });
     
    }
}
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = 10;
    const skip = (page - 1) * limit;

    try {
        const products = await productModel.find().skip(skip).limit(limit).sort({ createdAt: -1 });
        const totalProducts = await productModel.countDocuments();

        return NextResponse.json({
            data: products,
            total: totalProducts,
            currentPage: page,
            totalPages: Math.ceil(totalProducts / limit),
        }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }
}
