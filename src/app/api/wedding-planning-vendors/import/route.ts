import weddingPlanningVendorsModel from "@/app/models/weddingPlanningVendors";
import { ConnectDB } from "@/config/db";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

const loadDB = async () => {
    await ConnectDB();
};

loadDB();

export async function POST(req: Request) {
    try {
        const { vendors } = await req.json();

        if (!vendors || !Array.isArray(vendors) || vendors.length === 0) {
            return NextResponse.json(
                { error: "No vendors data provided" },
                { status: 400 }
            );
        }

        const results = { inserted: 0, errors: [] as string[] };

        for (let i = 0; i < vendors.length; i++) {
            const row = vendors[i];
            try {
                // Validate and process subCategoryID (can be comma-separated or array of IDs)
                const subCategoryIDs: mongoose.Types.ObjectId[] = [];
                if (row.subCategoryID) {
                    const ids = typeof row.subCategoryID === "string"
                        ? row.subCategoryID.split(",").map((s: string) => s.trim()).filter(Boolean)
                        : Array.isArray(row.subCategoryID) ? row.subCategoryID : [row.subCategoryID];

                    let hasInvalidId = false;
                    for (const subId of ids) {
                        if (!mongoose.Types.ObjectId.isValid(subId)) {
                            results.errors.push(
                                `Row ${i + 1}: Invalid subCategoryID "${subId}"`
                            );
                            hasInvalidId = true;
                            break;
                        }
                        subCategoryIDs.push(new mongoose.Types.ObjectId(subId));
                    }
                    if (hasInvalidId) {
                        continue;
                    }
                }

                const vendorData: any = {
                    name: row.name,
                    subCategoryID: subCategoryIDs,
                };

                // Optional fields
                if (row.fromPrice !== undefined && row.fromPrice !== "") {
                    vendorData.fromPrice = Number(row.fromPrice);
                } else if (row.price !== undefined && row.price !== "" && !isNaN(Number(row.price))) {
                    vendorData.fromPrice = Number(row.price);
                }

                if (row.toPrice !== undefined && row.toPrice !== "") {
                    vendorData.toPrice = Number(row.toPrice);
                }

                if (row.coverImage !== undefined && row.coverImage !== "") {
                    vendorData.coverImage = String(row.coverImage);
                }

                if (row.link !== undefined && row.link !== "") {
                    vendorData.link = typeof row.link === "string"
                        ? row.link.split(",").map((s: string) => s.trim()).filter(Boolean)
                        : Array.isArray(row.link) ? row.link : [row.link];
                }

                if (row.package !== undefined && row.package !== "") vendorData.package = row.package;
                if (row.notes !== undefined && row.notes !== "") vendorData.notes = row.notes;
                if (row.active !== undefined && row.active !== "") {
                    vendorData.active = String(row.active).toLowerCase() === "true" || row.active === true;
                }
                if (row.images !== undefined && row.images !== "") {
                    // images come as comma-separated string from Excel
                    vendorData.images = typeof row.images === "string"
                        ? row.images.split(",").map((s: string) => s.trim()).filter(Boolean)
                        : row.images;
                }

                if (!vendorData.name) {
                    results.errors.push(`Row ${i + 1}: Missing required field "name"`);
                    continue;
                }

                await weddingPlanningVendorsModel.create(vendorData);
                results.inserted++;
            } catch (err: any) {
                results.errors.push(`Row ${i + 1}: ${err.message}`);
            }
        }

        return NextResponse.json(
            {
                message: `Import complete. ${results.inserted} vendors inserted.`,
                inserted: results.inserted,
                errors: results.errors,
            },
            { status: 200 }
        );
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
