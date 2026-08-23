"use client";

import { useState, useEffect } from "react";

import {
  Building2,
  Search,
  ExternalLink,
  FileText,
  CheckCircle2,
  Info,
  AlertCircle,
  UserRound,
  XCircle,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import { DashboardLayout } from "@/components/dashboard-layout";

import { useLanguage } from "@/lib/i18n/LanguageContext";

// =========================================================
// TYPES
// =========================================================

interface EligibilityResult {
  status:
    | "eligible"
    | "not_eligible"
    | "profile_incomplete";

  eligible: boolean;

  partiallyEligible: boolean;

  passedCriteria?: string[];

  failedCriteria?: string[];

  missingInformation?: string[];

  reason: string;
}

interface GovernmentScheme {
  _id: string;

  schemeName: string;

  ministry?: string;

  description: string;

  schemeType: string;

  state: string;

  category: string[];

  farmerType: string[];

  gender: string[];

  eligibility: string[];

  eligibilityRules?: {
    minAge?: number | null;
    maxAge?: number | null;

    minAnnualIncome?: number | null;
    maxAnnualIncome?: number | null;

    minLandHolding?: number | null;
    maxLandHolding?: number | null;

    landUnit?: string;

    landOwnership?: string[];

    requiredGender?: string[];

    requiredCategory?: string[];

    requiredFarmerType?: string[];

    requiredIrrigationType?: string[];

    aadhaarRequired?: boolean;

    bankAccountRequired?: boolean;

    pmKisanRequired?: boolean;
  };

  benefits: string;

  documentsRequired?: string[];

  howToApply?: string;

  applicationLink?: string;

  // Legacy fields
  applicationProcess?: string;

  requiredDocuments?: string[];

  officialWebsite?: string;

  contactInfo?: {
    phone?: string;
    email?: string;
    address?: string;
  };

  deadline?: string;

  budgetAmount?: string;

  priority?: number;

  active?: boolean;

  eligibilityResult?: EligibilityResult;

  recommendationScore?: number;
}

// =========================================================
// CONSTANTS
// =========================================================

const API_BASE =
  "http://localhost:5000/api";

const schemeTypeColors: {
  [key: string]: string;
} = {
  subsidy:
    "bg-green-100 text-green-800",

  loan:
    "bg-blue-100 text-blue-800",

  credit:
    "bg-blue-100 text-blue-800",

  insurance:
    "bg-purple-100 text-purple-800",

  pension:
    "bg-indigo-100 text-indigo-800",

  training:
    "bg-yellow-100 text-yellow-800",

  skill_development:
    "bg-yellow-100 text-yellow-800",

  equipment:
    "bg-orange-100 text-orange-800",

  income_support:
    "bg-emerald-100 text-emerald-800",

  technical_assistance:
    "bg-cyan-100 text-cyan-800",

  marketing:
    "bg-pink-100 text-pink-800",

  infrastructure:
    "bg-slate-100 text-slate-800",

  other:
    "bg-gray-100 text-gray-800",
};

// =========================================================
// HELPERS
// =========================================================

function getApplicationLink(
  scheme: GovernmentScheme
) {
  return (
    scheme.applicationLink ||
    scheme.officialWebsite ||
    ""
  );
}

function getDocuments(
  scheme: GovernmentScheme
) {
  if (
    scheme.documentsRequired &&
    scheme.documentsRequired.length > 0
  ) {
    return scheme.documentsRequired;
  }

  if (
    scheme.requiredDocuments &&
    scheme.requiredDocuments.length > 0
  ) {
    return scheme.requiredDocuments;
  }

  return [];
}

function getApplicationProcess(
  scheme: GovernmentScheme
) {
  return (
    scheme.howToApply ||
    scheme.applicationProcess ||
    ""
  );
}

function formatSchemeType(
  schemeType: string
) {
  return schemeType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

// =========================================================
// ELIGIBILITY BADGE
// =========================================================

function EligibilityBadge({
  result,
  showCheckButton = false,
}: {
  result?: EligibilityResult;
  showCheckButton?: boolean;
}) {
  if (!result) {
    return (
      <Badge
        variant="outline"
        className="border-gray-300 text-gray-600"
      >
        <Info className="h-3 w-3 mr-1" />

        {showCheckButton
          ? "Check Eligibility"
          : "Eligibility not checked"}
      </Badge>
    );
  }

  if (result.status === "eligible") {
    return (
      <Badge className="bg-green-100 text-green-800 border border-green-200">
        <CheckCircle2 className="h-3 w-3 mr-1" />

        Eligible
      </Badge>
    );
  }

  if (
    result.status ===
    "profile_incomplete"
  ) {
    return (
      <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200">
        <AlertCircle className="h-3 w-3 mr-1" />

        Complete Profile
      </Badge>
    );
  }

  return (
    <Badge className="bg-red-100 text-red-800 border border-red-200">
      <XCircle className="h-3 w-3 mr-1" />

      Not Eligible
    </Badge>
  );
}

// =========================================================
// ELIGIBILITY SUMMARY
// =========================================================

function EligibilitySummary({
  result,
}: {
  result?: EligibilityResult;
}) {
  if (!result) {
    return null;
  }

  const passedCriteria =
    result.passedCriteria || [];

  const failedCriteria =
    result.failedCriteria || [];

  const missingInformation =
    result.missingInformation || [];

  // ---------------------------------------------------------
  // ELIGIBLE
  // ---------------------------------------------------------

  if (result.status === "eligible") {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />

          <div className="flex-1">
            <h4 className="font-semibold text-green-800">
              You appear eligible
            </h4>

            <p className="text-sm text-green-700 mt-1">
              {result.reason}
            </p>

            {passedCriteria.length >
              0 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-green-800 mb-1">
                  Requirements satisfied:
                </p>

                <ul className="list-disc list-inside text-sm text-green-700 space-y-1">
                  {passedCriteria.map(
                    (
                      item,
                      index
                    ) => (
                      <li key={index}>
                        {item}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // PROFILE INCOMPLETE
  // ---------------------------------------------------------

  if (
    result.status ===
    "profile_incomplete"
  ) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />

          <div className="flex-1">
            <h4 className="font-semibold text-yellow-800">
              Complete your profile
            </h4>

            <p className="text-sm text-yellow-700 mt-1">
              {result.reason}
            </p>

            {missingInformation.length >
              0 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-yellow-800 mb-1">
                  Information needed:
                </p>

                <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                  {missingInformation.map(
                    (
                      item,
                      index
                    ) => (
                      <li key={index}>
                        {item}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // NOT ELIGIBLE
  // ---------------------------------------------------------

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <div className="flex items-start gap-3">
        <XCircle className="h-5 w-5 text-red-600 mt-0.5" />

        <div className="flex-1">
          <h4 className="font-semibold text-red-800">
            Currently not eligible
          </h4>

          <p className="text-sm text-red-700 mt-1">
            {result.reason}
          </p>

          {failedCriteria.length >
            0 && (
            <div className="mt-3">
              <p className="text-sm font-medium text-red-800 mb-1">
                Requirements not met:
              </p>

              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                {failedCriteria.map(
                  (
                    item,
                    index
                  ) => (
                    <li key={index}>
                      {item}
                    </li>
                  )
                )}
              </ul>
            </div>
          )}

          {passedCriteria.length >
            0 && (
            <div className="mt-3">
              <p className="text-sm font-medium text-green-800 mb-1">
                Requirements satisfied:
              </p>

              <ul className="list-disc list-inside text-sm text-green-700 space-y-1">
                {passedCriteria.map(
                  (
                    item,
                    index
                  ) => (
                    <li key={index}>
                      {item}
                    </li>
                  )
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =========================================================
// PAGE
// =========================================================

export default function GovernmentSchemesPage() {
  const { t } = useLanguage();

  const [
    schemes,
    setSchemes,
  ] = useState<GovernmentScheme[]>(
    []
  );

  const [
    recommendedSchemes,
    setRecommendedSchemes,
  ] = useState<
    GovernmentScheme[]
  >([]);

  const [
    selectedScheme,
    setSelectedScheme,
  ] =
    useState<GovernmentScheme | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    allLoading,
    setAllLoading,
  ] = useState(false);

  const [
    eligibilityLoading,
    setEligibilityLoading,
  ] = useState(false);

  const [
    eligibilityError,
    setEligibilityError,
  ] = useState("");

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    filterType,
    setFilterType,
  ] = useState("all");

  const [
    activeTab,
    setActiveTab,
  ] = useState("recommended");

  const [
    profileComplete,
    setProfileComplete,
  ] = useState(true);

  const [
    profileMissingFields,
    setProfileMissingFields,
  ] = useState<string[]>([]);

  // =========================================================
  // FETCH RECOMMENDED SCHEMES
  // =========================================================

  const fetchRecommendedSchemes =
    async () => {
      try {
        setLoading(true);

        const token =
          localStorage.getItem(
            "token"
          );

        if (!token) {
          console.error(
            "No authentication token found"
          );

          return;
        }

        const response =
          await fetch(
            `${API_BASE}/schemes/recommended`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

        const contentType =
          response.headers.get(
            "content-type"
          );

        if (
          !contentType ||
          !contentType.includes(
            "application/json"
          )
        ) {
          const text =
            await response.text();

          console.error(
            "Recommended schemes returned non-JSON:",
            text
          );

          throw new Error(
            "Server returned an invalid response."
          );
        }

        const data =
          await response.json();

        if (response.ok) {
          /*
           * Backend should already return only eligible
           * schemes. We also filter here defensively.
           */
          const eligibleSchemes =
            (
              data.schemes || []
            ).filter(
              (
                scheme: GovernmentScheme
              ) =>
                scheme
                  .eligibilityResult
                  ?.status ===
                "eligible"
            );

          setRecommendedSchemes(
            eligibleSchemes
          );

          setProfileComplete(
            data.profileComplete ??
              true
          );

          setProfileMissingFields(
            data.profileMissingFields ||
              []
          );
        } else {
          console.error(
            "Recommended schemes error:",
            data
          );
        }
      } catch (error) {
        console.error(
          "Error fetching recommended schemes:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

  // =========================================================
  // FETCH ALL SCHEMES
  // =========================================================

  const fetchAllSchemes =
    async () => {
      try {
        setAllLoading(true);

        const params =
          new URLSearchParams();

        if (
          filterType !== "all"
        ) {
          params.append(
            "schemeType",
            filterType
          );
        }

        if (
          searchQuery.trim()
        ) {
          params.append(
            "search",
            searchQuery.trim()
          );
        }

        params.append(
          "page",
          "1"
        );

        params.append(
          "limit",
          "100"
        );

        const response =
          await fetch(
            `${API_BASE}/schemes/all?${params.toString()}`
          );

        const contentType =
          response.headers.get(
            "content-type"
          );

        if (
          !contentType ||
          !contentType.includes(
            "application/json"
          )
        ) {
          const text =
            await response.text();

          console.error(
            "All schemes returned non-JSON:",
            text
          );

          throw new Error(
            "Server returned an invalid response."
          );
        }

        const data =
          await response.json();

        if (response.ok) {
          /*
           * IMPORTANT:
           *
           * All schemes are intentionally kept here.
           *
           * Eligibility is NOT automatically checked.
           * It will only be checked when the farmer clicks
           * "Check Eligibility".
           */
          setSchemes(
            data.schemes || []
          );
        } else {
          console.error(
            "All schemes error:",
            data
          );
        }
      } catch (error) {
        console.error(
          "Error fetching schemes:",
          error
        );
      } finally {
        setAllLoading(false);
      }
    };

  // =========================================================
  // CHECK SINGLE SCHEME ELIGIBILITY
  // =========================================================

  const checkEligibility =
    async (
      scheme: GovernmentScheme
    ) => {
      try {
        setEligibilityLoading(
          true
        );

        setEligibilityError("");

        const token =
          localStorage.getItem(
            "token"
          );

        if (!token) {
          setEligibilityError(
            "Please login to check eligibility."
          );

          return;
        }

        const response =
          await fetch(
            `${API_BASE}/schemes/${scheme._id}/eligibility`,
            {
              method: "GET",

              headers: {
                Authorization: `Bearer ${token}`,

                "Content-Type":
                  "application/json",
              },
            }
          );

        /*
         * IMPORTANT:
         *
         * The previous error:
         *
         * Unexpected token '<', "<!DOCTYPE "... is not valid JSON
         *
         * happens when the server sends HTML instead of JSON.
         *
         * We check content-type before calling response.json().
         */

        const contentType =
          response.headers.get(
            "content-type"
          );

        if (
          !contentType ||
          !contentType.includes(
            "application/json"
          )
        ) {
          const text =
            await response.text();

          console.error(
            "Eligibility endpoint returned non-JSON:",
            text
          );

          throw new Error(
            "The server returned an invalid response. Please make sure the backend is running on port 5000."
          );
        }

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Failed to check eligibility."
          );
        }

        if (
          !data.eligibilityResult
        ) {
          throw new Error(
            "Eligibility result was not returned by the server."
          );
        }

        /*
         * Update the currently selected scheme
         * with the newly calculated result.
         */

        setSelectedScheme(
          (currentScheme) => {
            if (
              !currentScheme ||
              currentScheme._id !==
                scheme._id
            ) {
              return currentScheme;
            }

            return {
              ...currentScheme,

              eligibilityResult:
                data.eligibilityResult,
            };
          }
        );

        /*
         * Also update the All Schemes list.
         */

        setSchemes(
          (currentSchemes) =>
            currentSchemes.map(
              (item) =>
                item._id ===
                scheme._id
                  ? {
                      ...item,

                      eligibilityResult:
                        data.eligibilityResult,
                    }
                  : item
            )
        );
      } catch (error) {
        console.error(
          "Eligibility check error:",
          error
        );

        setEligibilityError(
          error instanceof Error
            ? error.message
            : "Failed to check eligibility."
        );
      } finally {
        setEligibilityLoading(
          false
        );
      }
    };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    fetchRecommendedSchemes();

    fetchAllSchemes();
  }, []);

  // =========================================================
  // ALL SCHEMES FILTER
  // =========================================================

  useEffect(() => {
    if (
      activeTab === "all"
    ) {
      const timer =
        setTimeout(() => {
          fetchAllSchemes();
        }, 300);

      return () =>
        clearTimeout(timer);
    }
  }, [
    searchQuery,
    filterType,
    activeTab,
  ]);

  // =========================================================
  // SCHEME CARD
  // =========================================================

  const SchemeCard = ({
    scheme,
  }: {
    scheme: GovernmentScheme;
  }) => {
    const applicationLink =
      getApplicationLink(
        scheme
      );

    const documents =
      getDocuments(scheme);

    const typeColor =
      schemeTypeColors[
        scheme.schemeType
      ] ||
      schemeTypeColors.other;

    const isRecommendedTab =
      activeTab ===
      "recommended";

    return (
      <Card
        className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col"
        onClick={() =>
          setSelectedScheme(
            scheme
          )
        }
      >
        <CardHeader>
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1">
              <CardTitle className="text-lg mb-2">
                {scheme.schemeName}
              </CardTitle>

              <CardDescription className="line-clamp-2">
                {scheme.description}
              </CardDescription>
            </div>

            <Badge
              className={
                typeColor
              }
            >
              {formatSchemeType(
                scheme.schemeType
              )}
            </Badge>
          </div>

          <div className="mt-3">
            {isRecommendedTab ? (
              <EligibilityBadge
                result={
                  scheme.eligibilityResult
                }
              />
            ) : (
              <EligibilityBadge
                showCheckButton
              />
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1">
          <div className="space-y-3">
            {scheme.ministry && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-gray-500" />

                <span className="text-gray-600">
                  {scheme.ministry}
                </span>
              </div>
            )}

            {scheme.budgetAmount && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">
                  {t("budget")}:
                </span>

                <span className="text-sm text-green-600 font-semibold">
                  {
                    scheme.budgetAmount
                  }
                </span>
              </div>
            )}

            {isRecommendedTab && (
              <div className="rounded-md bg-green-50 border border-green-200 p-2">
                <p className="text-xs text-green-700 font-medium">
                  You appear eligible
                  for this scheme.
                </p>
              </div>
            )}

            {!isRecommendedTab && (
              <div className="rounded-md bg-gray-50 border border-gray-200 p-2">
                <p className="text-xs text-gray-600">
                  Open the scheme and
                  click "Check
                  Eligibility" to
                  verify your profile.
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-1">
              {scheme.state &&
                scheme.state !==
                  "all" && (
                  <Badge
                    variant="outline"
                    className="text-xs"
                  >
                    {scheme.state}
                  </Badge>
                )}
            </div>

            {documents.length >
              0 && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <FileText className="h-3.5 w-3.5" />

                <span>
                  {documents.length}{" "}
                  document
                  {documents.length >
                  1
                    ? "s"
                    : ""}{" "}
                  required
                </span>
              </div>
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={(
                event
              ) => {
                event.stopPropagation();

                setEligibilityError(
                  ""
                );

                setSelectedScheme(
                  scheme
                );
              }}
            >
              <Info className="h-4 w-4 mr-2" />

              {t(
                "viewDetails"
              )}
            </Button>

            {applicationLink && (
              <Button
                variant="ghost"
                className="w-full text-green-700 hover:text-green-800"
                onClick={(
                  event
                ) => {
                  event.stopPropagation();

                  window.open(
                    applicationLink,
                    "_blank",
                    "noopener,noreferrer"
                  );
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />

                Apply / Official
                Website
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <div className="p-2 rounded-full bg-orange-500">
              <Building2 className="h-8 w-8 text-white" />
            </div>

            {t(
              "governmentSchemesFinder"
            )}
          </h1>

          <p className="text-gray-600 mt-1">
            {t(
              "discoverSchemesBenefits"
            )}
          </p>
        </div>

        {/* =====================================================
            PROFILE WARNING
        ===================================================== */}

        {!profileComplete &&
          activeTab ===
            "recommended" && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-full bg-yellow-100">
                    <UserRound className="h-5 w-5 text-yellow-700" />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-yellow-900">
                      Complete your
                      farmer profile
                    </h3>

                    <p className="text-sm text-yellow-800 mt-1">
                      Some schemes require
                      additional information
                      before FarmAI can
                      determine your exact
                      eligibility.
                    </p>

                    {profileMissingFields.length >
                      0 && (
                      <p className="text-xs text-yellow-700 mt-2">
                        Missing:{" "}
                        {profileMissingFields.join(
                          ", "
                        )}
                      </p>
                    )}

                    <Button
                      className="mt-3 bg-yellow-600 hover:bg-yellow-700 text-white"
                      onClick={() =>
                        (window.location.href =
                          "/dashboard/profile")
                      }
                    >
                      <UserRound className="h-4 w-4 mr-2" />

                      Complete Profile
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        {/* =====================================================
            TABS
        ===================================================== */}

        <Tabs
          value={activeTab}
          onValueChange={
            setActiveTab
          }
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="recommended">
              {t(
                "recommendedForYou"
              )}
            </TabsTrigger>

            <TabsTrigger value="all">
              {t(
                "allSchemes"
              )}
            </TabsTrigger>
          </TabsList>

          {/* ===================================================
              RECOMMENDED
          =================================================== */}

          <TabsContent
            value="recommended"
            className="space-y-4"
          >
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
              </div>
            ) : recommendedSchemes.length ===
              0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Building2 className="h-16 w-16 mx-auto text-gray-400 mb-4" />

                  <h3 className="text-xl font-semibold mb-2">
                    No eligible schemes
                    found
                  </h3>

                  <p className="text-gray-600">
                    No currently eligible
                    government schemes
                    were found for your
                    profile.
                  </p>

                  {!profileComplete && (
                    <Button
                      className="mt-4 bg-green-600 hover:bg-green-700"
                      onClick={() =>
                        (window.location.href =
                          "/dashboard/profile")
                      }
                    >
                      <UserRound className="h-4 w-4 mr-2" />

                      Complete Profile
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">
                      Recommended schemes
                    </h2>

                    <p className="text-sm text-gray-500">
                      Schemes you currently
                      appear eligible for
                      based on your farmer
                      profile.
                    </p>
                  </div>

                  <Badge variant="outline">
                    {
                      recommendedSchemes.length
                    }{" "}
                    schemes
                  </Badge>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {recommendedSchemes.map(
                    (scheme) => (
                      <SchemeCard
                        key={
                          scheme._id
                        }
                        scheme={
                          scheme
                        }
                      />
                    )
                  )}
                </div>
              </>
            )}
          </TabsContent>

          {/* ===================================================
              ALL SCHEMES
          =================================================== */}

          <TabsContent
            value="all"
            className="space-y-4"
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <Input
                      placeholder={t(
                        "searchSchemes"
                      )}
                      value={
                        searchQuery
                      }
                      onChange={(
                        event
                      ) =>
                        setSearchQuery(
                          event.target.value
                        )
                      }
                      className="w-full"
                    />
                  </div>

                  <Select
                    value={
                      filterType
                    }
                    onValueChange={
                      setFilterType
                    }
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue
                        placeholder={t(
                          "schemeType"
                        )}
                      />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="all">
                        {t(
                          "allTypes"
                        )}
                      </SelectItem>

                      <SelectItem value="subsidy">
                        {t(
                          "subsidy"
                        )}
                      </SelectItem>

                      <SelectItem value="income_support">
                        Income Support
                      </SelectItem>

                      <SelectItem value="loan">
                        {t(
                          "loan"
                        )}
                      </SelectItem>

                      <SelectItem value="credit">
                        Credit
                      </SelectItem>

                      <SelectItem value="insurance">
                        {t(
                          "insurance"
                        )}
                      </SelectItem>

                      <SelectItem value="pension">
                        Pension
                      </SelectItem>

                      <SelectItem value="training">
                        {t(
                          "training"
                        )}
                      </SelectItem>

                      <SelectItem value="equipment">
                        {t(
                          "equipment"
                        )}
                      </SelectItem>

                      <SelectItem value="skill_development">
                        Skill Development
                      </SelectItem>

                      <SelectItem value="technical_assistance">
                        Technical Assistance
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {allLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
              </div>
            ) : schemes.length ===
              0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Search className="h-16 w-16 mx-auto text-gray-400 mb-4" />

                  <h3 className="text-xl font-semibold mb-2">
                    {t(
                      "noSchemesFound"
                    )}
                  </h3>

                  <p className="text-gray-600">
                    {t(
                      "tryAdjustingSearch"
                    )}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {schemes.map(
                  (scheme) => (
                    <SchemeCard
                      key={
                        scheme._id
                      }
                      scheme={
                        scheme
                      }
                    />
                  )
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* =====================================================
            SCHEME DETAILS DIALOG
        ===================================================== */}

        {selectedScheme && (
          <Dialog
            open={
              !!selectedScheme
            }
            onOpenChange={() => {
              setSelectedScheme(
                null
              );

              setEligibilityError(
                ""
              );

              setEligibilityLoading(
                false
              );
            }}
          >
            <DialogContent className="sm:max-w-[750px] max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <DialogTitle className="text-2xl">
                      {
                        selectedScheme.schemeName
                      }
                    </DialogTitle>

                    <DialogDescription className="mt-2">
                      {selectedScheme.ministry &&
                        `${selectedScheme.ministry} • `}

                      {formatSchemeType(
                        selectedScheme.schemeType
                      )}
                    </DialogDescription>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Badge
                      className={
                        schemeTypeColors[
                          selectedScheme
                            .schemeType
                        ] ||
                        schemeTypeColors.other
                      }
                    >
                      {formatSchemeType(
                        selectedScheme.schemeType
                      )}
                    </Badge>

                    <EligibilityBadge
                      result={
                        selectedScheme
                          .eligibilityResult
                      }
                    />
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6">

                {/* =================================================
                    CHECK ELIGIBILITY
                ================================================= */}

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                        <Info className="h-4 w-4" />

                        Check your eligibility
                      </h4>

                      <p className="text-sm text-blue-800 mt-1">
                        FarmAI will compare
                        your farmer profile
                        with this scheme's
                        eligibility rules.
                      </p>
                    </div>

                    <Button
                      disabled={
                        eligibilityLoading
                      }
                      onClick={() =>
                        checkEligibility(
                          selectedScheme
                        )
                      }
                      className="bg-green-600 hover:bg-green-700 min-w-[190px]"
                    >
                      {eligibilityLoading ? (
                        <>
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />

                          Checking...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />

                          Check Eligibility
                        </>
                      )}
                    </Button>
                  </div>

                  {/* ERROR */}

                  {eligibilityError && (
                    <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3">
                      <div className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-600 mt-0.5" />

                        <div>
                          <p className="text-sm font-medium text-red-800">
                            Eligibility check
                            failed
                          </p>

                          <p className="text-sm text-red-700 mt-1">
                            {
                              eligibilityError
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* =================================================
                    ELIGIBILITY RESULT
                ================================================= */}

                {selectedScheme.eligibilityResult && (
                  <EligibilitySummary
                    result={
                      selectedScheme
                        .eligibilityResult
                    }
                  />
                )}

                {/* =================================================
                    COMPLETE PROFILE BUTTON
                ================================================= */}

                {selectedScheme
                  .eligibilityResult
                  ?.status ===
                  "profile_incomplete" && (
                  <Button
                    onClick={() =>
                      (window.location.href =
                        "/dashboard/profile")
                    }
                    className="w-full bg-yellow-600 hover:bg-yellow-700"
                  >
                    <UserRound className="h-4 w-4 mr-2" />

                    Complete Profile
                  </Button>
                )}

                {/* =================================================
                    DESCRIPTION
                ================================================= */}

                {selectedScheme.description && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Info className="h-4 w-4" />

                      {t(
                        "description"
                      )}
                    </h4>

                    <p className="text-gray-700 whitespace-pre-wrap">
                      {
                        selectedScheme.description
                      }
                    </p>
                  </div>
                )}

                {/* =================================================
                    BENEFITS
                ================================================= */}

                {selectedScheme.benefits && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />

                      {t(
                        "benefits"
                      )}
                    </h4>

                    <p className="text-gray-700 whitespace-pre-wrap">
                      {
                        selectedScheme.benefits
                      }
                    </p>
                  </div>
                )}

                {/* =================================================
                    ELIGIBILITY CRITERIA
                ================================================= */}

                {selectedScheme.eligibility &&
                  selectedScheme
                    .eligibility
                    .length >
                    0 && (
                    <div>
                      <h4 className="font-semibold mb-2">
                        {t(
                          "eligibilityCriteria"
                        )}
                      </h4>

                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        {selectedScheme.eligibility.map(
                          (
                            criteria,
                            index
                          ) => (
                            <li
                              key={
                                index
                              }
                            >
                              {
                                criteria
                              }
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                {/* =================================================
                    PASSED CRITERIA
                ================================================= */}

                {(
                  selectedScheme
                    .eligibilityResult
                    ?.passedCriteria
                    ?.length ?? 0
                ) > 0 && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />

                      Requirements
                      satisfied
                    </h4>

                    <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
                      {selectedScheme.eligibilityResult?.passedCriteria?.map(
                        (
                          item,
                          index
                        ) => (
                          <li
                            key={
                              index
                            }
                          >
                            {item}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {/* =================================================
                    FAILED CRITERIA
                ================================================= */}

                {(
                  selectedScheme
                    .eligibilityResult
                    ?.failedCriteria
                    ?.length ?? 0
                ) > 0 && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                      <XCircle className="h-4 w-4" />

                      Requirements
                      not satisfied
                    </h4>

                    <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                      {selectedScheme.eligibilityResult?.failedCriteria?.map(
                        (
                          item,
                          index
                        ) => (
                          <li
                            key={
                              index
                            }
                          >
                            {item}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {/* =================================================
                    MISSING INFORMATION
                ================================================= */}

                {(
                  selectedScheme
                    .eligibilityResult
                    ?.missingInformation
                    ?.length ?? 0
                ) > 0 && (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                    <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />

                      Information required
                    </h4>

                    <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
                      {selectedScheme.eligibilityResult?.missingInformation?.map(
                        (
                          item,
                          index
                        ) => (
                          <li
                            key={
                              index
                            }
                          >
                            {item}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {/* =================================================
                    DOCUMENTS
                ================================================= */}

                {getDocuments(
                  selectedScheme
                ).length >
                  0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />

                      {t(
                        "requiredDocuments"
                      )}
                    </h4>

                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {getDocuments(
                        selectedScheme
                      ).map(
                        (
                          document,
                          index
                        ) => (
                          <li
                            key={
                              index
                            }
                          >
                            {
                              document
                            }
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {/* =================================================
                    HOW TO APPLY
                ================================================= */}

                {getApplicationProcess(
                  selectedScheme
                ) && (
                  <div>
                    <h4 className="font-semibold mb-2">
                      {t(
                        "howToApply"
                      )}
                    </h4>

                    <p className="text-gray-700 whitespace-pre-wrap">
                      {getApplicationProcess(
                        selectedScheme
                      )}
                    </p>
                  </div>
                )}

                {/* =================================================
                    BUDGET
                ================================================= */}

                {selectedScheme.budgetAmount && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold mb-1">
                      {t(
                        "budgetAllocation"
                      )}
                    </h4>

                    <p className="text-2xl font-bold text-green-600">
                      {
                        selectedScheme.budgetAmount
                      }
                    </p>
                  </div>
                )}

                {/* =================================================
                    DEADLINE
                ================================================= */}

                {selectedScheme.deadline && (
                  <div className="p-4 bg-red-50 rounded-lg">
                    <h4 className="font-semibold mb-1">
                      {t(
                        "applicationDeadline"
                      )}
                    </h4>

                    <p className="text-lg font-semibold text-red-600">
                      {new Date(
                        selectedScheme.deadline
                      ).toLocaleDateString(
                        "en-IN",
                        {
                          day: "numeric",
                          month:
                            "long",
                          year:
                            "numeric",
                        }
                      )}
                    </p>
                  </div>
                )}

                {/* =================================================
                    CONTACT INFORMATION
                ================================================= */}

                {selectedScheme.contactInfo && (
                  <div>
                    <h4 className="font-semibold mb-2">
                      {t(
                        "contactInformation"
                      )}
                    </h4>

                    <div className="space-y-1 text-sm text-gray-700">
                      {selectedScheme
                        .contactInfo
                        .phone && (
                        <p>
                          📞{" "}
                          {t(
                            "phone"
                          )}
                          :{" "}
                          {
                            selectedScheme
                              .contactInfo
                              .phone
                          }
                        </p>
                      )}

                      {selectedScheme
                        .contactInfo
                        .email && (
                        <p>
                          📧{" "}
                          {t(
                            "email"
                          )}
                          :{" "}
                          {
                            selectedScheme
                              .contactInfo
                              .email
                          }
                        </p>
                      )}

                      {selectedScheme
                        .contactInfo
                        .address && (
                        <p>
                          📍{" "}
                          {t(
                            "address"
                          )}
                          :{" "}
                          {
                            selectedScheme
                              .contactInfo
                              .address
                          }
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* =================================================
                    ACTION BUTTONS
                ================================================= */}

                <div className="space-y-2 pt-2">

                  {/* CHECK ELIGIBILITY AGAIN */}

                  {selectedScheme
                    .eligibilityResult && (
                    <Button
                      disabled={
                        eligibilityLoading
                      }
                      onClick={() =>
                        checkEligibility(
                          selectedScheme
                        )
                      }
                      variant="outline"
                      className="w-full"
                    >
                      {eligibilityLoading ? (
                        <>
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2" />

                          Checking...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />

                          Check Again
                        </>
                      )}
                    </Button>
                  )}

                  {/* APPLICATION LINK */}

                  {getApplicationLink(
                    selectedScheme
                  ) && (
                    <Button
                      onClick={() =>
                        window.open(
                          getApplicationLink(
                            selectedScheme
                          ),
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />

                      Visit Official
                      Website / Apply
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}