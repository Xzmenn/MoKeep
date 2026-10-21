"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import { Toaster } from "sonner";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [txDialogOpen, setTxDialogOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden md:flex" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onOpenNewTransaction={() => setTxDialogOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Global Quick Transaction Modal */}
      <TransactionDialog
        open={txDialogOpen}
        onOpenChange={setTxDialogOpen}
        onSuccess={() => {
          // Trigger page-level updates via custom event or reload
          window.dispatchEvent(new CustomEvent("transaction-updated"));
        }}
      />

      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
