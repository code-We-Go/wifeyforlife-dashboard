import {
  Category,
  Collection,
  Product,
  SubCategory,
} from "@/interfaces/interfaces";
import axios from "axios";
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import Image from "next/image";
import ProductVariant from "./ProductVariant";
import DeleteProductModal from "./DeleteProductModal";

const ProductModal = ({
  isDetailsModalOpen,
  product,
  setProducts,
  setDetailsModal,
}: {
  isDetailsModalOpen: boolean;
  product: Product;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setDetailsModal: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [productState, setProduct] = useState<Product>(product);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");

  // Reset state when modal opens with a new product
  useEffect(() => {
    if (isDetailsModalOpen) {
      console.log("Modal opened, product:", product);
      console.log("Product subcategory:", product.subCategoryID);

      // Safely set selected subcategory
      setSelectedSubCategory(
        product.subCategoryID?._id || "",
      );
      setProduct({
        ...product,
        productDetails: Array.isArray(product.productDetails) ? product.productDetails : [],
      });
    }
  }, [isDetailsModalOpen, product]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios("/api/categories?type=product");
        if (res.status === 200) {
          setCategories(res.data.data);
          console.log("Categories loaded:", res.data.data);
          console.log("Current selected category:", selectedCategory);

          // Set the selected category and fetch subcategories (safely handle deleted references)
          const categoryId = product.subCategoryID?.categoryID?._id || "";
          console.log("Setting category to:", categoryId);
          if (categoryId) {
            setSelectedCategory(categoryId);
            await fetchSubCategories(categoryId);
          }
          setSelectedSubCategory(
            product.subCategoryID?._id || "",
          );
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
  }, []);

  const fetchSubCategories = async (categoryId: string) => {
    if (!categoryId) {
      setSubCategories([]);
      return;
    }
    try {
      const res = await axios(`/api/subcategories?categoryID=${categoryId}`);
      if (res.status === 200) {
        setSubCategories(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setSubCategories([]);
    }
  };

  const handleCategoryChange = async (categoryId: string) => {
    setSelectedCategory(categoryId);
    await fetchSubCategories(categoryId);
    // Reset subcategory when category changes
    setProduct((prev) => ({
      ...prev,
      subCategoryID: {
        _id: "",
        categoryID: {
          _id: "",
          categoryName: "",
          description: "",
          imageURL: "",
        },
        description: "",
        subCategoryName: "",
      },
    }));
  };

  const updateFeild = async (field: string, value: any) => {
    if (field === "subCategoryID") {
      // Find the selected subcategory object from the subCategories array
      const selectedSubCategory = subCategories.find(
        (sub) => sub._id === value,
      );
      if (selectedSubCategory) {
        setProducts((prevProducts) =>
          prevProducts.map((p) =>
            p._id === product._id ? { ...p, [field]: selectedSubCategory } : p,
          ),
        );
        setProduct((prev) => ({ ...prev, [field]: selectedSubCategory }));
      }
    } else {
      setProducts((prevProducts) =>
        prevProducts.map((p) =>
          p._id === product._id ? { ...p, [field]: value } : p,
        ),
      );
      setProduct((prev) => ({ ...prev, [field]: value }));
    }
  };

  const updateArabicField = (field: string, value: any) => {
    const updated = {
      ...productState,
      translations: {
        ...productState.translations,
        ar: {
          ...productState.translations?.ar,
          [field]: value,
        },
      },
    };
    setProduct(updated);
    setProducts((prev) =>
      prev.map((p) => (p._id === product._id ? updated : p))
    );
  };
  // Update Product Function
  const updateProduct = async () => {
    console.log("clicked");
    try {
      // Update local state optimistically

      // Send update request to backend
      console.log("update" + productState.variations[0].attributes[0].price);
      const updatedProduct = await axios.put(
        `/api/products?productID=${product._id}`,
        productState,
      );

      // Update state with the response from the backend
      setProducts((prevProducts) =>
        prevProducts.map((p) =>
          p._id === updatedProduct.data?.data?._id
            ? updatedProduct.data.data
            : p,
        ),
      );

      Swal.fire({
        background: "#FFFFF",
        color: "black",
        toast: false,
        iconColor: "#473728",
        position: "bottom-right",
        text: "PRODUCT HAS BEEN UPDATED",
        showConfirmButton: false,
        timer: 2000,
        customClass: {
          popup: "no-rounded-corners small-popup",
        },
      });
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  // Update Variant Function
  const updateVariant = async (index: number, field: string, value: any) => {
    setProduct((prev) => {
      const updatedVariations = [...prev.variations];
      updatedVariations[index] = {
        ...updatedVariations[index],
        [field]: value,
      };
      return { ...prev, variations: updatedVariations };
    });

    // Optimistically reflect changes in the products list
    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        if (p._id === product._id) {
          const updatedVariations = [...p.variations];
          updatedVariations[index] = {
            ...updatedVariations[index],
            [field]: value,
          };
          return { ...p, variations: updatedVariations };
        }
        return p;
      }),
    );
  };

  // Add this function to handle variant deletion
  const deleteVariant = (index: number) => {
    setProduct((prev) => {
      const updatedVariations = prev.variations.filter((_, i) => i !== index);
      return { ...prev, variations: updatedVariations };
    });

    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        if (p._id === product._id) {
          const updatedVariations = p.variations.filter((_, i) => i !== index);
          return { ...p, variations: updatedVariations };
        }
        return p;
      }),
    );
  };

  return (
    isDetailsModalOpen && (
      <div
        onClick={() => setDetailsModal(false)}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 lg:pl-72.5"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="max-h-[90vh] w-[90%] overflow-y-scroll rounded-2xl  bg-white p-6 text-center text-gray-600 shadow-lg max-lg:mt-16"
        >
          <h2 className="mb-4 text-lg font-bold">PRODUCT DETAILS</h2>

          {/* Product Info */}
          <div className="space-y-2 text-left">
            {/* Product ID */}
            <div>
              <label className="block font-semibold">Product ID:</label>
              <input
                type="text"
                value={product._id}
                disabled
                className="w-full border p-2"
              />
            </div>

            {/* Title Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold">Title (English):</label>
                <input
                  type="text"
                  value={productState.title}
                  onChange={(e) => updateFeild("title", e.target.value)}
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="block font-semibold flex items-center justify-between">
                  <span>Arabic Title:</span>
                  <span className="text-xs text-primary font-normal">عنوان المنتج بالعربية</span>
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={productState.translations?.ar?.title || ""}
                  onChange={(e) => updateArabicField("title", e.target.value)}
                  className="w-full border border-amber-200 bg-amber-50/30 p-2 rounded text-right"
                  placeholder="عنوان المنتج باللغة العربية"
                />
              </div>
            </div>

            {/* Description Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold">Description (English):</label>
                <textarea
                  value={productState.description}
                  onChange={(e) => updateFeild("description", e.target.value)}
                  className="w-full border p-2 rounded"
                  rows={3}
                />
              </div>
              <div>
                <label className="block font-semibold flex items-center justify-between">
                  <span>Arabic Description:</span>
                  <span className="text-xs text-primary font-normal">وصف المنتج بالعربية</span>
                </label>
                <textarea
                  dir="rtl"
                  value={productState.translations?.ar?.description || ""}
                  onChange={(e) => updateArabicField("description", e.target.value)}
                  className="w-full border border-amber-200 bg-amber-50/30 p-2 rounded text-right"
                  rows={3}
                  placeholder="وصف المنتج باللغة العربية"
                />
              </div>
            </div>
            <div className="flex gap-10">
              <div className="w-1/2">
                <label className="block font-semibold">Featured:</label>
                <input
                  type="checkbox"
                  checked={productState.featured}
                  onChange={(e) => updateFeild("featured", e.target.checked)}
                  className="border p-2"
                />
              </div>
              {/* Order */}
              <div className="w-1/2">
                <label className="block font-semibold">Order:</label>
                <input
                  type="number"
                  value={productState.order ?? 0}
                  onChange={(e) => updateFeild("order", Number(e.target.value))}
                  className="w-full border p-2"
                  min={0}
                />
              </div>
            </div>
            {/* collections */}
            <div className="flex gap-10">
              <div className="w-1/2">
                <label className="block font-semibold">Category:</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full border p-2"
                >
                  <option value="">Select a category</option>
                  {categories.map((category, index) => (
                    <option key={index} value={category._id}>
                      {category.categoryName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-1/2">
                <label className="block font-semibold">Subcategory:</label>
                <select
                  value={
                    productState.subCategoryID?._id || ""
                  }
                  onChange={(e) => updateFeild("subCategoryID", e.target.value)}
                  className="w-full border p-2"
                  disabled={!selectedCategory}
                >
                  <option value="">
                    {selectedCategory ? "Select a subcategory" : "Select a category first"}
                  </option>
                  {subCategories.map((subCategory, index) => (
                    <option key={index} value={subCategory._id}>
                      {subCategory.subCategoryName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* <div>
              <label className="block font-semibold">Season:</label>
              <div className="flex gap-4">
                <div className="flex gap-2">
                  <label className="block font-semibold">Summer</label>
                  <input
                    type="radio"
                    name="season"
                    value="summer"
                    checked={productState.season === "summer"}
                    onChange={(e) => updateFeild("season", e.target.value)}
                  ></input>
                </div>
                <div className="flex gap-2">
                  <label className="block font-semibold">Winter</label>
                  <input
                    type="radio"
                    name="season"
                    checked={productState.season === "winter"}
                    value="winter"
                    onChange={(e) => updateFeild("season", e.target.value)}
                  ></input>
                </div>
                <div className="flex gap-2">
                  <label className="block font-semibold">All</label>
                  <input
                    type="radio"
                    name="season"
                    checked={productState.season === "all"}
                    value="all"
                    onChange={(e) => updateFeild("season", e.target.value)}
                  ></input>
                </div>
              </div>
            </div> */}
            {/* Price */}
            <div className="flex gap-10">
              <div className="w-1/2">
                <label className="block font-semibold">Price :</label>
                <input
                  type="number"
                  value={productState.price.local}
                  onChange={(e) => {
                    const newPrice = {
                      ...productState.price,
                      local: parseFloat(e.target.value),
                    };
                    updateFeild("price", newPrice);
                  }}
                  className="w-full border p-2"
                />
              </div>

              {/* Compare Price */}
              <div className="w-1/2">
                <label className="block font-semibold">Compare Price:</label>
                <input
                  type="number"
                  value={productState.comparedPrice || ""}
                  onChange={(e) => {
                    updateFeild("comparedPrice", parseFloat(e.target.value));
                  }}
                  className="w-full border p-2"
                />
              </div>
            </div>

            {/* Variations */}
            <div>
              <label className="block font-semibold">Product Variants:</label>
              {productState.variations.map((variant, index) => (
                <ProductVariant
                  key={index}
                  index={index}
                  product={productState}
                  variant={variant}
                  updateVariant={updateVariant}
                  onVariantChange={updateVariant}
                  onDeleteVariant={deleteVariant}
                />
              ))}
              <button
                onClick={() =>
                  updateFeild("variations", [
                    ...productState.variations,
                    {
                      name: "",
                      attributeName: "",
                      attributes: [],
                      images: [],
                      mobImages: [],
                      price: 0,
                    },
                  ])
                }
                className="px-4 py-2 text-accent underline"
              >
                Add Variant
              </button>
            </div>

            {/* Product Details */}
            <div className="p-4 border border-gray-200 bg-gray-50/50 rounded-lg">
              <label className="block font-semibold mb-2">Product Details (English):</label>
              {(!productState.productDetails || productState.productDetails.length === 0) ? (
                <p className="text-sm text-gray-400 italic mb-2">No product details added yet.</p>
              ) : (
                (productState.productDetails || []).map((detail, index) => (
                  <div key={index} className="mb-2 flex items-center gap-2">
                    <input
                      type="text"
                      value={detail}
                      onChange={(e) => {
                        const newDetails = [...(productState.productDetails || [])];
                        newDetails[index] = e.target.value;
                        updateFeild("productDetails", newDetails);
                      }}
                      className="w-full border p-2 rounded bg-white text-sm"
                      placeholder="e.g. 100% Cotton Canvas"
                    />
                    <span
                      className="cursor-pointer text-red-500 font-bold px-1"
                      onClick={() => {
                        const newDetails = (productState.productDetails || []).filter(
                          (_, i) => i !== index,
                        );
                        updateFeild("productDetails", newDetails);
                      }}
                    >
                      &#10006;
                    </span>
                  </div>
                ))
              )}
              <button
                type="button"
                onClick={() =>
                  updateFeild("productDetails", [
                    ...(productState.productDetails || []),
                    "",
                  ])
                }
                className="px-4 py-2 text-accent underline text-sm font-medium"
              >
                + Add Detail (English)
              </button>
            </div>

            {/* Arabic Product Details */}
            <div className="mt-4 p-4 border border-amber-200 bg-amber-50/20 rounded-lg">
              <label className="block font-semibold mb-2 flex items-center justify-between">
                <span>Arabic Product Details:</span>
                <span className="text-xs text-primary font-normal">تفاصيل المنتج بالعربية</span>
              </label>
              {(productState.translations?.ar?.productDetails || []).map((detail, index) => (
                <div key={index} className="mb-2 flex items-center gap-2">
                  <input
                    type="text"
                    dir="rtl"
                    value={detail}
                    onChange={(e) => {
                      const newDetails = [...(productState.translations?.ar?.productDetails || [])];
                      newDetails[index] = e.target.value;
                      updateArabicField("productDetails", newDetails);
                    }}
                    className="w-full border border-amber-200 bg-white p-2 text-right rounded"
                    placeholder="تفصيل باللغة العربية"
                  />
                  <span
                    className="cursor-pointer text-red-500 font-bold px-1"
                    onClick={() => {
                      const newDetails = (productState.translations?.ar?.productDetails || []).filter(
                        (_, i) => i !== index,
                      );
                      updateArabicField("productDetails", newDetails);
                    }}
                  >
                    &#10006;
                  </span>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  updateArabicField("productDetails", [
                    ...(productState.translations?.ar?.productDetails || []),
                    "",
                  ])
                }
                className="px-4 py-2 text-accent underline text-sm"
              >
                + Add Arabic Detail / إضافة تفصيل بالعربية
              </button>
            </div>

            {/* Product Care */}
            {/* <div>
  <label className="block font-semibold">Product Care:</label>
  {product.productCare.map((care, index) => (
    <div key={index} className="flex items-center gap-2 mb-2">
      <input
        type="text"
        value={care}
        onChange={(e) => {
          const newCare = [...product.productCare];
          newCare[index] = e.target.value;
          updateFeild("productCare", newCare);
        }}
        className="border p-2 w-full"
      />
      <span 
        className="cursor-pointer text-red-500" 
        onClick={() => {
          const newCare = product.productCare.filter((_, i) => i !== index);
          updateFeild("productCare", newCare);
        }}
      >
        &#10006;
      </span>
    </div>
  ))}
  <button 
    onClick={() => updateFeild("productCare", [...product.productCare, ""])} 
    className="underline text-primary px-4 py-2"
  >
    Add More
  </button>
</div> */}
          </div>

          {/* Buttons */}
          <div className="flex w-full justify-end">
            <h3
              className="px-4 py-2 text-primary underline hover:cursor-pointer"
              onClick={() => setDeleteModalOpen(true)}
            >
              DELETE PRODUCT
            </h3>
            <DeleteProductModal
              setBigModal={setDetailsModal}
              productID={product._id}
              isModalOpen={isDeleteModalOpen}
              setModalOpen={setDeleteModalOpen}
              setProducts={setProducts}
            />
          </div>
          <div className="mt-6 flex justify-around">
            <button
              className="rounded-2xl border-[1px] bg-accent px-4 py-2 text-white"
              onClick={updateProduct}
            >
              Update
            </button>
          </div>
        </div>
      </div>
    )
  );
};
export default ProductModal;
