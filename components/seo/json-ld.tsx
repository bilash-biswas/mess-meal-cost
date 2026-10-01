import React from "react";

export function JsonLd() {
  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "MessCost",
    alternateName: ["Mess Cost BD", "মেসকস্ট", "মেসের হিসাব"],
    url: "https://mess-meal-cost.vercel.app",
    description:
      "মেসের হিসাব, সহজেই সবার জন্য। Complete Mess Expense & Daily Meal Management Web Application for students, bachelors, and shared messes in Bangladesh.",
    applicationCategory: "FinanceApplication",
    operatingSystem: "All (Web, Android, iOS)",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "BDT",
    },
    featureList: [
      "Day-wise Daily Meal Sheet (Present / Absent / Custom Meals)",
      "Automatic Product Payer Credit for Bazar Expenses",
      "Live Meal Rate Calculation (মোট খরচ ÷ মোট মিল)",
      "Individual Member Balance & Due / Refund (বকেয়া / পাওনা)",
      "Smart Minimum Transfer Settlement Suggestions",
      "Android APK Download & PWA Mobile Installation",
      "Instant Mess Join via QR Code & 8-character Invite Codes",
      "Closed Month Historical Accounting Freeze",
    ],
    inLanguage: ["en", "bn"],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How is the mess meal rate calculated in MessCost? (মিল রেট কীভাবে হিসাব হয়?)",
        acceptedAnswer: {
          "@type": "Answer",
          text: "MessCost calculates the live meal rate deterministically: Meal Rate = Total Bazar & Meal Expenses ÷ Total Meals Consumed by all members. Member Meal Cost is then calculated as Member Total Meals × Meal Rate, rounded accurately to two decimal places in BDT (৳).",
        },
      },
      {
        "@type": "Question",
        name: "Who adds bazar expenses and how is the payer credited? (বাজার খরচ কে দেয় এবং কীভাবে হিসাব হয়?)",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Any active member who shops for the mess can log the expense. The member who adds the expense is automatically credited as the payer for that product/bazar item, immediately increasing their total paid balance and offsetting their monthly due.",
        },
      },
      {
        "@type": "Question",
        name: "Can I use MessCost on Android phones? (মোবাইলে অ্যাপ হিসেবে ব্যবহার করা যায় কি?)",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes! MessCost is available both as an installable Progressive Web App (PWA) directly from any mobile browser, and as a lightweight native Android APK downloadable via GitHub Releases and the in-app QR code modal.",
        },
      },
      {
        "@type": "Question",
        name: "Is MessCost free to use for bachelor messes in Bangladesh? (মেসকস্ট কি সম্পূর্ণ ফ্রি?)",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, MessCost is 100% free forever for all mess members, managers, and bachelors, with no subscriptions or hidden charges.",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
