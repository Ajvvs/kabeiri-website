"use client";

import React, { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import type { Job } from "@/db/app.schema";

import { JobFormDialog, JobTable } from "./_components";
import { useJobForm } from "./_hooks/use-job-form";
import { useJobsData } from "./_hooks/use-jobs-data";

function JobsPageContent() {
  const searchParams = useSearchParams();
  const schedule = searchParams.get("schedule");

  const { data, isLoading, error, refetch } = useJobsData();
  const {
    modalStatus,
    vehicles,
    selectedCustomer,
    watchedCustomer,
    register,
    errors,
    handleSubmit,
    onSubmit,
    openModal,
    closeModal,
    setSelectedCustomer,
  } = useJobForm(refetch);

  // Filter jobs based on schedule query parameter
  const filteredJobs = useMemo(() => {
    if (!data?.jobs) return [];

    if (schedule === "today") {
      const today = new Date();
      const todayString = today.toISOString().split("T")[0]; // Get YYYY-MM-DD format

      return data.jobs.filter((job: Job) => {
        if (!job.due_date) return false;
        const jobDate = new Date(job.due_date);
        const jobDateString = jobDate.toISOString().split("T")[0];
        return jobDateString === todayString;
      });
    }

    return data.jobs;
  }, [data?.jobs, schedule]);

  if (isLoading) {
    return (
      <main className="p-8">
        <div className="flex h-64 items-center justify-center">
          <div className="text-lg text-gray-600 dark:text-gray-400">
            Loading jobs...
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-8">
        <div className="text-center text-red-600 dark:text-red-400">
          Error loading jobs: {error}
        </div>
      </main>
    );
  }

  return (
    <main className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {schedule === "today" ? "Today's Jobs" : "Jobs"}
          </h1>
          {schedule === "today" && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Showing jobs due today ({new Date().toLocaleDateString()})
            </p>
          )}
        </div>
        <Button onClick={openModal}>+ New Job</Button>
      </div>

      <JobTable jobs={filteredJobs} />

      <JobFormDialog
        isOpen={modalStatus}
        onClose={closeModal}
        customers={data?.customers || []}
        employees={data?.employees || []}
        services={data?.services || []}
        vehicles={vehicles || []}
        selectedCustomer={selectedCustomer}
        watchedCustomer={watchedCustomer}
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(onSubmit)(e);
        }}
        register={register}
        errors={errors}
        setSelectedCustomer={setSelectedCustomer}
      />
    </main>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JobsPageContent />
    </Suspense>
  );
}
