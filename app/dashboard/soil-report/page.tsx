'use client';

import { useState, useEffect } from 'react';
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, Leaf, Beaker, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/dashboard-layout';
import { useLanguage } from '@/lib/i18n/LanguageContext';

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
  soilParameters: {
    nitrogen: { value: number; unit: string; status: string };
    phosphorus: { value: number; unit: string; status: string };
    potassium: { value: number; unit: string; status: string };
    pH: { value: number; status: string };
    organicCarbon: { value: number; unit: string; status: string };
    [key: string]: any;
  };
  aiAnalysis: {
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
  createdAt: string;
}

const statusColors: { [key: string]: string } = {
  low: 'text-red-600',
  medium: 'text-yellow-600',
  high: 'text-green-600',
  unknown: 'text-gray-600'
};

const ratingColors: { [key: string]: string } = {
  excellent: 'bg-green-100 text-green-800',
  good: 'bg-blue-100 text-blue-800',
  moderate: 'bg-yellow-100 text-yellow-800',
  poor: 'bg-red-100 text-red-800'
};

export default function SoilReportPage() {
  const { t } = useLanguage();
  const [reports, setReports] = useState<SoilReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<SoilReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  // Form state
  const [uploadData, setUploadData] = useState({
    testDate: '',
    labName: '',
    state: '',
    district: '',
    village: ''
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/soil-report/my-reports', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports);
        if (data.reports.length > 0 && !selectedReport) {
          setSelectedReport(data.reports[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadReport = async () => {
    if (!selectedFile) {
      toast({
        title: 'No File Selected',
        description: 'Please select a soil report file to upload',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('report', selectedFile);
      formData.append('testDate', uploadData.testDate || new Date().toISOString());
      formData.append('labName', uploadData.labName || 'Soil Testing Lab');
      formData.append('location', JSON.stringify({
        state: uploadData.state,
        district: uploadData.district,
        village: uploadData.village
      }));

      const response = await fetch('http://localhost:5000/api/soil-report/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        // Log gamification activity
        await fetch('http://localhost:5000/api/gamification/log-activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            activityType: 'soil_upload',
            description: 'Uploaded soil report'
          })
        });

        toast({
          title: 'Success!',
          description: 'Soil report uploaded successfully. AI analysis in progress...'
        });
        setIsUploadDialogOpen(false);
        setSelectedFile(null);
        setUploadData({ testDate: '', labName: '', state: '', district: '', village: '' });
        
        // Refresh reports after a delay to allow processing
        setTimeout(() => {
          fetchReports();
        }, 2000);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload soil report',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Beaker className="h-8 w-8 text-green-600" />
            {t("soilHealthFertilizerGuidance")}
          </h1>
          <p className="text-gray-600 mt-1">
            {t("comprehensiveSoilAnalysis")}
          </p>
        </div>
        
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Upload className="h-4 w-4 mr-2" />
              {t("uploadSoilReport")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{t("uploadSoilReport")}</DialogTitle>
              <DialogDescription>
                {t("uploadReportFile")}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="file">{t("selectReportFile")} *</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  disabled={uploading}
                />
                <p className="text-xs text-gray-500">Accepted formats: PDF, JPG, PNG (Max 10MB)</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="testDate">{t("testDate")}</Label>
                  <Input
                    id="testDate"
                    type="date"
                    value={uploadData.testDate}
                    onChange={(e) => setUploadData({ ...uploadData, testDate: e.target.value })}
                    disabled={uploading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="labName">{t("labName")}</Label>
                  <Input
                    id="labName"
                    placeholder={t("labName")}
                    value={uploadData.labName}
                    onChange={(e) => setUploadData({ ...uploadData, labName: e.target.value })}
                    disabled={uploading}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state">{t("state")}</Label>
                  <Input
                    id="state"
                    placeholder={t("state")}
                    value={uploadData.state}
                    onChange={(e) => setUploadData({ ...uploadData, state: e.target.value })}
                    disabled={uploading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">{t("district")}</Label>
                  <Input
                    id="district"
                    placeholder={t("district")}
                    value={uploadData.district}
                    onChange={(e) => setUploadData({ ...uploadData, district: e.target.value })}
                    disabled={uploading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="village">{t("village")}</Label>
                  <Input
                    id="village"
                    placeholder={t("village")}
                    value={uploadData.village}
                    onChange={(e) => setUploadData({ ...uploadData, village: e.target.value })}
                    disabled={uploading}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)} disabled={uploading}>
                Cancel
              </Button>
              <Button onClick={uploadReport} disabled={uploading || !selectedFile} className="bg-green-600 hover:bg-green-700">
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("uploading")}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    {t("upload")}
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {reports.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Beaker className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t("noReportsYet")}</h3>
            <p className="text-gray-600 mb-4">
              {t("uploadFirstReport")}
            </p>
            <Button
              onClick={() => setIsUploadDialogOpen(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              {t("uploadSoilReport")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {/* Reports List */}
          <div className="space-y-3">
            <h3 className="font-semibold">Your Reports</h3>
            {reports.map((report) => (
              <Card
                key={report._id}
                className={`cursor-pointer transition-all ${
                  selectedReport?._id === report._id
                    ? 'ring-2 ring-green-600 bg-green-50'
                    : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedReport(report)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-sm">{report.labName}</p>
                        <p className="text-xs text-gray-500">{formatDate(report.testDate)}</p>
                      </div>
                    </div>
                    {report.processed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    )}
                  </div>
                  {report.processed && report.aiAnalysis && (
                    <Badge className={ratingColors[report.aiAnalysis.overallRating]}>
                      {report.aiAnalysis.overallRating}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Report Details */}
          {selectedReport && (
            <div className="md:col-span-2 space-y-6">
              {!selectedReport.processed ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Loader2 className="h-12 w-12 mx-auto animate-spin text-green-600 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Analysis in Progress</h3>
                    <p className="text-gray-600">
                      AI is analyzing your soil report. This may take a few minutes...
                    </p>
                  </CardContent>
                </Card>
              ) : selectedReport.aiAnalysis ? (
                <>
                  {/* Overall Health */}
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>Soil Health Summary</CardTitle>
                          <CardDescription>
                            {selectedReport.location.district}, {selectedReport.location.state}
                          </CardDescription>
                        </div>
                        <Badge className={ratingColors[selectedReport.aiAnalysis?.overallRating || 'good']}>
                          {(selectedReport.aiAnalysis?.overallRating || 'good').toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-700">{selectedReport.aiAnalysis?.soilHealthSummary || 'No summary available'}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Soil Type:</span>
                          <span className="ml-2 font-semibold">{selectedReport.aiAnalysis?.soilType || 'Unknown'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* NPK Values */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Soil Parameters (NPK)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Nitrogen (N)</p>
                          <p className={`text-2xl font-bold ${statusColors[selectedReport.soilParameters.nitrogen?.status]}`}>
                            {selectedReport.soilParameters.nitrogen?.value || 'N/A'}
                          </p>
                          <Badge variant="outline" className="mt-2">
                            {selectedReport.soilParameters.nitrogen?.status}
                          </Badge>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Phosphorus (P)</p>
                          <p className={`text-2xl font-bold ${statusColors[selectedReport.soilParameters.phosphorus?.status]}`}>
                            {selectedReport.soilParameters.phosphorus?.value || 'N/A'}
                          </p>
                          <Badge variant="outline" className="mt-2">
                            {selectedReport.soilParameters.phosphorus?.status}
                          </Badge>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Potassium (K)</p>
                          <p className={`text-2xl font-bold ${statusColors[selectedReport.soilParameters.potassium?.status]}`}>
                            {selectedReport.soilParameters.potassium?.value || 'N/A'}
                          </p>
                          <Badge variant="outline" className="mt-2">
                            {selectedReport.soilParameters.potassium?.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Suitable Crops */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Leaf className="h-5 w-5 text-green-600" />
                        Suitable Crops
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedReport.aiAnalysis?.suitableCrops?.map((crop, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">{crop.cropName}</h4>
                                <Badge variant="outline">{crop.suitabilityScore}% match</Badge>
                              </div>
                              <p className="text-sm text-gray-600">{crop.reason}</p>
                            </div>
                            <Progress value={crop.suitabilityScore} className="w-20" />
                          </div>
                        )) || <p className="text-gray-500 text-sm">No crop recommendations available</p>}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Fertilizer Recommendations */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        Fertilizer Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Recommended NPK Ratio</h4>
                        <p className="text-2xl font-bold text-green-600">
                          {selectedReport.aiAnalysis?.fertilizerRecommendation?.npkRatio || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Application Plan</h4>
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {selectedReport.aiAnalysis?.fertilizerRecommendation?.plan || 'No plan available'}
                        </p>
                      </div>
                      {selectedReport.aiAnalysis?.fertilizerRecommendation?.organicOptions?.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Organic Alternatives</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedReport.aiAnalysis.fertilizerRecommendation.organicOptions.map((option, idx) => (
                              <Badge key={idx} variant="outline" className="bg-green-50">
                                {option}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Correction Measures */}
                  {selectedReport.aiAnalysis.correctionMeasures?.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-orange-600" />
                          Correction Measures
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {selectedReport.aiAnalysis.correctionMeasures.map((measure, idx) => (
                            <div
                              key={idx}
                              className={`p-3 rounded-lg ${
                                measure.priority === 'high'
                                  ? 'bg-red-50 border border-red-200'
                                  : measure.priority === 'medium'
                                  ? 'bg-yellow-50 border border-yellow-200'
                                  : 'bg-blue-50 border border-blue-200'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-semibold">{measure.issue}</h4>
                                <Badge
                                  variant="outline"
                                  className={
                                    measure.priority === 'high'
                                      ? 'bg-red-100 text-red-800'
                                      : measure.priority === 'medium'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }
                                >
                                  {measure.priority}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-700">{measure.solution}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Seasonal Advice */}
                  {selectedReport.aiAnalysis.seasonalAdvice && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Seasonal Advice</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {selectedReport.aiAnalysis.seasonalAdvice}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <AlertCircle className="h-12 w-12 mx-auto text-red-600 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Analysis Failed</h3>
                    <p className="text-gray-600">
                      Unable to process this soil report. Please try uploading again.
                    </p>
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

