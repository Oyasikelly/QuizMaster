"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import UpdatePasswordForm from "../../../../components/UpdatePasswordForm";

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
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-red-500 to-pink-500 text-white p-6">
        <div className="bg-white text-red-500 p-6 rounded-lg shadow-lg w-full max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-center">Oops!</h1>
          <p className="text-center text-lg">
            Invalid or missing reset code. Please check the link in your email
            or request a new reset link.
          </p>
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => (window.location.href = "/authenticate")}
              className="bg-red-500 text-white py-2 px-4 rounded-md shadow-md hover:bg-red-600 transition duration-300"
            >
              Request New Link
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <UpdatePasswordForm resetCode={code} />
    </div>
  );
};

export default ResetPasswordPage;
