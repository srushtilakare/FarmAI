"use client"

import { useState, useRef, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Camera, Mic, MicOff, AlertTriangle, CheckCircle, Info, 
  Loader2, Upload, Leaf, AlertCircle, Phone
} from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useLanguage } from "@/lib/i18n/LanguageContext"

// Supported crops
const SUPPORTED_CROPS = [
  { value: "apple", label: "🍎 Apple", labelHi: "🍎 सेब", labelMr: "🍎 सफरचंद" },
  { value: "cherry_(including_sour)", label: "🍒 Cherry", labelHi: "🍒 चेरी", labelMr: "🍒 चेरी" },
  { value: "corn_(maize)", label: "🌽 Corn (Maize)", labelHi: "🌽 मक्का", labelMr: "🌽 मका" },
  { value: "grape", label: "🍇 Grape", labelHi: "🍇 अंगूर", labelMr: "🍇 द्राक्ष" },
  { value: "peach", label: "🍑 Peach", labelHi: "🍑 आड़ू", labelMr: "🍑 पीच" },
  { value: "pepper_bell", label: "🫑 Pepper (Bell)", labelHi: "🫑 शिमला मिर्च", labelMr: "🫑 ढोबळी मिरची" },
  { value: "potato", label: "🥔 Potato", labelHi: "🥔 आलू", labelMr: "🥔 बटाटा" },
  { value: "strawberry", label: "🍓 Strawberry", labelHi: "🍓 स्ट्रॉबेरी", labelMr: "🍓 स्ट्रॉबेरी" },
  { value: "tomato", label: "🍅 Tomato", labelHi: "🍅 टमाटर", labelMr: "🍅 टोमॅटो" },
];

export default function DiseaseDetectionPage() {
  const { t } = useLanguage();
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [fileObject, setFileObject] = useState<File | null>(null)
  const [selectedCrop, setSelectedCrop] = useState<string>("tomato")
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en")
  const [isRecording, setIsRecording] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [textInput, setTextInput] = useState("")
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load user language preference
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const userData = JSON.parse(user);
        const lang = userData.preferredLanguage || "en-US";
        setSelectedLanguage(lang.split("-")[0]); // Extract "en" from "en-US"
      } catch (err) {
        console.error("Error parsing user data:", err);
      }
    }
  }, []);

  // Handle file upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setFileObject(file)
      setAnalysisResult(null)
      setError(null)
      const reader = new FileReader()
      reader.onload = (e) => setSelectedImage(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setFileObject(null)
    setAnalysisResult(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true)
      setTextInput("")
      setTimeout(() => {
        setIsRecording(false)
        setTextInput("My plant has brown spots on the leaves and they are wilting")
      }, 3000)
    } else {
      setIsRecording(false)
    }
  }

  const handleAnalyze = async () => {
    if (!fileObject) {
      setError("Please upload an image first!")
      return
    }

    setIsAnalyzing(true)
    setAnalysisResult(null)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("image", fileObject)

      const token = localStorage.getItem('token')
      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const res = await fetch(
        `http://localhost:5000/api/predict/${selectedCrop}?lang=${selectedLanguage}`,
        {
          method: "POST",
          headers,
          body: formData,
        }
      )

      const data = await res.json()

      if (!res.ok || data.error) {
        throw new Error(data.error || `Server error: ${res.status}`)
      }

      setAnalysisResult(data)
    } catch (err: any) {
      console.error("Analysis Error:", err)
      setError(err.message || "Failed to analyze the crop. Ensure your backend is running.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const severityVariant = useMemo(() => {
    if (!analysisResult?.severity) return "default"
    const severity = analysisResult.severity.toLowerCase()
    if (severity === "very high" || severity === "critical" || severity.includes("emergency")) return "destructive"
    if (severity === "high") return "destructive"
    if (severity === "moderate") return "warning"
    if (severity === "none" || analysisResult?.disease?.toLowerCase().includes("healthy")) return "success"
    return "default"
  }, [analysisResult])

  const getCropLabel = (crop: typeof SUPPORTED_CROPS[0]) => {
    if (selectedLanguage === "hi") return crop.labelHi
    if (selectedLanguage === "mr") return crop.labelMr
    return crop.label
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-foreground">
            <div className="p-2 rounded-full bg-red-500">
              <Camera className="h-8 w-8 text-white" />
            </div>
            {t("cropDiseaseDetection")}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t("uploadCropImage")}
          </p>
        </div>

        {/* Crop & Language Selection */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-green-600" />
              {t("selectCropAndLanguage")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("cropType")}</Label>
                <Select value={selectedCrop} onValueChange={setSelectedCrop}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_CROPS.map((crop) => (
                      <SelectItem key={crop.value} value={crop.value}>
                        {getCropLabel(crop)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("language")}</Label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">{t("english")}</SelectItem>
                    <SelectItem value="hi">{t("hindi")}</SelectItem>
                    <SelectItem value="mr">{t("marathi")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              {t("howItWorks")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { icon: Camera, step: `1. ${t("captureImage")}`, desc: t("captureImageDesc") },
                { icon: Mic, step: `2. ${t("addDetails")}`, desc: t("addDetailsDesc") },
                { icon: AlertTriangle, step: `3. ${t("aiAnalysis")}`, desc: t("aiAnalysisDesc") },
                { icon: CheckCircle, step: `4. ${t("getResults")}`, desc: t("getResultsDesc") },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="bg-primary/10 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium text-card-foreground">{item.step}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Image Upload */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>{t("uploadCropImage")}</CardTitle>
            <CardDescription>
              {t("uploadCropImageDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              {selectedImage ? (
                <div className="space-y-4">
                  <img
                    src={selectedImage}
                    alt="Uploaded crop"
                    className="max-w-full h-64 object-contain mx-auto rounded-lg shadow-md"
                  />
                  <Button variant="outline" onClick={removeImage}>
                    {t("removeImage")}
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-lg font-medium text-foreground mt-2">
                    {t("uploadOrCapture")}
                  </p>
                  <p className="text-sm text-muted-foreground">{t("imageFormats")}</p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />

                  <div className="mt-4">
                    <Button
                      variant="outline"
                      className="border-border bg-transparent"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="h-4 w-4 mr-2" /> {t("chooseFile")}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>{t("additionalInfo")}</CardTitle>
            <CardDescription>{t("additionalInfoDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Label htmlFor="symptoms">{t("describeSymptomsLabel")}</Label>
            <Textarea
              id="symptoms"
              placeholder={t("describeSymptomsPlaceholderText")}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="border-border focus-visible:ring-primary min-h-[100px]"
            />

            <Button
              variant="outline"
              onClick={toggleRecording}
              disabled={isRecording}
              className={`border-border transition-colors ${isRecording ? "bg-red-100 border-red-400 hover:bg-red-100" : ""}`}
            >
              {isRecording ? (
                <>
                  <MicOff className="h-4 w-4 mr-2 text-red-600" /> {t("stopRecording")}
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" /> {t("startVoiceInput")}
                </>
              )}
            </Button>

            {isRecording && <span className="text-sm text-red-500 animate-pulse ml-4">{t("recording")}</span>}
            {textInput && !isRecording && <span className="text-sm text-green-600 ml-4">{t("transcriptionReady")}</span>}
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Analyze Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleAnalyze}
            disabled={!fileObject || isAnalyzing}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 text-lg transition-all duration-200"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t("analyzing")}
              </>
            ) : (
              t("analyzeCrop")
            )}
          </Button>
        </div>

        {/* Analysis Results */}
        {analysisResult && (
          <Card className="border-border shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Analysis Complete: {analysisResult.name || analysisResult.disease}
              </CardTitle>
              <CardDescription>
                {analysisResult.description || "AI-powered results and tailored recommendations"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Summary Stats */}
              <div className="grid md:grid-cols-3 gap-6 border-b pb-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Disease Identified</h4>
                  <span className="text-xl font-bold text-foreground">
                    {analysisResult.name || analysisResult.disease}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Confidence</h4>
                  <Badge variant="secondary" className="text-lg py-1">
                    {analysisResult.confidence}%
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Severity</h4>
                  <Badge variant={severityVariant} className="text-lg py-1">
                    {analysisResult.severity}
                  </Badge>
                </div>
              </div>

              {/* Affected Parts */}
              {analysisResult.affectedParts && analysisResult.affectedParts.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-lg">Affected Plant Parts:</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.affectedParts.map((part: string, i: number) => (
                      <Badge key={i} variant="outline">
                        {part}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Causes */}
              {analysisResult.causes && analysisResult.causes.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 text-lg flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2 text-orange-500" /> Causes
                  </h3>
                  <ul className="space-y-2">
                    {analysisResult.causes.map((cause: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-orange-500 mt-1">•</span>
                        <span>{cause}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Separator />

              {/* Treatment and Prevention */}
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold mb-3 text-lg flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-red-500" /> Treatment Plan
                  </h3>
                  <ul className="space-y-3">
                    {analysisResult.treatment && analysisResult.treatment.map((step: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                        <span className="text-sm">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 text-lg flex items-center">
                    <Info className="h-5 w-5 mr-2 text-blue-500" /> Prevention Tips
                  </h3>
                  <ul className="space-y-3">
                    {analysisResult.prevention && analysisResult.prevention.map((tip: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
                        <span className="text-sm">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Organic Solution */}
              {analysisResult.organicSolution && analysisResult.organicSolution.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3 text-lg flex items-center text-green-700">
                      <Leaf className="h-5 w-5 mr-2 text-green-600" /> Organic Solutions
                    </h3>
                    <ul className="space-y-2 bg-green-50 p-4 rounded-lg">
                      {analysisResult.organicSolution.map((solution: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                          <span>{solution}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {/* Do's and Don'ts */}
              {analysisResult.doAndDont && (
                <>
                  <Separator />
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-3 text-lg text-green-700">✓ Do's</h3>
                      <ul className="space-y-2 bg-green-50 p-4 rounded-lg">
                        {analysisResult.doAndDont.do && analysisResult.doAndDont.do.map((item: string, i: number) => (
                          <li key={i} className="text-sm text-green-800">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-3 text-lg text-red-700">✗ Don'ts</h3>
                      <ul className="space-y-2 bg-red-50 p-4 rounded-lg">
                        {analysisResult.doAndDont.dont && analysisResult.doAndDont.dont.map((item: string, i: number) => (
                          <li key={i} className="text-sm text-red-800">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </>
              )}

              {/* Emergency Contact */}
              {analysisResult.emergencyContact && (
                <>
                  <Separator />
                  <Alert className="border-orange-500 bg-orange-50">
                    <Phone className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      <strong>Emergency:</strong> {analysisResult.emergencyContact}
                    </AlertDescription>
                  </Alert>
                </>
              )}

              {/* Disclaimer */}
              <p className="text-sm text-muted-foreground pt-4 border-t">
                ⚠️ Disclaimer: This is an AI-powered detection. Always consult a local agricultural expert (Krishi Vigyan Kendra or Agricultural Extension Officer) for critical decisions.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
