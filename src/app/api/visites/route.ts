import visitesModel from "@/app/models/visitsModel";
import { ConnectDB } from "@/config/db";
import { NextResponse } from "next/server";

const loadDB = async () => {
    console.log('hna');
    await ConnectDB();
}

loadDB();

export async function POST(request: Request) {
    const data = await request.json();
    console.log("data"+data)
    console.log(data.countryCode);

    try {
        const res = await visitesModel.create({"countryCode": data.countryCode,"deviceType":data.deviceType });
            return NextResponse.json({ message: "Done Wogo" }, { status: 200 });
   
    }
    catch (error: any) {
        console.error(error);

        // Check if error is related to MongoDB validation
        if (error.name === 'ValidationError') {
            return NextResponse.json({ message: 'Validation failed. Please check the data format.' }, { status: 400 });
        }

        // Check for duplicate key error


        // For other MongoDB errors (e.g., connection issues)
        if (error.name === 'MongoNetworkError') {
            return NextResponse.json({ message: 'Network error while connecting to Database.' }, { status: 503 });
        }

        // General server error
        return NextResponse.json({ message: 'Internal server error please try again later', error: error.message }, { status: 500 });
    }
}
export async function GET(req: Request) {
    // const { searchParams } = new URL(req.url);
    // const page = parseInt(searchParams.get("page") || "1", 10);
    // const limit = 10;
    // const skip = (page - 1) * limit;

    try {
        const data = await visitesModel.find()
        // const totalProducts = await visitesModel.countDocuments();

        return NextResponse.json({
            data: data,
            // total: totalProducts,
            // currentPage: page,
            // totalPages: Math.ceil(totalProducts / limit),
        }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch visits" }, { status: 500 });
    }
}