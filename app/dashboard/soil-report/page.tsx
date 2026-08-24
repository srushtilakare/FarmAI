'use client';

import { useState, useEffect } from 'react';
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Leaf,
  Beaker,
  TrendingUp
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/dashboard-layout';
import { useLanguage } from '@/lib/i18n/LanguageContext';

// =========================================================
// TYPES
// =========================================================

interface SoilParameter {
  value: number | null;
  unit?: string | null;
  status: string;
}

interface SoilParameters {
  nitrogen: SoilParameter;
  phosphorus: SoilParameter;
  potassium: SoilParameter;

  pH: {
    value: number | null;
    status: string;
  };

  electricalConductivity: SoilParameter;

  organicCarbon: SoilParameter;

  iron: SoilParameter;
  zinc: SoilParameter;
  manganese: SoilParameter;
  copper: SoilParameter;
  boron: SoilParameter;
  sulphur: SoilParameter;

  calcium: SoilParameter;
  magnesium: SoilParameter;

  [key: string]: any;
}

interface SoilReport {
  _id: string;

  location: {
    state?: string;
    district?: string;
    village?: string;
  };

  reportFile: {
    url: string;
    fileName: string;
    fileType: string;
  };

  testDate: string;
  labName: string;

  soilParameters: SoilParameters;

  aiAnalysis?: {
    soilHealthSummary: string;
    soilType: string;
    overallRating: string;

    suitableCrops: Array<{
      cropName: string;
      suitabilityScore: number;
      reason: string;
    }>;

    fertilizerRecommendation: {
      plan: string;
      npkRatio: string;
      organicOptions: string[];
      applicationSchedule: string;
    };

    correctionMeasures: Array<{
      issue: string;
      solution: string;
      priority: string;
    }>;

    seasonalAdvice: string;
  };

  processed: boolean;

  processingError?: string | null;

  createdAt: string;
}

// =========================================================
// STATUS COLORS
// =========================================================

const statusColors: { [key: string]: string } = {
  low: 'text-red-600',
  medium: 'text-yellow-600',
  high: 'text-green-600',

  reported: 'text-gray-700',
  not_reported: 'text-gray-500',

  acidic: 'text-red-600',
  near_neutral: 'text-green-600',
  alkaline: 'text-orange-600',

  normal: 'text-green-600',
  elevated: 'text-yellow-600',

  unknown: 'text-gray-600'
};

// =========================================================
// RATING COLORS
// =========================================================

const ratingColors: { [key: string]: string } = {
  excellent: 'bg-green-100 text-green-800',
  good: 'bg-blue-100 text-blue-800',
  moderate: 'bg-yellow-100 text-yellow-800',
  poor: 'bg-red-100 text-red-800'
};

// =========================================================
// HELPER: DISPLAY VALUE
// =========================================================

const displayValue = (
  parameter?: SoilParameter | null
) => {
  if (
    !parameter ||
    parameter.value === null ||
    parameter.value === undefined
  ) {
    return 'Not reported';
  }

  return parameter.value;
};

// =========================================================
// HELPER: DISPLAY UNIT
// =========================================================

const displayUnit = (
  parameter?: SoilParameter | null
) => {
  if (!parameter?.unit) {
    return '';
  }

  return parameter.unit;
};

// =========================================================
// HELPER: DISPLAY STATUS
// =========================================================

const displayStatus = (
  status?: string
) => {
  if (!status) {
    return 'not reported';
  }

  return status.replace(/_/g, ' ');
};

// =========================================================
// HELPER: LOCATION
// =========================================================

const getLocationText = (
  location?: SoilReport['location']
) => {
  if (!location) {
    return 'Location not provided';
  }

  const parts = [
    location.village,
    location.district,
    location.state
  ].filter(Boolean);

  return parts.length > 0
    ? parts.join(', ')
    : 'Location not provided';
};

// =========================================================
// MAIN COMPONENT
// =========================================================

export default function SoilReportPage() {
  const { t } = useLanguage();

  const [reports, setReports] = useState<SoilReport[]>([]);

  const [selectedReport, setSelectedReport] =
    useState<SoilReport | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [uploading, setUploading] =
    useState(false);

  const [isUploadDialogOpen, setIsUploadDialogOpen] =
    useState(false);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const { toast } = useToast();

  // =======================================================
  // FORM STATE
  // =======================================================

  const [uploadData, setUploadData] = useState({
    testDate: '',
    labName: '',
    state: '',
    district: '',
    village: ''
  });

  // =======================================================
  // FETCH REPORTS ON PAGE LOAD
  // =======================================================

  useEffect(() => {
    fetchReports();
  }, []);

  // =======================================================
  // FETCH USER REPORTS
  // =======================================================

  const fetchReports = async () => {
    try {
      const token =
        localStorage.getItem('token');

      const response = await fetch(
        'http://localhost:5000/api/soil-report/my-reports',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();

        const fetchedReports: SoilReport[] =
          data.reports || [];

        setReports(fetchedReports);

        if (
          fetchedReports.length > 0
        ) {
          setSelectedReport(
            currentSelected => {
              if (!currentSelected) {
                return fetchedReports[0];
              }

              const updatedSelected =
                fetchedReports.find(
                  report =>
                    report._id ===
                    currentSelected._id
                );

              return (
                updatedSelected ||
                fetchedReports[0]
              );
            }
          );
        }
      }
    } catch (error) {
      console.error(
        'Error fetching reports:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // =======================================================
  // UPLOAD REPORT
  // =======================================================

  const uploadReport = async () => {
    if (!selectedFile) {
      toast({
        title: 'No File Selected',
        description:
          'Please select a soil report file to upload',
        variant: 'destructive'
      });

      return;
    }

    setUploading(true);

    try {
      const token =
        localStorage.getItem('token');

      const formData = new FormData();

      formData.append(
        'report',
        selectedFile
      );

      formData.append(
        'testDate',
        uploadData.testDate ||
          new Date().toISOString()
      );

      formData.append(
        'labName',
        uploadData.labName ||
          'Soil Testing Lab'
      );

      formData.append(
        'location',
        JSON.stringify({
          state: uploadData.state,
          district: uploadData.district,
          village: uploadData.village
        })
      );

      const response = await fetch(
        'http://localhost:5000/api/soil-report/upload',
        {
          method: 'POST',

          headers: {
            Authorization: `Bearer ${token}`
          },

          body: formData
        }
      );

      if (!response.ok) {
        let errorMessage =
          'Failed to upload soil report';

        try {
          const errorData =
            await response.json();

          if (errorData?.error) {
            errorMessage =
              errorData.error;
          }
        } catch {
          // Keep default error message
        }

        throw new Error(errorMessage);
      }

      // ===================================================
      // GAMIFICATION ACTIVITY
      // ===================================================

      try {
        await fetch(
          'http://localhost:5000/api/gamification/log-activity',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`
            },

            body: JSON.stringify({
              activityType:
                'soil_upload',

              description:
                'Uploaded soil report'
            })
          }
        );
      } catch (error) {
        console.warn(
          'Gamification logging failed:',
          error
        );
      }

      // ===================================================
      // SUCCESS
      // ===================================================

      toast({
        title: 'Success!',
        description:
          'Soil report uploaded and processed successfully.'
      });

      setIsUploadDialogOpen(false);

      setSelectedFile(null);

      setUploadData({
        testDate: '',
        labName: '',
        state: '',
        district: '',
        village: ''
      });

      // ===================================================
      // REFRESH REPORTS
      // ===================================================

      await fetchReports();

    } catch (error) {
      console.error(
        'Error uploading soil report:',
        error
      );

      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to upload soil report',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  // =======================================================
  // FORMAT DATE
  // =======================================================

  const formatDate = (
    dateString: string
  ) => {
    if (!dateString) {
      return 'Date not available';
    }

    return new Date(
      dateString
    ).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // =======================================================
  // LOADING SCREEN
  // =======================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    );
  }

  // =======================================================
  // PAGE
  // =======================================================

  return (
    <DashboardLayout>

      <div className="container mx-auto p-6 space-y-6">

        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <div className="flex justify-between items-center">

          <div>

            <h1 className="text-3xl font-bold flex items-center gap-2">

              <Beaker className="h-8 w-8 text-green-600" />

              {t(
                'soilHealthFertilizerGuidance'
              )}

            </h1>

            <p className="text-gray-600 mt-1">
              {t(
                'comprehensiveSoilAnalysis'
              )}
            </p>

          </div>

          {/* =================================================
              UPLOAD BUTTON / DIALOG
          ================================================= */}

          <Dialog
            open={isUploadDialogOpen}
            onOpenChange={
              setIsUploadDialogOpen
            }
          >

            <DialogTrigger asChild>

              <Button className="bg-green-600 hover:bg-green-700">

                <Upload className="h-4 w-4 mr-2" />

                {t(
                  'uploadSoilReport'
                )}

              </Button>

            </DialogTrigger>

            <DialogContent className="sm:max-w-[500px]">

              <DialogHeader>

                <DialogTitle>
                  {t(
                    'uploadSoilReport'
                  )}
                </DialogTitle>

                <DialogDescription>
                  {t(
                    'uploadReportFile'
                  )}
                </DialogDescription>

              </DialogHeader>

              <div className="grid gap-4 py-4">

                {/* FILE */}

                <div className="space-y-2">

                  <Label htmlFor="file">
                    {t(
                      'selectReportFile'
                    )}{' '}
                    *
                  </Label>

                  <Input
                    id="file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={event =>
                      setSelectedFile(
                        event.target
                          .files?.[0] ||
                          null
                      )
                    }
                    disabled={uploading}
                  />

                  <p className="text-xs text-gray-500">
                    Accepted formats:
                    PDF, JPG, PNG
                    (Max 10MB)
                  </p>

                </div>

                {/* DATE + LAB */}

                <div className="grid grid-cols-2 gap-4">

                  <div className="space-y-2">

                    <Label htmlFor="testDate">
                      {t('testDate')}
                    </Label>

                    <Input
                      id="testDate"
                      type="date"
                      value={
                        uploadData.testDate
                      }
                      onChange={event =>
                        setUploadData({
                          ...uploadData,
                          testDate:
                            event.target
                              .value
                        })
                      }
                      disabled={uploading}
                    />

                  </div>

                  <div className="space-y-2">

                    <Label htmlFor="labName">
                      {t('labName')}
                    </Label>

                    <Input
                      id="labName"
                      placeholder={t(
                        'labName'
                      )}
                      value={
                        uploadData.labName
                      }
                      onChange={event =>
                        setUploadData({
                          ...uploadData,
                          labName:
                            event.target
                              .value
                        })
                      }
                      disabled={uploading}
                    />

                  </div>

                </div>

                {/* LOCATION */}

                <div className="grid grid-cols-3 gap-4">

                  <div className="space-y-2">

                    <Label htmlFor="state">
                      {t('state')}
                    </Label>

                    <Input
                      id="state"
                      placeholder={t(
                        'state'
                      )}
                      value={
                        uploadData.state
                      }
                      onChange={event =>
                        setUploadData({
                          ...uploadData,
                          state:
                            event.target
                              .value
                        })
                      }
                      disabled={uploading}
                    />

                  </div>

                  <div className="space-y-2">

                    <Label htmlFor="district">
                      {t('district')}
                    </Label>

                    <Input
                      id="district"
                      placeholder={t(
                        'district'
                      )}
                      value={
                        uploadData.district
                      }
                      onChange={event =>
                        setUploadData({
                          ...uploadData,
                          district:
                            event.target
                              .value
                        })
                      }
                      disabled={uploading}
                    />

                  </div>

                  <div className="space-y-2">

                    <Label htmlFor="village">
                      {t('village')}
                    </Label>

                    <Input
                      id="village"
                      placeholder={t(
                        'village'
                      )}
                      value={
                        uploadData.village
                      }
                      onChange={event =>
                        setUploadData({
                          ...uploadData,
                          village:
                            event.target
                              .value
                        })
                      }
                      disabled={uploading}
                    />

                  </div>

                </div>

              </div>

              {/* DIALOG BUTTONS */}

              <div className="flex justify-end gap-2">

                <Button
                  variant="outline"
                  onClick={() =>
                    setIsUploadDialogOpen(
                      false
                    )
                  }
                  disabled={uploading}
                >
                  Cancel
                </Button>

                <Button
                  onClick={uploadReport}
                  disabled={
                    uploading ||
                    !selectedFile
                  }
                  className="bg-green-600 hover:bg-green-700"
                >

                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />

                      {t(
                        'uploading'
                      )}
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />

                      {t('upload')}
                    </>
                  )}

                </Button>

              </div>

            </DialogContent>

          </Dialog>

        </div>

        {/* =================================================
            NO REPORTS
        ================================================= */}

        {reports.length === 0 ? (

          <Card className="text-center py-12">

            <CardContent>

              <Beaker className="h-16 w-16 mx-auto text-gray-400 mb-4" />

              <h3 className="text-xl font-semibold mb-2">
                {t('noReportsYet')}
              </h3>

              <p className="text-gray-600 mb-4">
                {t('uploadFirstReport')}
              </p>

              <Button
                onClick={() =>
                  setIsUploadDialogOpen(
                    true
                  )
                }
                className="bg-green-600 hover:bg-green-700"
              >

                <Upload className="h-4 w-4 mr-2" />

                {t(
                  'uploadSoilReport'
                )}

              </Button>

            </CardContent>

          </Card>

        ) : (

          <div className="grid md:grid-cols-3 gap-6">

            {/* =================================================
                REPORT LIST
            ================================================= */}

            <div className="space-y-3">

              <h3 className="font-semibold">
                Your Reports
              </h3>

              {reports.map(report => (

                <Card
                  key={report._id}
                  className={`cursor-pointer transition-all ${
                    selectedReport?._id ===
                    report._id
                      ? 'ring-2 ring-green-600 bg-green-50'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() =>
                    setSelectedReport(
                      report
                    )
                  }
                >

                  <CardContent className="p-4">

                    <div className="flex items-start justify-between mb-2">

                      <div className="flex items-center gap-2">

                        <FileText className="h-5 w-5 text-green-600" />

                        <div>

                          <p className="font-medium text-sm">
                            {report.labName}
                          </p>

                          <p className="text-xs text-gray-500">
                            {formatDate(
                              report.testDate
                            )}
                          </p>

                        </div>

                      </div>

                      {report.processed ? (

                        <CheckCircle2 className="h-5 w-5 text-green-600" />

                      ) : (

                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />

                      )}

                    </div>

                    {report.processed &&
                      report.aiAnalysis && (

                        <Badge
                          className={
                            ratingColors[
                              report
                                .aiAnalysis
                                .overallRating
                            ] ||
                            ratingColors
                              .moderate
                          }
                        >
                          {report
                            .aiAnalysis
                            .overallRating}
                        </Badge>

                      )}

                  </CardContent>

                </Card>

              ))}

            </div>

            {/* =================================================
                REPORT DETAILS
            ================================================= */}

            {selectedReport && (

              <div className="md:col-span-2 space-y-6">

                {/* =================================================
                    PROCESSING
                ================================================= */}

                {!selectedReport.processed ? (

                  <Card>

                    <CardContent className="py-12 text-center">

                      <Loader2 className="h-12 w-12 mx-auto animate-spin text-green-600 mb-4" />

                      <h3 className="text-xl font-semibold mb-2">
                        Analysis in Progress
                      </h3>

                      <p className="text-gray-600">
                        The soil report is being
                        processed. Please wait while
                        the laboratory values are
                        extracted.
                      </p>

                    </CardContent>

                  </Card>

                ) : selectedReport.aiAnalysis ? (

                  <>
                    {/* =================================================
                        PROCESSING WARNINGS
                    ================================================= */}

                    {selectedReport.processingError && (

                      <Card className="border-yellow-200 bg-yellow-50">

                        <CardContent className="p-4">

                          <div className="flex items-start gap-3">

                            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />

                            <div>

                              <h4 className="font-semibold text-yellow-900">
                                Report interpretation note
                              </h4>

                              <p className="text-sm text-yellow-800 mt-1">
                                Some values or units
                                could not be identified
                                confidently from the
                                uploaded report. Parameters
                                not reported by the
                                laboratory are shown as
                                &quot;Not reported&quot;.
                              </p>

                            </div>

                          </div>

                        </CardContent>

                      </Card>

                    )}

                    {/* =================================================
                        OVERALL HEALTH
                    ================================================= */}

                    <Card>

                      <CardHeader>

                        <div className="flex justify-between items-start">

                          <div>

                            <CardTitle>
                              Soil Health Summary
                            </CardTitle>

                            <CardDescription>
                              {getLocationText(
                                selectedReport.location
                              )}
                            </CardDescription>

                          </div>

                          <Badge
                            className={
                              ratingColors[
                                selectedReport
                                  .aiAnalysis
                                  ?.overallRating ||
                                  'moderate'
                              ] ||
                              ratingColors
                                .moderate
                            }
                          >
                            {(
                              selectedReport
                                .aiAnalysis
                                ?.overallRating ||
                              'moderate'
                            ).toUpperCase()}
                          </Badge>

                        </div>

                      </CardHeader>

                      <CardContent className="space-y-4">

                        <p className="text-gray-700">
                          {selectedReport
                            .aiAnalysis
                            ?.soilHealthSummary ||
                            'No summary available'}
                        </p>

                        <div className="flex items-center gap-4 text-sm">

                          <div>

                            <span className="text-gray-600">
                              Soil Type:
                            </span>

                            <span className="ml-2 font-semibold">
                              {selectedReport
                                .aiAnalysis
                                ?.soilType ||
                                'Not reported'}
                            </span>

                          </div>

                        </div>

                      </CardContent>

                    </Card>

                    {/* =================================================
                        NPK
                    ================================================= */}

                    <Card>

                      <CardHeader>

                        <CardTitle>
                          Soil Parameters (NPK)
                        </CardTitle>

                        <CardDescription>
                          Values extracted from
                          the laboratory report
                        </CardDescription>

                      </CardHeader>

                      <CardContent>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                          {/* NITROGEN */}

                          <div className="text-center p-4 bg-gray-50 rounded-lg">

                            <p className="text-sm text-gray-600 mb-1">
                              Nitrogen (N)
                            </p>

                            <p
                              className={`text-2xl font-bold ${
                                statusColors[
                                  selectedReport
                                    .soilParameters
                                    ?.nitrogen
                                    ?.status
                                ] ||
                                'text-gray-600'
                              }`}
                            >
                              {displayValue(
                                selectedReport
                                  .soilParameters
                                  ?.nitrogen
                              )}
                            </p>

                            {displayUnit(
                              selectedReport
                                .soilParameters
                                ?.nitrogen
                            ) && (

                              <p className="text-xs text-gray-500 mt-1">
                                {displayUnit(
                                  selectedReport
                                    .soilParameters
                                    ?.nitrogen
                                )}
                              </p>

                            )}

                            <Badge
                              variant="outline"
                              className="mt-2"
                            >
                              {displayStatus(
                                selectedReport
                                  .soilParameters
                                  ?.nitrogen
                                  ?.status
                              )}
                            </Badge>

                          </div>

                          {/* PHOSPHORUS */}

                          <div className="text-center p-4 bg-gray-50 rounded-lg">

                            <p className="text-sm text-gray-600 mb-1">
                              Phosphorus (P)
                            </p>

                            <p
                              className={`text-2xl font-bold ${
                                statusColors[
                                  selectedReport
                                    .soilParameters
                                    ?.phosphorus
                                    ?.status
                                ] ||
                                'text-gray-600'
                              }`}
                            >
                              {displayValue(
                                selectedReport
                                  .soilParameters
                                  ?.phosphorus
                              )}
                            </p>

                            {displayUnit(
                              selectedReport
                                .soilParameters
                                ?.phosphorus
                            ) && (

                              <p className="text-xs text-gray-500 mt-1">
                                {displayUnit(
                                  selectedReport
                                    .soilParameters
                                    ?.phosphorus
                                )}
                              </p>

                            )}

                            <Badge
                              variant="outline"
                              className="mt-2"
                            >
                              {displayStatus(
                                selectedReport
                                  .soilParameters
                                  ?.phosphorus
                                  ?.status
                              )}
                            </Badge>

                          </div>

                          {/* POTASSIUM */}

                          <div className="text-center p-4 bg-gray-50 rounded-lg">

                            <p className="text-sm text-gray-600 mb-1">
                              Potassium (K)
                            </p>

                            <p
                              className={`text-2xl font-bold ${
                                statusColors[
                                  selectedReport
                                    .soilParameters
                                    ?.potassium
                                    ?.status
                                ] ||
                                'text-gray-600'
                              }`}
                            >
                              {displayValue(
                                selectedReport
                                  .soilParameters
                                  ?.potassium
                              )}
                            </p>

                            {displayUnit(
                              selectedReport
                                .soilParameters
                                ?.potassium
                            ) && (

                              <p className="text-xs text-gray-500 mt-1">
                                {displayUnit(
                                  selectedReport
                                    .soilParameters
                                    ?.potassium
                                )}
                              </p>

                            )}

                            <Badge
                              variant="outline"
                              className="mt-2"
                            >
                              {displayStatus(
                                selectedReport
                                  .soilParameters
                                  ?.potassium
                                  ?.status
                              )}
                            </Badge>

                          </div>

                        </div>

                      </CardContent>

                    </Card>

                    {/* =================================================
                        OTHER SOIL PARAMETERS
                    ================================================= */}

                    <Card>

                      <CardHeader>

                        <CardTitle>
                          Soil Properties
                        </CardTitle>

                        <CardDescription>
                          Additional parameters found
                          in the laboratory report
                        </CardDescription>

                      </CardHeader>

                      <CardContent>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">

                          {/* pH */}

                          <div className="p-4 bg-gray-50 rounded-lg">

                            <p className="text-sm text-gray-600">
                              pH
                            </p>

                            <p
                              className={`text-xl font-bold mt-1 ${
                                statusColors[
                                  selectedReport
                                    .soilParameters
                                    ?.pH
                                    ?.status
                                ] ||
                                'text-gray-600'
                              }`}
                            >
                              {selectedReport
                                .soilParameters
                                ?.pH
                                ?.value !== null &&
                              selectedReport
                                .soilParameters
                                ?.pH
                                ?.value !== undefined
                                ? selectedReport
                                    .soilParameters
                                    .pH.value
                                : 'Not reported'}
                            </p>

                            <Badge
                              variant="outline"
                              className="mt-2"
                            >
                              {displayStatus(
                                selectedReport
                                  .soilParameters
                                  ?.pH
                                  ?.status
                              )}
                            </Badge>

                          </div>

                          {/* EC */}

                          <div className="p-4 bg-gray-50 rounded-lg">

                            <p className="text-sm text-gray-600">
                              Electrical Conductivity
                            </p>

                            <p
                              className={`text-xl font-bold mt-1 ${
                                statusColors[
                                  selectedReport
                                    .soilParameters
                                    ?.electricalConductivity
                                    ?.status
                                ] ||
                                'text-gray-600'
                              }`}
                            >
                              {displayValue(
                                selectedReport
                                  .soilParameters
                                  ?.electricalConductivity
                              )}
                            </p>

                            {displayUnit(
                              selectedReport
                                .soilParameters
                                ?.electricalConductivity
                            ) && (

                              <p className="text-xs text-gray-500 mt-1">
                                {displayUnit(
                                  selectedReport
                                    .soilParameters
                                    ?.electricalConductivity
                                )}
                              </p>

                            )}

                            <Badge
                              variant="outline"
                              className="mt-2"
                            >
                              {displayStatus(
                                selectedReport
                                  .soilParameters
                                  ?.electricalConductivity
                                  ?.status
                              )}
                            </Badge>

                          </div>

                          {/* ORGANIC CARBON */}

                          <div className="p-4 bg-gray-50 rounded-lg">

                            <p className="text-sm text-gray-600">
                              Organic Carbon
                            </p>

                            <p
                              className={`text-xl font-bold mt-1 ${
                                statusColors[
                                  selectedReport
                                    .soilParameters
                                    ?.organicCarbon
                                    ?.status
                                ] ||
                                'text-gray-600'
                              }`}
                            >
                              {displayValue(
                                selectedReport
                                  .soilParameters
                                  ?.organicCarbon
                              )}
                            </p>

                            {displayUnit(
                              selectedReport
                                .soilParameters
                                ?.organicCarbon
                            ) && (

                              <p className="text-xs text-gray-500 mt-1">
                                {displayUnit(
                                  selectedReport
                                    .soilParameters
                                    ?.organicCarbon
                                )}
                              </p>

                            )}

                            <Badge
                              variant="outline"
                              className="mt-2"
                            >
                              {displayStatus(
                                selectedReport
                                  .soilParameters
                                  ?.organicCarbon
                                  ?.status
                              )}
                            </Badge>

                          </div>

                        </div>

                      </CardContent>

                    </Card>

                    {/* =================================================
                        MICRO + SECONDARY NUTRIENTS
                    ================================================= */}

                    <Card>

                      <CardHeader>

                        <CardTitle>
                          Additional Nutrients
                        </CardTitle>

                        <CardDescription>
                          Micronutrients and secondary
                          nutrients reported by the laboratory
                        </CardDescription>

                      </CardHeader>

                      <CardContent>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">

                          {/* IRON */}

                          <div className="p-4 bg-gray-50 rounded-lg">

                            <p className="text-sm text-gray-600">
                              Iron (Fe)
                            </p>

                            <p
                              className={`text-xl font-bold mt-1 ${
                                statusColors[
                                  selectedReport
                                    .soilParameters
                                    ?.iron
                                    ?.status
                                ] ||
                                'text-gray-600'
                              }`}
                            >
                              {displayValue(
                                selectedReport
                                  .soilParameters
                                  ?.iron
                              )}
                            </p>

                            {displayUnit(
                              selectedReport
                                .soilParameters
                                ?.iron
                            ) && (

                              <p className="text-xs text-gray-500 mt-1">
                                {displayUnit(
                                  selectedReport
                                    .soilParameters
                                    ?.iron
                                )}
                              </p>

                            )}

                          </div>

                          {/* ZINC */}

                          <div className="p-4 bg-gray-50 rounded-lg">

                            <p className="text-sm text-gray-600">
                              Zinc (Zn)
                            </p>

                            <p
                              className={`text-xl font-bold mt-1 ${
                                statusColors[
                                  selectedReport
                                    .soilParameters
                                    ?.zinc
                                    ?.status
                                ] ||
                                'text-gray-600'
                              }`}
                            >
                              {displayValue(
                                selectedReport
                                  .soilParameters
                                  ?.zinc
                              )}
                            </p>

                            {displayUnit(
                              selectedReport
                                .soilParameters
                                ?.zinc
                            ) && (

                              <p className="text-xs text-gray-500 mt-1">
                                {displayUnit(
                                  selectedReport
                                    .soilParameters
                                    ?.zinc
                                )}
                              </p>

                            )}

                          </div>

                          {/* MANGANESE */}

                          <div className="p-4 bg-gray-50 rounded-lg">

                            <p className="text-sm text-gray-600">
                              Manganese (Mn)
                            </p>

                            <p
                              className={`text-xl font-bold mt-1 ${
                                statusColors[
                                  selectedReport
                                    .soilParameters
                                    ?.manganese
                                    ?.status
                                ] ||
                                'text-gray-600'
                              }`}
                            >
                              {displayValue(
                                selectedReport
                                  .soilParameters
                                  ?.manganese
                              )}
                            </p>

                            {displayUnit(
                              selectedReport
                                .soilParameters
                                ?.manganese
                            ) && (

                              <p className="text-xs text-gray-500 mt-1">
                                {displayUnit(
                                  selectedReport
                                    .soilParameters
                                    ?.manganese
                                )}
                              </p>

                            )}

                          </div>

                          {/* COPPER */}

                          <div className="p-4 bg-gray-50 rounded-lg">

                            <p className="text-sm text-gray-600">
                              Copper (Cu)
                            </p>

                            <p
                              className={`text-xl font-bold mt-1 ${
                                statusColors[
                                  selectedReport
                                    .soilParameters
                                    ?.copper
                                    ?.status
                                ] ||
                                'text-gray-600'
                              }`}
                            >
                              {displayValue(
                                selectedReport
                                  .soilParameters
                                  ?.copper
                              )}
                            </p>

                            {displayUnit(
                              selectedReport
                                .soilParameters
                                ?.copper
                            ) && (

                              <p className="text-xs text-gray-500 mt-1">
                                {displayUnit(
                                  selectedReport
                                    .soilParameters
                                    ?.copper
                                )}
                              </p>

                            )}

                          </div>

                          {/* BORON */}

                          <div className="p-4 bg-gray-50 rounded-lg">

                            <p className="text-sm text-gray-600">
                              Boron (B)
                            </p>

                            <p
                              className={`text-xl font-bold mt-1 ${
                                statusColors[
                                  selectedReport
                                    .soilParameters
                                    ?.boron
                                    ?.status
                                ] ||
                                'text-gray-600'
                              }`}
                            >
                              {displayValue(
                                selectedReport
                                  .soilParameters
                                  ?.boron
                              )}
                            </p>

                            {displayUnit(
                              selectedReport
                                .soilParameters
                                ?.boron
                            ) && (

                              <p className="text-xs text-gray-500 mt-1">
                                {displayUnit(
                                  selectedReport
                                    .soilParameters
                                    ?.boron
                                )}
                              </p>

                            )}

                          </div>

                          {/* SULPHUR */}

                          <div className="p-4 bg-gray-50 rounded-lg">

                            <p className="text-sm text-gray-600">
                              Sulphur (S)
                            </p>

                            <p
                              className={`text-xl font-bold mt-1 ${
                                statusColors[
                                  selectedReport
                                    .soilParameters
                                    ?.sulphur
                                    ?.status
                                ] ||
                                'text-gray-600'
                              }`}
                            >
                              {displayValue(
                                selectedReport
                                  .soilParameters
                                  ?.sulphur
                              )}
                            </p>

                            {displayUnit(
                              selectedReport
                                .soilParameters
                                ?.sulphur
                            ) && (

                              <p className="text-xs text-gray-500 mt-1">
                                {displayUnit(
                                  selectedReport
                                    .soilParameters
                                    ?.sulphur
                                )}
                              </p>

                            )}

                          </div>

                          {/* CALCIUM */}

                          <div className="p-4 bg-gray-50 rounded-lg">

                            <p className="text-sm text-gray-600">
                              Calcium (Ca)
                            </p>

                            <p
                              className={`text-xl font-bold mt-1 ${
                                statusColors[
                                  selectedReport
                                    .soilParameters
                                    ?.calcium
                                    ?.status
                                ] ||
                                'text-gray-600'
                              }`}
                            >
                              {displayValue(
                                selectedReport
                                  .soilParameters
                                  ?.calcium
                              )}
                            </p>

                            {displayUnit(
                              selectedReport
                                .soilParameters
                                ?.calcium
                            ) && (

                              <p className="text-xs text-gray-500 mt-1">
                                {displayUnit(
                                  selectedReport
                                    .soilParameters
                                    ?.calcium
                                )}
                              </p>

                            )}

                          </div>

                          {/* MAGNESIUM */}

                          <div className="p-4 bg-gray-50 rounded-lg">

                            <p className="text-sm text-gray-600">
                              Magnesium (Mg)
                            </p>

                            <p
                              className={`text-xl font-bold mt-1 ${
                                statusColors[
                                  selectedReport
                                    .soilParameters
                                    ?.magnesium
                                    ?.status
                                ] ||
                                'text-gray-600'
                              }`}
                            >
                              {displayValue(
                                selectedReport
                                  .soilParameters
                                  ?.magnesium
                              )}
                            </p>

                            {displayUnit(
                              selectedReport
                                .soilParameters
                                ?.magnesium
                            ) && (

                              <p className="text-xs text-gray-500 mt-1">
                                {displayUnit(
                                  selectedReport
                                    .soilParameters
                                    ?.magnesium
                                )}
                              </p>

                            )}

                          </div>

                        </div>

                      </CardContent>

                    </Card>

                    {/* =================================================
                        SUITABLE CROPS
                    ================================================= */}

                    <Card>

                      <CardHeader>

                        <CardTitle className="flex items-center gap-2">

                          <Leaf className="h-5 w-5 text-green-600" />

                          Suitable Crops

                        </CardTitle>

                      </CardHeader>

                      <CardContent>

                        <div className="space-y-3">

                          {selectedReport
                            .aiAnalysis
                            ?.suitableCrops
                            ?.map(
                              (
                                crop,
                                idx
                              ) => (

                                <div
                                  key={idx}
                                  className="flex items-start gap-3 p-3 bg-green-50 rounded-lg"
                                >

                                  <div className="flex-1">

                                    <div className="flex items-center gap-2 mb-1">

                                      <h4 className="font-semibold">
                                        {crop.cropName}
                                      </h4>

                                      {crop.suitabilityScore >
                                        0 && (

                                        <Badge variant="outline">
                                          {
                                            crop.suitabilityScore
                                          }
                                          % match
                                        </Badge>

                                      )}

                                    </div>

                                    <p className="text-sm text-gray-600">
                                      {crop.reason}
                                    </p>

                                  </div>

                                  {crop.suitabilityScore >
                                    0 && (

                                    <Progress
                                      value={
                                        crop.suitabilityScore
                                      }
                                      className="w-20"
                                    />

                                  )}

                                </div>

                              )
                            )}

                          {(!selectedReport
                            .aiAnalysis
                            ?.suitableCrops ||
                            selectedReport
                              .aiAnalysis
                              .suitableCrops
                              .length === 0) && (

                            <p className="text-gray-500 text-sm">
                              No crop recommendations
                              available.
                            </p>

                          )}

                        </div>

                      </CardContent>

                    </Card>

                    {/* =================================================
                        FERTILIZER RECOMMENDATIONS
                    ================================================= */}

                    <Card>

                      <CardHeader>

                        <CardTitle className="flex items-center gap-2">

                          <TrendingUp className="h-5 w-5 text-green-600" />

                          Fertilizer Recommendations

                        </CardTitle>

                      </CardHeader>

                      <CardContent className="space-y-4">

                        {/* NPK RATIO */}

                        <div>

                          <h4 className="font-medium mb-2">
                            Recommended NPK Ratio
                          </h4>

                          <p className="text-2xl font-bold text-green-600">
                            {selectedReport
                              .aiAnalysis
                              ?.fertilizerRecommendation
                              ?.npkRatio ||
                              'Not available'}
                          </p>

                        </div>

                        {/* PLAN */}

                        <div>

                          <h4 className="font-medium mb-2">
                            Application Plan
                          </h4>

                          <p className="text-gray-700 whitespace-pre-wrap">
                            {selectedReport
                              .aiAnalysis
                              ?.fertilizerRecommendation
                              ?.plan ||
                              'No plan available'}
                          </p>

                        </div>

                        {/* ORGANIC OPTIONS */}

                        {selectedReport
                          .aiAnalysis
                          ?.fertilizerRecommendation
                          ?.organicOptions
                          ?.length > 0 && (

                          <div>

                            <h4 className="font-medium mb-2">
                              Organic Alternatives
                            </h4>

                            <div className="flex flex-wrap gap-2">

                              {selectedReport
                                .aiAnalysis
                                .fertilizerRecommendation
                                .organicOptions
                                .map(
                                  (
                                    option,
                                    idx
                                  ) => (

                                    <Badge
                                      key={idx}
                                      variant="outline"
                                      className="bg-green-50"
                                    >
                                      {option}
                                    </Badge>

                                  )
                                )}

                            </div>

                          </div>

                        )}

                        {/* APPLICATION SCHEDULE */}

                        {selectedReport
                          .aiAnalysis
                          ?.fertilizerRecommendation
                          ?.applicationSchedule && (

                          <div>

                            <h4 className="font-medium mb-2">
                              Application Schedule
                            </h4>

                            <p className="text-gray-700">
                              {selectedReport
                                .aiAnalysis
                                .fertilizerRecommendation
                                .applicationSchedule}
                            </p>

                          </div>

                        )}

                      </CardContent>

                    </Card>

                    {/* =================================================
                        CORRECTION MEASURES
                    ================================================= */}

                    {selectedReport
                      .aiAnalysis
                      ?.correctionMeasures
                      ?.length > 0 && (

                      <Card>

                        <CardHeader>

                          <CardTitle className="flex items-center gap-2">

                            <AlertCircle className="h-5 w-5 text-orange-600" />

                            Correction Measures

                          </CardTitle>

                        </CardHeader>

                        <CardContent>

                          <div className="space-y-3">

                            {selectedReport
                              .aiAnalysis
                              .correctionMeasures
                              .map(
                                (
                                  measure,
                                  idx
                                ) => (

                                  <div
                                    key={idx}
                                    className={`p-3 rounded-lg ${
                                      measure.priority ===
                                      'high'
                                        ? 'bg-red-50 border border-red-200'
                                        : measure.priority ===
                                          'medium'
                                        ? 'bg-yellow-50 border border-yellow-200'
                                        : 'bg-blue-50 border border-blue-200'
                                    }`}
                                  >

                                    <div className="flex items-start justify-between mb-2">

                                      <h4 className="font-semibold">
                                        {measure.issue}
                                      </h4>

                                      <Badge
                                        variant="outline"
                                        className={
                                          measure.priority ===
                                          'high'
                                            ? 'bg-red-100 text-red-800'
                                            : measure.priority ===
                                              'medium'
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-blue-100 text-blue-800'
                                        }
                                      >
                                        {
                                          measure.priority
                                        }
                                      </Badge>

                                    </div>

                                    <p className="text-sm text-gray-700">
                                      {
                                        measure.solution
                                      }
                                    </p>

                                  </div>

                                )
                              )}

                          </div>

                        </CardContent>

                      </Card>

                    )}

                    {/* =================================================
                        SEASONAL ADVICE
                    ================================================= */}

                    {selectedReport
                      .aiAnalysis
                      ?.seasonalAdvice && (

                      <Card>

                        <CardHeader>

                          <CardTitle>
                            Seasonal Advice
                          </CardTitle>

                        </CardHeader>

                        <CardContent>

                          <p className="text-gray-700 whitespace-pre-wrap">
                            {
                              selectedReport
                                .aiAnalysis
                                .seasonalAdvice
                            }
                          </p>

                        </CardContent>

                      </Card>

                    )}

                  </>

                ) : (

                  /* =================================================
                     ANALYSIS FAILED
                  ================================================= */

                  <Card>

                    <CardContent className="py-12 text-center">

                      <AlertCircle className="h-12 w-12 mx-auto text-red-600 mb-4" />

                      <h3 className="text-xl font-semibold mb-2">
                        Analysis Failed
                      </h3>

                      <p className="text-gray-600">
                        Unable to process this
                        soil report. Please try
                        uploading again.
                      </p>

                      {selectedReport.processingError && (

                        <p className="text-sm text-red-600 mt-3">
                          {
                            selectedReport
                              .processingError
                          }
                        </p>

                      )}

                    </CardContent>

                  </Card>

                )}

              </div>

            )}

          </div>

        )}

      </div>

    </DashboardLayout>
  );
}