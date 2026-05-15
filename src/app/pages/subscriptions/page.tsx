"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Ipackage, Playlist, Product, Variant, attribute, CartItem as ICartItem } from "@/interfaces/interfaces";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import * as XLSX from "xlsx";
import { CldImage, CldUploadWidget } from "next-cloudinary";


interface Subscription {
  _id: string;
  paymentID: string;
  packageID: (Ipackage & { _id: string }) | null;
  email: string;
  subscribed: boolean;
  expiryDate: string;
  createdAt: string;
  redeemedLoyaltyPoints?: number;
  appliedDiscount?: string | { _id: string; code: string } | null;
  appliedDiscountAmount?: number;
  miniSubscriptionActivated?: boolean;
  allowedPlaylists?: {
    playlistID: { _id: string; title: string; thumbnailUrl: string } | string; // It could be string if not populated or object if populated
    expiryDate: string;
  }[];
  // User information
  firstName?: string;
  lastName?: string;
  phone?: string;
  whatsAppNumber?: string;
  // Gift information
  isGift?: boolean;
  giftRecipientEmail?: string;
  specialMessage?: string;
  giftCardName?: string;
  // Address information
  country?: string;
  address?: string;
  apartment?: string;
  city?: string;
  state?: string;
  postalZip?: string;
  // Billing information
  billingCountry?: string;
  billingFirstName?: string;
  billingLastName?: string;
  billingState?: string;
  billingAddress?: string;
  billingApartment?: string;
  billingPostalZip?: string;
  billingCity?: string;
  billingPhone?: string;
  // Payment information
  total?: number;
  subTotal?: number;
  shipping?: number;
  currency?: string;
  paymentMethod?: string;
  status?: string;
  instapayReciept?: string;
  cart?: ICartItem[];
}


const SubscriptionsPage = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [packages, setPackages] = useState<(Ipackage & { _id: string })[]>([]);
  const [allPlaylists, setAllPlaylists] = useState<Playlist[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [loading, setLoading] = useState(true);
  
  // New playlist form state
  const [newPlaylistId, setNewPlaylistId] = useState("");
  const [newPlaylistExpiry, setNewPlaylistExpiry] = useState("");
  
  const [modalType, setModalType] = useState<"add" | "edit" | "delete" | "view" | null>(
    null,
  );
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);
  const [search, setSearch] = useState("");
  const [discountSearch, setDiscountSearch] = useState("");
  // Filter states
  const [subscribedFilter, setSubscribedFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [packageFilter, setPackageFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [activeTab, setActiveTab] = useState<"all" | "mini" | "instapay" | "paymob">("all");


  const [miniActivationFilter, setMiniActivationFilter] = useState<string>("all");
  const [miniStats, setMiniStats] = useState({ total: 0, activated: 0 });
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Fixed items per page

  // Form state for add/edit
  const [form, setForm] = useState({
    paymentID: "",
    packageID: "",
    email: "",
    subscribed: false,
    expiryDate: "",
    miniSubscriptionActivated: false,
    // User information
    firstName: "",
    lastName: "",
    phone: "",
    whatsAppNumber: "",
    // Gift information
    isGift: false,
    giftRecipientEmail: "",
    specialMessage: "",
    giftCardName: "",
    // Address information
    country: "",
    address: "",
    apartment: "",
    city: "",
    state: "",
    postalZip: "",
    // Billing information
    billingCountry: "",
    billingFirstName: "",
    billingLastName: "",
    billingState: "",
    billingAddress: "",
    billingApartment: "",
    billingPostalZip: "",
    billingCity: "",
    billingPhone: "",
    // Payment information
    total: 0,
    subTotal: 0,
    shipping: 0,
    currency: "",
    redeemedLoyaltyPoints: 0,
    appliedDiscount: "",
    appliedDiscountAmount: 0,
    allowedPlaylists: [] as any[],
    instapayReciept: "",
    status: "pending",
    cart: [] as ICartItem[],
  });

  // Calculate totals whenever cart or package or discount/shipping changes
  useEffect(() => {
    if (modalType !== "edit" && modalType !== "add") return;

    const selectedPkg = packages.find(p => p._id === form.packageID);
    const packagePrice = selectedPkg ? selectedPkg.price : 0;
    
    const cartTotal = form.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const newSubTotal = packagePrice + cartTotal;
    const newTotal = newSubTotal + (Number(form.shipping) || 0) - (Number(form.appliedDiscountAmount) || 0);

    // Only update if values actually changed to avoid infinite loop
    if (newSubTotal !== form.subTotal || newTotal !== form.total) {
      setForm(f => ({
        ...f,
        subTotal: newSubTotal,
        total: newTotal
      }));
    }
  }, [form.cart, form.packageID, form.shipping, form.appliedDiscountAmount, modalType, packages]);

  useEffect(() => {
    fetchPackages();
    fetchPlaylists();
    fetchProducts();
    // fetchSubscriptions(); // Initial fetch handled by the other useEffect
  }, []);

  useEffect(() => {
    fetchSubscriptions();
    if (activeTab === "mini") {
      fetchMiniStats();
    }
    setCurrentPage(1); // Reset to first page when filters change
  }, [subscribedFilter, typeFilter, packageFilter, statusFilter, activeTab, miniActivationFilter]);

  // Pagination logic
  const filteredSubscriptions = subscriptions.filter(
    (s) =>
      (s.email?.toLowerCase().includes(search.toLowerCase()) ||
        s.paymentID?.toLowerCase().includes(search.toLowerCase()) ||
        (s.firstName &&
          s.firstName.toLowerCase().includes(search.toLowerCase())) ||
        (s.lastName &&
          s.lastName.toLowerCase().includes(search.toLowerCase()))) &&
      (discountSearch === "" ||
        (typeof s.appliedDiscount === "object" &&
          s.appliedDiscount?.code?.toLowerCase() ===
            discountSearch.toLowerCase())) &&
      (activeTab !== "paymob" || s.paymentMethod !== "instapay"),
  );

  const totalPages = Math.ceil(filteredSubscriptions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSubscriptions = filteredSubscriptions.slice(
    startIndex,
    endIndex,
  );

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, discountSearch]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      let params: any = {};
      if (subscribedFilter !== "all") params.subscribed = subscribedFilter;
      if (typeFilter !== "all") params.type = typeFilter;
      if (packageFilter !== "all") params.packageID = packageFilter;
      if (statusFilter !== "all") params.status = statusFilter;
      
      if (activeTab === "mini") {
        params.startDate = "2026-02-01";
        params.isMini = "true";
        if (miniActivationFilter !== "all") {
          params.miniSubscriptionActivated = miniActivationFilter;
        }
      }

      if (activeTab === "instapay") {
        params.paymentMethod = "instapay";
      }

      if (activeTab === "paymob") {
        params.paymentMethod = "paymob";
      }



      const query = new URLSearchParams(params).toString();
      const res = await axios.get(
        `/api/subscriptions${query ? `?${query}` : ""}`,
      );
      setSubscriptions(res.data.data || []);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMiniStats = async () => {
    try {
      // Fetch all mini subscriptions since Feb 1st 2026 to calculate stats
      const params = { startDate: "2026-02-01", isMini: "true" };
      const query = new URLSearchParams(params).toString();
      const res = await axios.get(`/api/subscriptions?${query}`);
      const data: Subscription[] = res.data.data || [];
      
      const total = data.length;
      const activated = data.filter(s => s.miniSubscriptionActivated).length;
      
      setMiniStats({ total, activated });
    } catch (error) {
      console.error("Error fetching mini stats:", error);
    }
  };

  const fetchPackages = async () => {
    try {
      const res = await axios.get("/api/packages?all=true");
      setPackages(res.data.data || []);
    } catch (error) {
      console.error("Error fetching packages:", error);
    }
  };

  const fetchPlaylists = async () => {
    try {
      const res = await axios.get("/api/playlists?all=true");
      setAllPlaylists(res.data.data || []);
    } catch (error) {
      console.error("Error fetching playlists:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get("/api/products?all=true");
      setAllProducts(res.data.data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleAddPlaylist = () => {
    if (!newPlaylistId || !newPlaylistExpiry) return;
    const playlistToAdd = allPlaylists.find(p => p._id === newPlaylistId);
    if (!playlistToAdd) return;

    setForm(f => ({
      ...f,
      allowedPlaylists: [
        ...f.allowedPlaylists,
        {
          playlistID: playlistToAdd, // Store full object for UI
          expiryDate: newPlaylistExpiry
        }
      ]
    }));
    setNewPlaylistId("");
    setNewPlaylistExpiry("");
  };

  const handleRemovePlaylist = (index: number) => {
    setForm(f => ({
      ...f,
      allowedPlaylists: f.allowedPlaylists.filter((_, i) => i !== index)
    }));
  };

  const handleAddToCart = (product: Product) => {
    // Basic check if already in cart
    const existingIndex = form.cart.findIndex(item => item.productId === product._id);
    if (existingIndex > -1) {
      handleUpdateCartQuantity(existingIndex, form.cart[existingIndex].quantity + 1);
      return;
    }

    const newItem: ICartItem = {
      productId: product._id,
      productName: product.title,
      price: product.price.local, // Using local price
      quantity: 1,
      imageUrl: product.variations?.[0]?.images?.[0]?.url || "",
      attributes: product.variations?.[0]?.attributes?.[0] as any, // Default first attribute
      variant: product.variations?.[0] as any, // Default first variant
    };

    setForm(f => ({
      ...f,
      cart: [...f.cart, newItem]
    }));
  };

  const handleRemoveCartItem = (index: number) => {
    setForm(f => ({
      ...f,
      cart: f.cart.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateCartQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;
    setForm(f => {
      const newCart = [...f.cart];
      newCart[index] = { ...newCart[index], quantity };
      return { ...f, cart: newCart };
    });
  };

  const exportToExcel = () => {
    const dataToExport = filteredSubscriptions.map((sub) => ({
      "Payment ID": sub.paymentID,
      Email: sub.email,
      Package: sub.packageID?.name || "",
      Subscribed: sub.subscribed ? "Yes" : "No",
      "Expiry Date": sub.expiryDate,
      "Created At": sub.createdAt,
      "First Name": sub.firstName || "",
      "Last Name": sub.lastName || "",
      Phone: sub.phone || "",
      "WhatsApp Number": sub.whatsAppNumber || "",
      "Is Gift": sub.isGift ? "Yes" : "No",
      "Gift Recipient Email": sub.giftRecipientEmail || "",
      "Gift Card Name": sub.giftCardName || "",
      "Special Message": sub.specialMessage || "",
      Country: sub.country || "",
      Address: sub.address || "",
      Apartment: sub.apartment || "",
      City: sub.city || "",
      State: sub.state || "",
      "Postal/Zip": sub.postalZip || "",
      "Billing Country": sub.billingCountry || "",
      "Billing First Name": sub.billingFirstName || "",
      "Billing Last Name": sub.billingLastName || "",
      "Billing State": sub.billingState || "",
      "Billing Address": sub.billingAddress || "",
      "Billing Apartment": sub.billingApartment || "",
      "Billing Postal/Zip": sub.billingPostalZip || "",
      "Billing City": sub.billingCity || "",
      "Billing Phone": sub.billingPhone || "",
      Total: sub.total || 0,
      SubTotal: sub.subTotal || 0,
      Shipping: sub.shipping || 0,
      Currency: sub.currency || "",
      "Redeemed Loyalty Points": sub.redeemedLoyaltyPoints || 0,
      "Applied Discount Code":
        typeof sub.appliedDiscount === "object" && sub.appliedDiscount !== null
          ? sub.appliedDiscount.code
          : sub.appliedDiscount || "",
      "Applied Discount Amount": sub.appliedDiscountAmount || 0,
      "Shipment Status": sub.status || "pending",
      "Bundled Items": sub.cart?.map(i => `${i.productName} (x${i.quantity})`).join(", ") || "None",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Subscriptions");
    XLSX.writeFile(workbook, "subscriptions_export.xlsx");
  };

  const openModal = (
    type: "add" | "edit" | "delete" | "view",
    subscription?: Subscription,
  ) => {
    setModalType(type);
    setSelectedSubscription(subscription || null);
    setNewPlaylistId("");
    setNewPlaylistExpiry("");
    if (type === "edit" && subscription) {
      setForm({
        paymentID: subscription.paymentID,
        packageID: subscription.packageID?._id || "",
        email: subscription.email,
        subscribed: subscription.subscribed,
        expiryDate: subscription.expiryDate?.slice(0, 10) || "",
        miniSubscriptionActivated: subscription.miniSubscriptionActivated || false,
        allowedPlaylists: subscription.allowedPlaylists || [],
        // User information
        firstName: subscription.firstName || "",
        lastName: subscription.lastName || "",
        phone: subscription.phone || "",
        whatsAppNumber: subscription.whatsAppNumber || "",
        // Gift information
        isGift: subscription.isGift || false,
        giftRecipientEmail: subscription.giftRecipientEmail || "",
        specialMessage: subscription.specialMessage || "",
        giftCardName: subscription.giftCardName || "",
        // Address information
        country: subscription.country || "",
        address: subscription.address || "",
        apartment: subscription.apartment || "",
        city: subscription.city || "",
        state: subscription.state || "",
        postalZip: subscription.postalZip || "",
        // Billing information
        billingCountry: subscription.billingCountry || "",
        billingFirstName: subscription.billingFirstName || "",
        billingLastName: subscription.billingLastName || "",
        billingState: subscription.billingState || "",
        billingAddress: subscription.billingAddress || "",
        billingApartment: subscription.billingApartment || "",
        billingPostalZip: subscription.billingPostalZip || "",
        billingCity: subscription.billingCity || "",
        billingPhone: subscription.billingPhone || "",
        // Payment information
        total: subscription.total || 0,
        subTotal: subscription.subTotal || 0,
        shipping: subscription.shipping || 0,
        currency: subscription.currency || "",
        redeemedLoyaltyPoints: subscription.redeemedLoyaltyPoints || 0,
        appliedDiscount:
          typeof subscription.appliedDiscount === "object" &&
          subscription.appliedDiscount !== null
            ? subscription.appliedDiscount.code
            : subscription.appliedDiscount || "",
        appliedDiscountAmount: subscription.appliedDiscountAmount || 0,
        instapayReciept: subscription.instapayReciept || "",
        status: subscription.status || "pending",
        cart: subscription.cart || [],
      });

    } else if (type === "add") {
      setForm({
        paymentID: "",
        packageID: "",
        email: "",
        subscribed: false,
        expiryDate: "",
        miniSubscriptionActivated: false,
        allowedPlaylists: [],
        // User information
        firstName: "",
        lastName: "",
        phone: "",
        whatsAppNumber: "",
        // Gift information
        isGift: false,
        giftRecipientEmail: "",
        specialMessage: "",
        giftCardName: "",
        // Address information
        country: "",
        address: "",
        apartment: "",
        city: "",
        state: "",
        postalZip: "",
        // Billing information
        billingCountry: "",
        billingFirstName: "",
        billingLastName: "",
        billingState: "",
        billingAddress: "",
        billingApartment: "",
        billingPostalZip: "",
        billingCity: "",
        billingPhone: "",
        // Payment information
        total: 0,
        subTotal: 0,
        shipping: 0,
        currency: "",
        redeemedLoyaltyPoints: 0,
        appliedDiscount: "",
        appliedDiscountAmount: 0,
        instapayReciept: "",
        status: "pending",
        cart: [],
      });

    }
  };

  const closeModal = (e?: React.MouseEvent) => {
    // If the click event exists and the target is the same as the currentTarget (the overlay),
    // or if no event was passed (called directly), close the modal
    if (!e || e.target === e.currentTarget) {
      setModalType(null);
      setSelectedSubscription(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedSubscription) return;
    try {
      await axios.delete(
        `/api/subscriptions?subscriptionID=${selectedSubscription._id}`,
      );
      closeModal();
      fetchSubscriptions();
    } catch (error) {
      console.error("Error deleting subscription:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Prepare payload to ensure only IDs are sent for allowedPlaylists
      const payload = {
        ...form,
        allowedPlaylists: form.allowedPlaylists.map((item: any) => ({
          playlistID: item.playlistID._id || item.playlistID,
          expiryDate: item.expiryDate,
        })),
      };

      if (modalType === "add") {
        await axios.post("/api/subscriptions", payload);
      } else if (modalType === "edit" && selectedSubscription) {
        await axios.put(
          `/api/subscriptions?subscriptionID=${selectedSubscription._id}`,
          payload,
        );
      }
      closeModal();
      fetchSubscriptions();
    } catch (error) {
      console.error("Error saving subscription:", error);
    }
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleApproveInstapay = async (paymentID: string) => {
    setApprovingId(paymentID);
    try {
const response = await axios.get(
  `${process.env.NEXT_PUBLIC_BASE_URL}/api/callback?success=true&order=${paymentID}&json=true`
);

      console.log("response", response);
      if (response.status === 200) {
        alert("Payment approved successfully!");
        fetchSubscriptions();
      } else {
        alert("Failed to approve payment. Status code: " + response.status);
      }
    } catch (error: any) {
      console.error("Error approving instapay payment:", error);
      alert(
        "An error occurred while approving the payment: " +
          (error.response?.data?.message || error.message),
      );
    } finally {
      setApprovingId(null);
    }
  };

  const handleStatusChange = async (subscriptionID: string, newStatus: string) => {
    try {
      await axios.put(`/api/subscriptions?subscriptionID=${subscriptionID}`, {
        status: newStatus,
      });
      fetchSubscriptions();
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };

  return (
    <DefaultLayout>
      <div className="flex min-h-[calc(100vh-124px)] w-full flex-col items-center p-4">
        {/* Tabs */}
        <div className="mb-6 flex w-full space-x-4 border-b">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 font-medium ${
              activeTab === "all"
                ? "border-b-2 border-primary text-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            All Subscriptions
          </button>
          <button
            onClick={() => setActiveTab("mini")}
            className={`px-4 py-2 font-medium ${
              activeTab === "mini"
                ? "border-b-2 border-primary text-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Mini Experience (activation analytics)
          </button>
          <button
            onClick={() => setActiveTab("paymob")}
            className={`px-4 py-2 font-medium ${
              activeTab === "paymob"
                ? "border-b-2 border-primary text-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Paymob Logs
          </button>
          <button
            onClick={() => setActiveTab("instapay")}
            className={`px-4 py-2 font-medium relative ${
              activeTab === "instapay"
                ? "border-b-2 border-primary text-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Instapay Requests
            {subscriptions.filter(s => s.paymentMethod === "instapay" && s.status !== "confirmed").length > 0 && activeTab !== "instapay" && (
              <span className="absolute top-1 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            )}
          </button>
        </div>



        {/* Insights for Mini Experience */}
        {activeTab === "mini" && (
          <div className="mb-6 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">
                Total Mini Subscriptions
              </h3>
              <p className="mt-1 text-2xl font-semibold">{miniStats.total}</p>
              <p className="text-xs text-gray-400">Since Feb 1st, 2026</p>
            </div>
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">
                Activated Mini Subscriptions
              </h3>
              <p className="mt-1 text-2xl font-semibold text-green-600">
                {miniStats.activated}
              </p>
              <p className="text-xs text-gray-400">
                {miniStats.total > 0
                  ? `${Math.round((miniStats.activated / miniStats.total) * 100)}% Activation Rate`
                  : "0% Activation Rate"}
              </p>
            </div>
          </div>
        )}

        <div className="mb-4 flex w-full flex-wrap items-center justify-between gap-4">
          <div className="grid grid-cols-2 items-center gap-2 lg:grid-cols-3 2xl:grid-cols-5">
            <input
              type="text"
              placeholder="Search by email or paymentID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 rounded border p-2"
            />

            <select
              value={subscribedFilter}
              onChange={(e) => setSubscribedFilter(e.target.value)}
              className="rounded border p-2"
            >
              <option value="all">All Status</option>
              <option value="true">Paid</option>
              <option value="false">Unpaid/Failed</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded border p-2"
            >
              <option value="all">All Types</option>
              <option value="real">Real</option>
              <option value="gift">Free</option>
            </select>
            <select
              value={packageFilter}
              onChange={(e) => setPackageFilter(e.target.value)}
              className="rounded border p-2"
            >
              <option value="all">All Packages</option>
              {packages.map((pkg) => (
                <option key={pkg._id} value={pkg._id}>
                  {pkg.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded border p-2"
            >
              <option value="all">All Shipment Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="returned">Returned</option>
            </select>

            {/* Mini Activation Filter */}
            {activeTab === "mini" && (
              <select
                value={miniActivationFilter}
                onChange={(e) => setMiniActivationFilter(e.target.value)}
                className="rounded border p-2 border-blue-500"
              >
                <option value="all">All Activation Status</option>
                <option value="true">Activated</option>
                <option value="false">Not Activated</option>
              </select>
            )}

            <input
              type="text"
              placeholder="Search by discount code..."
              value={discountSearch}
              onChange={(e) => setDiscountSearch(e.target.value)}
              className="w-64 rounded border p-2"
            />
            
          </div>
          <div className="flex gap-2">
            <button
              className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
              onClick={exportToExcel}
            >
              Export to Excel
            </button>
            <button
              className="rounded bg-primary px-4 py-2 text-white"
              onClick={() => openModal("add")}
            >
              Add Subscription
            </button>
          </div>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="w-full border text-left">
            <thead className="bg-secondary text-white">
              <tr>
                <th className="border p-2">#</th>
                <th className="border p-2">Email</th>
                <th className="border p-2">Name</th>
                <th className="border p-2">Payment ID</th>
                <th className="border p-2">Package</th>
                {/* <th className="p-2 border">Total</th> */}
                               {activeTab !== "paymob" && activeTab !== "instapay" && (
                <th className="border p-2">Paid</th>
                )}
                <th className="border p-2">Gift</th>
              
                {activeTab !== "paymob" && activeTab !== "instapay" && (
                  <th className="border p-2">Expiry</th>
                )}
                {activeTab === "instapay" && <th className="border p-2">Receipt</th>}
                <th className="border p-2">Shipment</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>

            <tbody className="bg-white">
              {loading ? (
                <tr>
                  <td colSpan={9} className="border p-8 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
                                     {activeTab !== "paymob" && activeTab !== "instapay" ? (
                      <p className="text-gray-600">Loading subscriptions...</p>
                                     ) : (
                                      <p className="text-gray-600">Loading logs...</p>
                                     ) }
                    </div>
                  </td>
                </tr>
              ) : paginatedSubscriptions.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="border p-8 text-center text-gray-500"
                  >
                    No subscriptions found
                  </td>
                </tr>
              ) : (
                paginatedSubscriptions.map((sub, idx) => (
                  <tr 
                    key={sub._id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => openModal("view", sub)}
                  >
                    <td className="border p-2">{startIndex + idx + 1}</td>
                    <td className="border p-2">{sub.email || "-"}</td>
                    <td className="border p-2">
                      {`${sub.firstName || ""} ${sub.lastName || ""}`.trim() ||
                        "-"}
                    </td>
                    <td className="border p-2">{sub.paymentID}</td>
                    <td className="border p-2">
                      {sub.packageID ? sub.packageID.name : "-"}
                    </td>
                    {/* <td className="p-2 border">{sub.total ? `${sub.currency || ""} ${sub.total.toFixed(2)}` : "-"}</td> */}
                                       {activeTab !== "paymob" && activeTab !== "instapay" && (

                    <td className="border p-2">
                      {sub.subscribed ? "Yes" : "No"}
                    </td>)}
                    <td className="border p-2">{sub.isGift ? "Yes" : "No"}</td>
                    {activeTab !== "paymob" && activeTab !== "instapay" && (
                      <td className="border p-2">
                        {sub.expiryDate
                          ? new Date(sub.expiryDate).toLocaleDateString()
                          : "-"}
                      </td>
                    )}
                    {activeTab === "instapay" && (
                      <td className="border p-2">
                        {sub.instapayReciept ? (
                          <a 
                            href={sub.instapayReciept} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary underline flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View Receipt
                          </a>
                        ) : (
                        <span className="text-gray-400 italic">No receipt</span>
                      )}
                    </td>
                  )}
                  <td className="border p-2" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={sub.status || "pending"}
                      onChange={(e) => handleStatusChange(sub._id, e.target.value)}
                      className={`rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset cursor-pointer focus:outline-none ${
                        sub.status === "delivered" ? "bg-green-50 text-green-700 ring-green-600/20" :
                        sub.status === "shipped" ? "bg-blue-50 text-blue-700 ring-blue-600/20" :
                        sub.status === "confirmed" ? "bg-purple-50 text-purple-700 ring-purple-600/20" :
                        sub.status === "cancelled" || sub.status === "returned" ? "bg-red-50 text-red-700 ring-red-600/20" :
                        "bg-yellow-50 text-yellow-700 ring-yellow-600/20"
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="returned">Returned</option>
                    </select>
                    {sub.cart && sub.cart.length > 0 && (
                      <span className="ml-1 text-[10px] text-primary font-bold block mt-1">
                        +{sub.cart.length} items
                      </span>
                    )}
                  </td>
                  <td className="space-x-2 border p-2" onClick={(e) => e.stopPropagation()}>

                      <button
                        onClick={() => openModal("edit", sub)}
                        className="text-blue-600 underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openModal("delete", sub)}
                        className="text-red-600 underline"
                      >
                        Delete
                      </button>
                      {/* Debug info: showing status */}
                      <span className="text-xs text-gray-400">({sub.status || "undefined"})</span>
                      {sub.status !== "confirmed" && (
                        <button
                          disabled={approvingId === sub.paymentID}
                          onClick={() => handleApproveInstapay(sub.paymentID)}
                          className={`ml-2 rounded mt-2 px-3 py-1 text-xs font-semibold text-white shadow-sm bg-secondary transition-all active:scale-95 disabled:opacity-50 ${
                            approvingId === sub.paymentID
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
                          }`}
                        >
                          {approvingId === sub.paymentID ? "..." : "Approve"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to{" "}
              {Math.min(
                startIndex + itemsPerPage,
                filteredSubscriptions.length,
              )}{" "}
              of {filteredSubscriptions.length} results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="rounded border px-3 py-1 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              {/* Page numbers */}
              <div className="flex space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => {
                    // Show first page, last page, current page, and pages around current page
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`rounded px-3 py-1 text-sm ${
                            currentPage === page
                              ? "bg-blue-500 text-white"
                              : "border hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <span key={page} className="px-2 text-sm text-gray-500">
                          ...
                        </span>
                      );
                    }
                    return null;
                  },
                )}
              </div>

              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="rounded border px-3 py-1 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Modal for Add/Edit */}
        {(modalType === "add" || modalType === "edit") && (
          <div
            onClick={closeModal}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 md:pl-72.5"
          >
            <div className="max-h-[90vh] w-[800px] overflow-y-auto rounded-lg bg-white p-6">
              <h2 className="mb-4 text-xl font-bold">
                {modalType === "add" ? "Add Subscription" : "Edit Subscription"}
              </h2>
              <form
                onSubmit={handleSubmit}
                className="max-h-[80vh] space-y-4 overflow-y-auto p-2"
              >
                <h3 className="text-lg font-medium">Basic Information</h3>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value.toLowerCase() }))
                    }
                    required
                    className="w-full lowercase rounded border p-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Payment ID
                  </label>
                  <input
                    type="text"
                    value={form.paymentID}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, paymentID: e.target.value }))
                    }
                    required
                    className="w-full rounded border p-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Instapay Receipt
                  </label>
                  <div className="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed border-gray-300 p-4">
                    {form.instapayReciept ? (
                      <div className="relative h-48 w-full overflow-hidden rounded-lg">
                        <CldImage
                          width="400"
                          height="300"
                          src={form.instapayReciept}
                          alt="Instapay Receipt"
                          className="h-full w-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, instapayReciept: "" })}
                          className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="flex h-48 w-full items-center justify-center bg-gray-50 text-gray-400 text-sm">
                        No receipt uploaded
                      </div>
                    )}
                    <CldUploadWidget
                      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                      onSuccess={(result: any) => {
                        setForm({ ...form, instapayReciept: result.info.secure_url });
                      }}
                    >
                      {({ open }) => (
                        <button
                          type="button"
                          onClick={() => open()}
                          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-opacity-90"
                        >
                          {form.instapayReciept ? "Change Receipt" : "Upload Receipt"}
                        </button>
                      )}
                    </CldUploadWidget>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Package
                  </label>

                  <select
                    value={form.packageID}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, packageID: e.target.value }))
                    }
                    required
                    className="w-full rounded border p-2"
                  >
                    <option value="">Select a package</option>
                    {packages.map((pkg) => (
                      <option key={pkg._id} value={pkg._id}>
                        {pkg.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Paid</label>
                  <select
                    value={form.subscribed ? "true" : "false"}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        subscribed: e.target.value === "true",
                      }))
                    }
                    className="w-full rounded border p-2"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Mini Subscription Activated</label>
                  <select
                    value={form.miniSubscriptionActivated ? "true" : "false"}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        miniSubscriptionActivated: e.target.value === "true",
                      }))
                    }
                    className="w-full rounded border p-2"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                {activeTab !== "paymob" && activeTab !== "instapay" && (
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={form.expiryDate}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, expiryDate: e.target.value }))
                      }
                      className="w-full rounded border p-2"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Shipment Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, status: e.target.value }))
                    }
                    className="w-full rounded border p-2"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="returned">Returned</option>
                  </select>
                </div>

                <div className="col-span-1 md:col-span-2 border p-4 rounded-lg bg-gray-50">
                  <h3 className="text-lg font-medium mb-2">Allowed Playlists</h3>
                  
                  {/* List of allowed playlists */}
                  <div className="space-y-3 mb-4">
                    {form.allowedPlaylists.map((playlist: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between border p-2 rounded bg-white shadow-sm">
                        <div className="flex items-center gap-3">
                          <img 
                            src={playlist.playlistID?.thumbnailUrl} 
                            alt={playlist.playlistID?.title || "Playlist"}
                            className="w-16 h-10 object-cover rounded"
                          />
                          <div>
                            <p className="font-medium text-sm">{playlist.playlistID?.title || "Unknown Playlist"}</p>
                            <p className="text-xs text-gray-500">Expires: {playlist.expiryDate ? new Date(playlist.expiryDate).toLocaleDateString() : ""}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePlaylist(idx)}
                          className="text-red-600 hover:text-red-800 text-sm px-2 py-1"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {form.allowedPlaylists.length === 0 && (
                      <p className="text-sm text-gray-500 italic">No playlists allowed specifically.</p>
                    )}
                  </div>

                  {/* Add new playlist */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end border-t pt-3 mt-2">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Select Playlist</label>
                      <select
                        value={newPlaylistId}
                        onChange={(e) => setNewPlaylistId(e.target.value)}
                        className="w-full rounded border p-1 text-sm"
                      >
                        <option value="">Select playlist...</option>
                        {allPlaylists
                          .filter(p => !form.allowedPlaylists.some((ap: any) => (ap.playlistID._id || ap.playlistID) === p._id))
                          .map(p => (
                            <option key={p._id} value={p._id}>{p.title}</option>
                          ))
                        }
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Expiry Date</label>
                      <input
                        type="date"
                        value={newPlaylistExpiry}
                        onChange={(e) => setNewPlaylistExpiry(e.target.value)}
                        className="w-full rounded border p-1 text-sm"
                      />
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={handleAddPlaylist}
                        disabled={!newPlaylistId || !newPlaylistExpiry}
                        className="w-full bg-blue-600 text-white rounded p-1 text-sm hover:bg-blue-700 disabled:bg-blue-300"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2 border p-4 rounded-lg bg-gray-50">
                  <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 100-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                    </svg>
                    Cart Items (Bundled Products)
                  </h3>
                  
                  {/* List of cart items */}
                  <div className="space-y-3 mb-4">
                    {form.cart.map((item: ICartItem, idx: number) => (
                      <div key={idx} className="flex items-center justify-between border p-3 rounded bg-white shadow-sm">
                        <div className="flex items-center gap-3">
                          <img 
                            src={item.imageUrl} 
                            alt={item.productName}
                            className="w-12 h-12 object-cover rounded border"
                          />
                          <div>
                            <p className="font-medium text-sm">{item.productName}</p>
                            <p className="text-xs text-gray-500">{form.currency} {item.price}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center border rounded">
                            <button 
                              type="button"
                              onClick={() => handleUpdateCartQuantity(idx, item.quantity - 1)}
                              className="px-2 py-1 bg-gray-100 hover:bg-gray-200"
                            >-</button>
                            <span className="px-3 text-sm">{item.quantity}</span>
                            <button 
                              type="button"
                              onClick={() => handleUpdateCartQuantity(idx, item.quantity + 1)}
                              className="px-2 py-1 bg-gray-100 hover:bg-gray-200"
                            >+</button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveCartItem(idx)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                    {form.cart.length === 0 && (
                      <p className="text-sm text-gray-500 italic text-center py-4 bg-white rounded border border-dashed">No products bundled with this subscription.</p>
                    )}
                  </div>

                  {/* Add product search */}
                  <div className="relative mt-4 pt-4 border-t">
                    <label className="block text-xs font-medium text-gray-700 mb-2">Search & Add Product</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type product name..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="flex-1 rounded border p-2 text-sm"
                      />
                    </div>
                    
                    {/* Search Results Dropdown */}
                    {productSearch.length > 1 && (
                      <div className="absolute left-0 right-0 z-10 mt-1 max-h-60 overflow-y-auto rounded-md border bg-white shadow-lg">
                        {allProducts
                          .filter(p => p.title.toLowerCase().includes(productSearch.toLowerCase()))
                          .map(p => (
                            <div 
                              key={p._id} 
                              onClick={() => {
                                handleAddToCart(p);
                                setProductSearch("");
                              }}
                              className="flex items-center gap-3 p-2 hover:bg-gray-100 cursor-pointer border-b last:border-0"
                            >
                              <img 
                                src={p.variations?.[0]?.images?.[0]?.url} 
                                alt={p.title} 
                                className="w-10 h-10 object-cover rounded"
                              />
                              <div>
                                <p className="text-sm font-medium">{p.title}</p>
                                <p className="text-xs text-gray-500">{form.currency} {p.price.local}</p>
                              </div>
                            </div>
                          ))
                        }
                        {allProducts.filter(p => p.title.toLowerCase().includes(productSearch.toLowerCase())).length === 0 && (
                          <p className="p-3 text-sm text-gray-500 italic">No products found.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <h3 className="mt-6 text-lg font-medium">User Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, firstName: e.target.value }))
                      }
                      className="w-full rounded border p-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, lastName: e.target.value }))
                      }
                      className="w-full rounded border p-2"
                    />
                  </div>
                </div>
                <h3 className="mt-6 text-lg font-medium">Gift Information</h3>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Gifted
                  </label>
                  <select
                    value={form.isGift ? "true" : "false"}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        isGift: e.target.value === "true",
                      }))
                    }
                    className="w-full rounded border p-2"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Gift Card Name
                  </label>
                  <input
                    type="text"
                    value={form.giftCardName || ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        giftCardName: e.target.value,
                      }))
                    }
                    className="w-full rounded border p-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Gift Recipient Email
                  </label>
                  <input
                    type="email"
                    value={form.giftRecipientEmail}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        giftRecipientEmail: e.target.value.toLowerCase(),
                      }))
                    }
                    className="w-full lowercase rounded border p-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Special Message
                  </label>
                  <textarea
                    value={form.specialMessage}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, specialMessage: e.target.value }))
                    }
                    className="w-full rounded border p-2"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, phone: e.target.value }))
                      }
                      className="w-full rounded border p-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      WhatsApp Number
                    </label>
                    <input
                      type="text"
                      value={form.whatsAppNumber}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          whatsAppNumber: e.target.value,
                        }))
                      }
                      className="w-full rounded border p-2"
                    />
                  </div>
                </div>

                <h3 className="mt-6 text-lg font-medium">
                  Address Information
                </h3>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Country
                  </label>
                  <input
                    type="text"
                    value={form.country}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, country: e.target.value }))
                    }
                    className="w-full rounded border p-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Address
                  </label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, address: e.target.value }))
                    }
                    className="w-full rounded border p-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Apartment
                  </label>
                  <input
                    type="text"
                    value={form.apartment}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, apartment: e.target.value }))
                    }
                    className="w-full rounded border p-2"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      City
                    </label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, city: e.target.value }))
                      }
                      className="w-full rounded border p-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      State
                    </label>
                    <input
                      type="text"
                      value={form.state}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, state: e.target.value }))
                      }
                      className="w-full rounded border p-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Postal/Zip
                    </label>
                    <input
                      type="text"
                      value={form.postalZip}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, postalZip: e.target.value }))
                      }
                      className="w-full rounded border p-2"
                    />
                  </div>
                </div>

                <h3 className="mt-6 text-lg font-medium">
                  Billing Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Billing First Name
                    </label>
                    <input
                      type="text"
                      value={form.billingFirstName}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          billingFirstName: e.target.value,
                        }))
                      }
                      className="w-full rounded border p-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Billing Last Name
                    </label>
                    <input
                      type="text"
                      value={form.billingLastName}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          billingLastName: e.target.value,
                        }))
                      }
                      className="w-full rounded border p-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Billing Country
                  </label>
                  <input
                    type="text"
                    value={form.billingCountry}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, billingCountry: e.target.value }))
                    }
                    className="w-full rounded border p-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Billing Address
                  </label>
                  <input
                    type="text"
                    value={form.billingAddress}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, billingAddress: e.target.value }))
                    }
                    className="w-full rounded border p-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Billing Apartment
                  </label>
                  <input
                    type="text"
                    value={form.billingApartment}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        billingApartment: e.target.value,
                      }))
                    }
                    className="w-full rounded border p-2"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Billing City
                    </label>
                    <input
                      type="text"
                      value={form.billingCity}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, billingCity: e.target.value }))
                      }
                      className="w-full rounded border p-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Billing State
                    </label>
                    <input
                      type="text"
                      value={form.billingState}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, billingState: e.target.value }))
                      }
                      className="w-full rounded border p-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Billing Postal/Zip
                    </label>
                    <input
                      type="text"
                      value={form.billingPostalZip}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          billingPostalZip: e.target.value,
                        }))
                      }
                      className="w-full rounded border p-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Billing Phone
                  </label>
                  <input
                    type="text"
                    value={form.billingPhone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, billingPhone: e.target.value }))
                    }
                    className="w-full rounded border p-2"
                  />
                </div>

                <h3 className="mt-6 text-lg font-medium">
                  Payment Information
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Total
                    </label>
                    <input
                      type="number"
                      value={form.total}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          total: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full rounded border p-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Subtotal
                    </label>
                    <input
                      type="number"
                      value={form.subTotal}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          subTotal: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full rounded border p-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Shipping
                    </label>
                    <input
                      type="number"
                      value={form.shipping}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          shipping: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full rounded border p-2"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Currency
                    </label>
                    <input
                      type="text"
                      value={form.currency}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, currency: e.target.value }))
                      }
                      className="w-full rounded border p-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Redeemed Loyalty Points
                    </label>
                    <input
                      type="number"
                      value={form.redeemedLoyaltyPoints}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          redeemedLoyaltyPoints: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="w-full rounded border p-2"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Applied Discount
                    </label>
                    <input
                      type="text"
                      value={form.appliedDiscount}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          appliedDiscount: e.target.value,
                        }))
                      }
                      className="w-full rounded border p-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Discount Amount
                    </label>
                    <input
                      type="number"
                      value={form.appliedDiscountAmount}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          appliedDiscountAmount:
                            parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full rounded border p-2"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-primary px-4 py-2 text-white"
                  >
                    {modalType === "add" ? "Add" : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete confirmation */}
        {modalType === "delete" && selectedSubscription && (
          <div
            onClick={closeModal}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          >
            <div className="w-96 rounded-lg bg-white p-6">
              <h2 className="mb-4 text-xl font-bold">Delete Subscription</h2>
              <p>Are you sure you want to delete this subscription?</p>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="rounded bg-red-600 px-4 py-2 text-white"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Modal */}
        {modalType === "view" && selectedSubscription && (
          <div
            onClick={closeModal}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 md:pl-72.5"
          >
            <div
              className="max-h-[90vh] w-[800px] overflow-y-auto rounded-lg bg-white p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold">Subscription Details</h2>
                <button 
                  onClick={() => closeModal()}
                  className="text-gray-500 hover:text-gray-700 font-bold text-xl"
                >
                  &times;
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-gray-500">Email:</span>
                    <span className="font-medium break-all">{selectedSubscription.email}</span>
                    
                    <span className="text-gray-500">Name:</span>
                    <span className="font-medium">{`${selectedSubscription.firstName || ""} ${selectedSubscription.lastName || ""}`}</span>
                    
                    <span className="text-gray-500">Phone:</span>
                    <span className="font-medium">{selectedSubscription.phone || "-"}</span>
                    
                    <span className="text-gray-500">WhatsApp:</span>
                    <span className="font-medium">{selectedSubscription.whatsAppNumber || "-"}</span>
                    
                    <span className="text-gray-500">Payment ID:</span>
                    <span className="font-medium">{selectedSubscription.paymentID}</span>
                    
                    <span className="text-gray-500">Success:</span>
                    <span className={`font-medium ${selectedSubscription.subscribed ? "text-green-600" : "text-red-600"}`}>
                      {selectedSubscription.subscribed ? "Yes" : "No"}
                    </span>
                    
                    <span className="text-gray-500">Mini Activated:</span>
                    <span className={`font-medium ${selectedSubscription.miniSubscriptionActivated ? "text-green-600" : "text-gray-600"}`}>
                      {selectedSubscription.miniSubscriptionActivated ? "Yes" : "No"}
                    </span>
                  </div>
                </div>

                {/* Package Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Package & Status</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-gray-500">Package:</span>
                    <span className="font-medium">{selectedSubscription.packageID?.name || "-"}</span>
                    
                    {activeTab !== "paymob" && activeTab !== "instapay" && (
                      <>
                        <span className="text-gray-500">Expiry Date:</span>
                        <span className="font-medium">
                          {selectedSubscription.expiryDate
                            ? new Date(
                                selectedSubscription.expiryDate,
                              ).toLocaleDateString()
                            : "-"}
                        </span>
                      </>
                    )}
                    
                    <span className="text-gray-500">Created At:</span>
                    <span className="font-medium">
                      {selectedSubscription.createdAt ? new Date(selectedSubscription.createdAt).toLocaleString() : "-"}
                    </span>
                    
                    <span className="text-gray-500">Is Gift:</span>
                    <span className="font-medium">{selectedSubscription.isGift ? "Yes" : "No"}</span>
                    
                    {selectedSubscription.isGift && (
                      <>
                        <span className="text-gray-500">Gift Recipient:</span>
                        <span className="font-medium break-all">{selectedSubscription.giftRecipientEmail}</span>
                        
                        <span className="text-gray-500">Gift Message:</span>
                        <span className="font-medium italic">{selectedSubscription.specialMessage}</span>
                      </>
                    )}

                    <span className="text-gray-500">Shipment Status:</span>
                    <span className={`font-medium px-2 py-0.5 rounded-full text-xs inline-block ${
                      selectedSubscription.status === "delivered" ? "bg-green-100 text-green-800" :
                      selectedSubscription.status === "shipped" ? "bg-blue-100 text-blue-800" :
                      selectedSubscription.status === "confirmed" ? "bg-purple-100 text-purple-800" :
                      selectedSubscription.status === "cancelled" || selectedSubscription.status === "returned" ? "bg-red-100 text-red-800" :
                      "bg-yellow-100 text-yellow-800"
                    }`}>
                      {(selectedSubscription.status || "pending").toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Address Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Address</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-gray-500">Address:</span>
                    <span className="font-medium col-span-2">{selectedSubscription.address} {selectedSubscription.apartment}</span>
                    
                    <span className="text-gray-500">City/State:</span>
                    <span className="font-medium">{selectedSubscription.city}, {selectedSubscription.state}</span>
                    
                    <span className="text-gray-500">Country:</span>
                    <span className="font-medium">{selectedSubscription.country}</span>
                    
                    <span className="text-gray-500">Postal Code:</span>
                    <span className="font-medium">{selectedSubscription.postalZip}</span>
                  </div>
                </div>

                {/* Billing Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Billing Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-gray-500">Name:</span>
                    <span className="font-medium">{`${selectedSubscription.billingFirstName || ""} ${selectedSubscription.billingLastName || ""}`}</span>
                    
                    <span className="text-gray-500">Address:</span>
                    <span className="font-medium col-span-2">{selectedSubscription.billingAddress} {selectedSubscription.billingApartment}</span>
                    
                    <span className="text-gray-500">City/State:</span>
                    <span className="font-medium">{selectedSubscription.billingCity}, {selectedSubscription.billingState}</span>
                    
                    <span className="text-gray-500">Country:</span>
                    <span className="font-medium">{selectedSubscription.billingCountry}</span>
                    
                    <span className="text-gray-500">Phone:</span>
                    <span className="font-medium">{selectedSubscription.billingPhone}</span>
                  </div>
                </div>
                
                {/* Financial Info */}
                <div className="space-y-4 md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Financial Details</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-gray-50 p-4 rounded">
                     <div>
                       <span className="block text-gray-500">Subtotal</span>
                       <span className="font-bold">{selectedSubscription.currency} {selectedSubscription.subTotal}</span>
                     </div>
                     <div>
                       <span className="block text-gray-500">Shipping</span>
                       <span className="font-bold">{selectedSubscription.currency} {selectedSubscription.shipping}</span>
                     </div>
                     <div>
                       <span className="block text-gray-500">Discount</span>
                       <span className="font-bold text-red-500">
                         {selectedSubscription.appliedDiscountAmount ? `-${selectedSubscription.currency} ${selectedSubscription.appliedDiscountAmount}` : "0"}
                         {selectedSubscription.appliedDiscount && (
                           <span className="text-xs text-gray-400 block">
                             (Code: {typeof selectedSubscription.appliedDiscount === 'object' ? selectedSubscription.appliedDiscount.code : 'Yes'})
                           </span>
                         )}
                       </span>
                     </div>
                     <div>
                       <span className="block text-gray-500">Total</span>
                       <span className="font-bold text-lg text-green-700">{selectedSubscription.currency} {selectedSubscription.total}</span>
                     </div>
                  </div>
                </div>

                {/* Allowed Playlists */}
                {selectedSubscription.allowedPlaylists && selectedSubscription.allowedPlaylists.length > 0 && (
                  <div className="space-y-4 md:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Allowed Playlists</h3>
                    <div className="space-y-2">
                      {selectedSubscription.allowedPlaylists.map((item: any, idx) => (
                        <div key={idx} className="flex items-center gap-4 bg-gray-50 p-2 rounded">
                          <img 
                            src={typeof item.playlistID === 'object' ? item.playlistID.thumbnailUrl : ''} 
                            alt="Thumbnail" 
                            className="w-16 h-10 object-cover rounded"
                          />
                          <div>
                            <p className="font-medium">{typeof item.playlistID === 'object' ? item.playlistID.title : 'Unknown Playlist'}</p>
                            <p className="text-xs text-gray-500">Expires: {new Date(item.expiryDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bundled Items (Cart) */}
                {selectedSubscription.cart && selectedSubscription.cart.length > 0 && (
                  <div className="space-y-4 md:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 100-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                      </svg>
                      Bundled Products
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedSubscription.cart.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4 bg-white border p-3 rounded-lg shadow-sm">
                          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                            <img 
                              src={item.imageUrl} 
                              alt={item.productName} 
                              className="h-full w-full object-cover object-center"
                            />
                          </div>
                          <div className="flex flex-1 flex-col">
                            <div>
                              <div className="flex justify-between text-sm font-medium text-gray-900">
                                <h4 className="line-clamp-1">{item.productName}</h4>
                                <p className="ml-4">{selectedSubscription.currency} {item.price}</p>
                              </div>
                              {item.variant && (
                                <p className="mt-1 text-xs text-gray-500">
                                  {item.variant.name}: {item.attributes?.name}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-1 items-end justify-between text-xs text-gray-500">
                              <p>Qty: {item.quantity}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => closeModal()}
                  className="rounded bg-primary px-6 py-2 text-white hover:bg-opacity-90 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DefaultLayout>
  );
};

export default SubscriptionsPage;
