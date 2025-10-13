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
      formatter: function(val) {
        return Math.round(val).toString();
      }
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
  const [year, setYear] = useState(new Date().getFullYear().toString());
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
        // Generate all months for the selected year
        const allMonths = [];

        // Create full year data structure
        const fullYearData: MonthlyDataItem[] = [];
        for (let i = 0; i < 12; i++) {
          const monthName = monthNames[i]; // Only use month name without year
          allMonths.push(monthName);

          // Initialize with zero values
          fullYearData.push({
            month: monthName,
            revenue: 0,
            cost: 0,
            profit: 0,
          });
        }

        // Fetch data for each month of the selected year
        const promises = [];
        for (let i = 1; i <= 12; i++) {
          const monthStr = String(i).padStart(2, "0");
          const url = `/api/analytics/subscriptions?month=${year}-${monthStr}`;
          promises.push(axios.get(url));
        }

        const responses = await Promise.all(promises);
        let hasSampleData = false;

        // Process each month's data
        responses.forEach((response, index) => {
          if (response.data && response.data.data) {
            const { summary } = response.data.data;

            // Use monthly data instead of summary data
            const monthlyData = response.data.data.monthlyData;
            if (monthlyData && monthlyData.length > 0) {
              // Use the first (and should be only) monthly data item for this month
              const monthData = monthlyData[0];
              fullYearData[index].revenue = monthData.revenue || 0;
              fullYearData[index].cost = monthData.cost || 0;
              fullYearData[index].profit = monthData.profit || 0;
            } else {
              // If no monthly data exists, ensure we use zero values
              fullYearData[index].revenue = 0;
              fullYearData[index].cost = 0;
              fullYearData[index].profit = 0;
            }

            // Check if this month has sample data
            if (
              response.data.data.monthlyData &&
              response.data.data.monthlyData.some(
                (item: any) => item.isSample === true,
              )
            ) {
              hasSampleData = true;
            }
          }
        });

        setIsSampleData(hasSampleData);

        // Extract data for chart
        const months = fullYearData.map((item) => item.month);
        const revenueData = fullYearData.map((item) => item.revenue);
        const costData = fullYearData.map((item) => item.cost);
        const profitData = fullYearData.map((item) => item.profit);

        // Update chart data
        setCategories(months);
        setSeries([
          { name: "Revenue", data: revenueData },
          { name: "Cost", data: costData },
          { name: "Profit", data: profitData },
        ]);
      } catch (error) {
        console.error("Error fetching subscription data:", error);

        // Set default data with zeros if API doesn't return expected format
        const defaultMonths = monthNames.map((month) => `${month} ${year}`);
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
  }, [year]);

  // Get available years (current year and 5 years back)
  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 6; i++) {
      years.push(currentYear - i);
    }
    return years;
  };

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
          <div className="relative z-20 inline-block">
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="relative z-20 inline-flex appearance-none bg-transparent py-1 pl-3 pr-8 text-sm font-medium outline-none"
            >
              {getYearOptions().map((year) => (
                <option key={year} value={year} className="dark:bg-boxdark">
                  {year}
                </option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 z-10 -translate-y-1/2">
              <svg
                width="10"
                height="6"
                viewBox="0 0 10 6"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M0.47072 1.08816C0.47072 1.02932 0.500141 0.955772 0.54427 0.911642C0.647241 0.808672 0.809051 0.808672 0.912022 0.896932L4.85431 4.60386C4.92785 4.67741 5.06025 4.67741 5.14851 4.60386L9.09079 0.896932C9.19376 0.793962 9.35557 0.808672 9.45854 0.911642C9.56151 1.01461 9.5468 1.17642 9.44383 1.27939L5.50155 4.98632C5.22206 5.23639 4.78076 5.23639 4.50127 4.98632L0.558987 1.27939C0.50014 1.22055 0.47072 1.16171 0.47072 1.08816Z"
                  fill="#637381"
                />
              </svg>
            </span>
          </div>
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
