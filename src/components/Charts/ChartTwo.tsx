"use client";

import { ApexOptions } from "apexcharts";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import { thirdFont } from "@/app/lib/fonts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const options: ApexOptions = {
  chart: {
    fontFamily: "Satoshi, sans-serif",
    type: "area",
    height: 335,
    toolbar: { show: false },
    zoom: { enabled: false },
  },
  colors: ["#D32333", "#D4A017"],
  legend: {
    position: "top",
    horizontalAlign: "left",
    fontFamily: "Satoshi",
    fontWeight: 500,
    fontSize: "14px",
  },
  dataLabels: {
    enabled: false,
  },
  stroke: {
    curve: "smooth",
    width: 2,
  },
  grid: {
    xaxis: {
      lines: {
        show: true,
      },
    },
    yaxis: {
      lines: {
        show: true,
      },
    },
  },
  tooltip: {
    shared: true,
    intersect: false,
    y: {
      formatter: (value) => `${Math.round(value).toLocaleString()} EGP`,
    },
  },
  xaxis: {
    type: "category",
    categories: [], // Will be populated dynamically
    axisBorder: {
      show: false,
    },
    axisTicks: {
      show: false,
    },
  },
  yaxis: {
    title: {
      text: "Amount (EGP)",
      style: {
        fontSize: "12px",
      },
    },
    min: 0,
    labels: {
      formatter: function (val) {
        return Math.round(val).toString();
      },
    },
  },
  responsive: [
    {
      breakpoint: 1024,
      options: {
        chart: {
          height: 300,
        },
      },
    },
    {
      breakpoint: 1366,
      options: {
        chart: {
          height: 350,
        },
      },
    },
  ],
};

const monthNames = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const ChartTwo: React.FC = () => {
  const [series, setSeries] = useState<{ name: string; data: number[] }[]>([
    { name: "Orders", data: [] },
    { name: "Sessions", data: [] },
  ]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchMonthlyData = async () => {
      try {
        const currentDate = new Date();
        const monthLabels: string[] = [];
        const ordersMonthly = new Array(12).fill(0);
        const sessionsMonthly = new Array(12).fill(0);

        // Build month labels and date ranges for the last 12 months
        const monthRanges: { start: Date; end: Date; label: string }[] = [];
        for (let i = 11; i >= 0; i--) {
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
          const monthLabel = monthNames[date.getMonth()];
          monthLabels.push(monthLabel);

          const start = new Date(date.getFullYear(), date.getMonth(), 1);
          const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
          monthRanges.push({ start, end, label: monthLabel });
        }

        // Fetch both APIs in parallel
        const [localRes, partnerRes] = await Promise.all([
          axios.get(`/api/localGlobalProfit?week=all`),
          axios.get(`/api/partner-session-orders?status=paid`),
        ]);

        // Process local orders
        const orders = localRes.data.data || [];
        console.log(`[ChartTwo] Total orders fetched: ${orders.length}`);
        if (Array.isArray(orders)) {
          orders.forEach((order: any) => {
            const date = new Date(order.createdAt);
            // Find which month bucket this order belongs to
            for (let idx = 0; idx < monthRanges.length; idx++) {
              if (date >= monthRanges[idx].start && date <= monthRanges[idx].end) {
                ordersMonthly[idx] += order.subTotal || 0;
                break;
              }
            }
          });
        }
        console.log(`[ChartTwo] Orders monthly totals:`, ordersMonthly);

        // Process partner session orders
        const partnerOrders = partnerRes.data.data || [];
        if (Array.isArray(partnerOrders)) {
          partnerOrders.forEach((order: any) => {
            const date = new Date(order.createdAt);
            for (let idx = 0; idx < monthRanges.length; idx++) {
              if (date >= monthRanges[idx].start && date <= monthRanges[idx].end) {
                sessionsMonthly[idx] += order.finalPrice || 0;
                break;
              }
            }
          });
        }

        setCategories(monthLabels);
        setSeries([
          { name: "Orders", data: ordersMonthly },
          { name: "Sessions", data: sessionsMonthly },
        ]);
      } catch (error) {
        console.error("Error fetching monthly profit data:", error);

        // Set default data with zeros
        const currentDate = new Date();
        const defaultMonths: string[] = [];
        for (let i = 11; i >= 0; i--) {
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
          defaultMonths.push(monthNames[date.getMonth()]);
        }

        setCategories(defaultMonths);
        setSeries([
          { name: "Orders", data: Array(12).fill(0) },
          { name: "Sessions", data: Array(12).fill(0) },
        ]);
      }
    };

    fetchMonthlyData();
  }, []);

  return (
    <div className="col-span-12 rounded-2xl border border-stroke bg-white px-5 pb-5 pt-7.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:col-span-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 sm:flex-nowrap">
        <div className="flex min-w-47.5">
          <div className="w-full">
            <h4
              className={`${thirdFont.className} text-2xl font-semibold tracking-normal text-secondary`}
            >
              Profit Overview
            </h4>
            <p className="text-sm text-gray-500">
              Orders & Sessions by Month
            </p>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-500">Last 12 Months</p>
        </div>
      </div>

      <div>
        <div id="chartTwo" className="-ml-5">
          <ReactApexChart
            options={{ ...options, xaxis: { ...options.xaxis, categories } }}
            series={series}
            type="area"
            height={350}
            width={"100%"}
          />
        </div>
      </div>
    </div>
  );
};

export default ChartTwo;
