import ordersModel from "@/app/models/ordersModel";
import { ConnectDB } from "@/config/db";
import { NextResponse } from "next/server";

const loadDB = async () => {
    await ConnectDB();
};

loadDB();

export async function DELETE(request:Request){
    console.log('working');
    const req=await request.json()
    console.log(req)
    
    console.log('working');
    try {
        const res= await ordersModel.findByIdAndDelete(req.orderID)
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
    const orderID = searchParams.get("orderID") 
    console.log('working');
    const req=await request.json()
    console.log(req)
    
    console.log('working');
    try {
        const res = await ordersModel.findByIdAndUpdate(orderID, req, { new: true, runValidators: true });
        return NextResponse.json({data:res},{status:200})
    }
    catch(error:any){
        return Response.json({ error: error.message }, { status: 500 });
     
    }
}
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    if(searchParams.get("page") !== null){
        const paga = searchParams.get("page")!
        const page = parseInt(paga);

        const limit = 10;
        const skip = (page - 1) * limit;
        try {
            const orders = await ordersModel.find().skip(skip).limit(limit).sort({ createdAt: -1 });
            const totalOrders = await ordersModel.countDocuments();
    
            return NextResponse.json({
                data: orders,
                total: totalOrders,
                currentPage: page,
                totalPages: Math.ceil(totalOrders / limit),
            }, { status: 200 });
        } catch (error) {
            return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
        }
    }
    else{
        try {
            const orders = await ordersModel.find().sort({ createdAt: -1 });
            console.log('orders'+orders.length);
            return NextResponse.json({ data: orders }, { status: 200 });
        } catch (error) {
            return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
        }
    }

}
