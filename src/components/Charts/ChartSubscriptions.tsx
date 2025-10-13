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
      formatter: (value) => `${value.toLocaleString()} EGP`,
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

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        // Fetch data for all months of the selected year
        const monthlyData: { [key: string]: { revenue: number; cost: number; profit: number } } = {};
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        
        // Initialize data structure
        monthNames.forEach(month => {
          monthlyData[month] = { revenue: 0, cost: 0, profit: 0 };
        });

        // Fetch data for each month
        const promises = monthNames.map(async (_, index) => {
          const monthNum = index + 1;
          const monthStr = monthNum < 10 ? `0${monthNum}` : `${monthNum}`;
          const monthParam = `${year}-${monthStr}`;
          
          try {
            const response = await axios.get(`/api/analytics/subscriptions?month=${monthParam}`);
            return { month: monthNames[index], data: response.data };
          } catch (error) {
            console.error(`Error fetching data for ${monthParam}:`, error);
            return { month: monthNames[index], data: { revenue: 0, cost: 0, profit: 0 } };
          }
        });

        const results = await Promise.all(promises);
        
        // Process results
        results.forEach(result => {
          const { month, data } = result;
          if (data && data.analytics) {
            monthlyData[month] = {
              revenue: data.analytics.revenue || 0,
              cost: data.analytics.cost || 0,
              profit: data.analytics.profit || 0
            };
          }
        });

        // Update chart data
        setCategories(monthNames);
        setSeries([
          { 
            name: "Revenue", 
            data: monthNames.map(month => monthlyData[month].revenue) 
          },
          { 
            name: "Cost", 
            data: monthNames.map(month => monthlyData[month].cost) 
          },
          { 
            name: "Profit", 
            data: monthNames.map(month => monthlyData[month].profit) 
          }
        ]);
      } catch (error) {
        console.error("Error fetching subscription data:", error);
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
      <div className="flex flex-wrap items-start justify-between gap-3 sm:flex-nowrap mb-4">
        <div className="flex min-w-47.5">
          <div className="w-full">
            <h4 className={`${thirdFont.className} text-2xl tracking-normal font-semibold text-secondary`}>
              Subscription Analytics
            </h4>
            <p className="text-sm text-gray-500">Revenue, Cost, and Profit by Month</p>
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