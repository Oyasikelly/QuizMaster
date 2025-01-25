"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import UpdatePasswordForm from "../../../components/UpdatePasswordForm";

const ResetPasswordPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
};

const ResetPasswordContent = () => {
  const searchParams = useSearchParams();
  const code = searchParams.get("code"); // Extract the code from the URL

  if (!code) {
    return <div>Invalid or missing reset code.</div>;
  }

  return (
    <div>
      <UpdatePasswordForm resetCode={code} />
    </div>
  );
};

export default ResetPasswordPage;
