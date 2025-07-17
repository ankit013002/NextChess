import HostJoinControl from "@/components/hostJoinControl";
import { useSearchParams } from "next/navigation";
import React, { useState } from "react";

const page = () => {
  return (
    <div className="min-h-[95vh] h-full flex justify-center items-center bg-[var(--color-light-square)]">
      <HostJoinControl />
    </div>
  );
};

export default page;
