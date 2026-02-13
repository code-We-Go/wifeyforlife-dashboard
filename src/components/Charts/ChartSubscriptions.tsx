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
  colors: ["#D32333", "#12665C", "#81C8BB"],
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

const ChartSubscriptions: React.FC = () => {
  const [series, setSeries] = useState<{ name: string; data: number[] }[]>([
    { name: "Revenue", data: [] },
    { name: "Cost", data: [] },
    { name: "Profit", data: [] },
  ]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isSampleData, setIsSampleData] = useState<boolean>(false);

  // Define interface for monthly data item
  interface MonthlyDataItem {
    month: string;
    revenue: number;
    cost: number;
    profit: number;
  }

  // Month names for chart labels
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        // Generate the last 12 months ending with current month
        const currentDate = new Date();
        const rolling12Months: MonthlyDataItem[] = [];
        const monthLabels: string[] = [];
        
        // Create a map to store data by "MMM YYYY" key
        const dataMap = new Map<string, MonthlyDataItem>();

        // Generate the last 12 months (11 months ago + current month)
        for (let i = 11; i >= 0; i--) {
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
          const monthIndex = date.getMonth();
          const year = date.getFullYear();
          const monthName = monthNames[monthIndex];
          const key = `${monthName} ${year}`;
          
          monthLabels.push(monthName);
          
          // Initialize with zero values
          rolling12Months.push({
            month: key,
            revenue: 0,
            cost: 0,
            profit: 0,
          });
          
          dataMap.set(key, {
            month: key,
            revenue: 0,
            cost: 0,
            profit: 0,
          });
        }

        // Fetch data for the rolling 12-month period
        try {
          // Calculate start and end dates for the rolling period
          const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); // Last day of current month
          const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 11, 1); // First day of 11 months ago
          
          const url = `/api/analytics/subscriptions?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
          const response = await axios.get(url);
          console.log(JSON.stringify(response.data.data.monthlyData));
          let hasSampleData = false;

          if (
            response.data &&
            response.data.data &&
            response.data.data.monthlyData
          ) {
            const monthlyData = response.data.data.monthlyData;

            // Process the monthly data
            monthlyData.forEach((monthData: any) => {
              const monthKey = monthData.month; // Should be in "MMM YYYY" format
              
              if (dataMap.has(monthKey)) {
                dataMap.set(monthKey, {
                  month: monthKey,
                  revenue: monthData.revenue || 0,
                  cost: monthData.cost || 0,
                  profit: monthData.profit || 0,
                });
              }

              // Check if this is sample data
              if (monthData.isSample === true) {
                hasSampleData = true;
              }
            });
            
            // Update rolling12Months with fetched data
            rolling12Months.forEach((item, index) => {
              const data = dataMap.get(item.month);
              if (data) {
                rolling12Months[index] = data;
              }
            });
          }

          setIsSampleData(hasSampleData);
        } catch (error) {
          console.error("Error fetching subscription data:", error);
          // Keep the default zero values for all months
        }

        // Extract data for chart
        const revenueData = rolling12Months.map((item) => item.revenue);
        const costData = rolling12Months.map((item) => item.cost);
        const profitData = rolling12Months.map((item) => item.profit);

        // Update chart data
        setCategories(monthLabels);
        setSeries([
          { name: "Revenue", data: revenueData },
          { name: "Cost", data: costData },
          { name: "Profit", data: profitData },
        ]);
      } catch (error) {
        console.error("Error fetching subscription data:", error);

        // Set default data with zeros if API doesn't return expected format
        const currentDate = new Date();
        const defaultMonths: string[] = [];
        for (let i = 11; i >= 0; i--) {
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
          defaultMonths.push(monthNames[date.getMonth()]);
        }
        
        setCategories(defaultMonths);
        setSeries([
          {
            name: "Revenue",
            data: Array(12).fill(0),
          },
          {
            name: "Cost",
            data: Array(12).fill(0),
          },
          {
            name: "Profit",
            data: Array(12).fill(0),
          },
        ]);

        // Set sample data flag to false since we're showing actual zeros
        setIsSampleData(false);
      }
    };

    fetchSubscriptionData();
  }, []);



  return (
    <div className="col-span-12 rounded-2xl border border-stroke bg-white px-5 pb-5 pt-7.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 sm:flex-nowrap">
        <div className="flex min-w-47.5">
          <div className="w-full">
            <h4
              className={`${thirdFont.className} text-2xl font-semibold tracking-normal text-secondary`}
            >
              Subscription Analytics
            </h4>
            <p className="text-sm text-gray-500">
              Revenue, Cost, and Profit by Month
            </p>
            {isSampleData && (
              <span className="mt-1 inline-block rounded bg-amber-500 px-2 py-1 text-xs font-medium text-white">
                Sample Data
              </span>
            )}
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-500">Last 12 Months</p>
        </div>
      </div>

      <div>
        <div id="chartSubscriptions" className="-ml-5">
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

export default ChartSubscriptions;
