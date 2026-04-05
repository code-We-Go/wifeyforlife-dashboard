"use client";

import { ApexOptions } from "apexcharts";
import React, { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { thirdFont } from "@/app/lib/fonts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => <div className="h-[350px] w-full animate-pulse bg-gray-100 rounded-xl dark:bg-gray-800"></div>,
});

// Chart configuration
const options: ApexOptions = {
  legend: {
    show: false,
    position: "top",
    horizontalAlign: "left",
  },
  colors: ["#12665C"],
  chart: {
    fontFamily: "Satoshi, sans-serif",
    height: 335,
    type: "area",
    dropShadow: {
      enabled: true,
      color: "#12665C",
      top: 10,
      blur: 4,
      left: 0,
      opacity: 0.1,
    },
    toolbar: {
      show: false,
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
  stroke: {
    width: [2, 2],
    curve: "smooth",
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
  dataLabels: {
    enabled: false,
  },
  markers: {
    size: 4,
    colors: "#fff",
    strokeColors: ["#12665C"],
    strokeWidth: 3,
    strokeOpacity: 0.9,
    strokeDashArray: 0,
    fillOpacity: 1,
    discrete: [],
    hover: {
      size: undefined,
      sizeOffset: 5,
    },
  },
  xaxis: {
    type: "category",
    categories: [], // Will be set dynamically
    axisBorder: {
      show: false,
    },
    axisTicks: {
      show: false,
    },
  },
  yaxis: {
    title: {
      text: "Visits",
      style: {
        fontSize: "12px",
      },
    },
    min: 0,
  },
};

const ChartVisits: React.FC = () => {
  const [series, setSeries] = useState<{ name: string; data: number[] }[]>([
    { name: "Visits", data: new Array(12).fill(0) },
  ]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const chartOptions = useMemo<ApexOptions>(() => ({
    ...options,
    xaxis: {
      ...options.xaxis,
      categories,
    },
  }), [categories]);

  useEffect(() => {
    const fetchVisits = async () => {
      try {
        const response = await fetch("/api/visites?duration=last12Months&aggregate=true");
        const result = await response.json();

        if (response.ok) {
          const visits = result.data;

          // Prepare last 12 months
          const now = new Date();
          const months: { key: string; label: string }[] = [];
          const monthlyTotals: { [key: string]: number } = {};

          for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${date.getFullYear()}-${date.getMonth()}`;
            const label = date.toLocaleString("en-US", { month: "short" });
            months.push({ key, label });
            monthlyTotals[key] = 0;
          }

          // Merge aggregated visits by month
          visits.forEach((visit: any) => {
            if (visit._id && visit._id.year && visit._id.month) {
              // MongoDB month is 1-12, JavaScript month is 0-11
              const key = `${visit._id.year}-${visit._id.month - 1}`;
              if (monthlyTotals.hasOwnProperty(key)) {
                monthlyTotals[key] += visit.count; // Add the aggregated count
              }
            } else if (visit.createdAt) {
              const visitDate = new Date(visit.createdAt);
              const key = `${visitDate.getFullYear()}-${visitDate.getMonth()}`;
              if (monthlyTotals.hasOwnProperty(key)) {
                monthlyTotals[key] += 1;
              }
            }
          });

          // Update chart
          setCategories(months.map((m) => m.label));
          setSeries([
            {
              name: "Visits",
              data: months.map((m) => monthlyTotals[m.key] || 0),
            },
          ]);
        } else {
          console.error("Error fetching visits:", result.error);
        }
      } catch (error) {
        console.error("Error fetching visits:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVisits();
  }, []);

  return (
    <div className="col-span-12 rounded-2xl border border-stroke bg-white px-5 pb-5 pt-7.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
      <div className="flex flex-wrap items-start justify-between gap-3 sm:flex-nowrap">
        <div className="flex w-full flex-wrap gap-3 sm:gap-5">
          <div className="flex min-w-47.5">
            <span className="mr-2 mt-1 flex h-4 w-full max-w-4 items-center justify-center rounded-full border border-secondary">
              <span className="block h-2.5 w-full max-w-2.5 rounded-full bg-secondary"></span>
            </span>
            <div className="w-full">
              <p className={`${thirdFont.className} text-2xl font-semibold tracking-normal text-secondary`}>
                Monthly Visits
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div id="chartVisits" className="-ml-5">
          {isLoading ? (
            <div className="flex h-[350px] w-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-secondary border-t-transparent"></div>
            </div>
          ) : (
            <ReactApexChart
              options={chartOptions}
              series={series}
              type="area"
              height={350}
              width={"100%"}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChartVisits;
