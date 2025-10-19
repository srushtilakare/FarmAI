"use client"

import { useState, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Camera, Mic, MicOff, AlertTriangle, CheckCircle, Info, Loader2, Upload } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function DiseaseDetectionPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [fileObject, setFileObject] = useState<File | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [textInput, setTextInput] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle file upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Upload triggered", event.target.files)
    const file = event.target.files?.[0]
    if (file) {
      setFileObject(file)
      setAnalysisResult(null)
      const reader = new FileReader()
      reader.onload = (e) => setSelectedImage(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setFileObject(null)
    setAnalysisResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true)
      setTextInput("")
      setTimeout(() => {
        setIsRecording(false)
        setTextInput("My tomato plants have brown spots on the leaves and they are wilting")
      }, 3000)
    } else {
      setIsRecording(false)
    }
  }

  const handleAnalyze = async () => {
    if (!fileObject) {
      alert("Please upload an image first!")
      return
    }

    setIsAnalyzing(true)
    setAnalysisResult(null)

    try {
      const formData = new FormData()
      formData.append("image", fileObject)

      const res = await fetch("http://127.0.0.1:5000/predict/tomato", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (res.status !== 200 || data.error) {
        throw new Error(data.error || `Server error: ${res.status}`)
      }

      const isHealthy = data.disease?.toLowerCase() === "healthy"
      const severity =
        data.severity ||
        (isHealthy ? "None" : data.confidence > 85 ? "High" : "Moderate")

      setAnalysisResult({
        disease: data.disease,
        confidence: Math.round(data.confidence),
        severity: severity,
        affectedArea: isHealthy ? "None" : "Leaves, Stem",
        treatment: isHealthy
          ? ["No treatment needed, continue regular care."]
          : [
              "Apply recommended fungicide (e.g., Chlorothalonil or Mancozeb)",
              "Remove and destroy severely affected leaves",
              "Ensure good air circulation around plants",
              "Water at the base to keep leaves dry",
            ],
        prevention: isHealthy
          ? ["Maintain healthy plants", "Regularly monitor for early signs"]
          : [
              "Use disease-resistant varieties",
              "Practice crop rotation",
              "Sanitize tools regularly",
              "Mulch to prevent soil splash onto leaves",
            ],
      })
    } catch (err) {
      console.error("Analysis Error:", err)
      alert(
        "Failed to analyze the crop. Ensure your backend is running at http://127.0.0.1:5000"
      )
    } finally {
      setIsAnalyzing(false)
    }
  }

  const severityVariant = useMemo(() => {
    if (analysisResult?.severity === "High") return "destructive"
    if (analysisResult?.severity === "Moderate") return "warning"
    if (analysisResult?.severity === "None" || analysisResult?.disease?.toLowerCase() === "healthy") return "success"
    return "default"
  }, [analysisResult])

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Crop Disease Detection</h1>
          <p className="text-muted-foreground mt-2">
            Upload an image of your crop and get instant AI-powered disease identification with treatment recommendations
          </p>
        </div>

        {/* How It Works */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { icon: Camera, step: "1. Capture Image", desc: "Take a clear photo of affected crop" },
                { icon: Mic, step: "2. Add Details", desc: "Describe symptoms via text or voice" },
                { icon: AlertTriangle, step: "3. AI Analysis", desc: "AI identifies crop disease" },
                { icon: CheckCircle, step: "4. Get Results", desc: "Receive treatment & prevention tips" },
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
            <CardTitle>Upload Crop Image</CardTitle>
            <CardDescription>
              Take a clear photo of the affected crop area (e.g., a single leaf)
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
                    Remove Image
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-lg font-medium text-foreground mt-2">
                    Upload or capture an image
                  </p>
                  <p className="text-sm text-muted-foreground">PNG, JPG up to 10MB</p>

                  {/* Native file input */}
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
                      <Camera className="h-4 w-4 mr-2" /> Choose File
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
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>Provide more details about the symptoms you observe</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Label htmlFor="symptoms">Describe the symptoms</Label>
            <Textarea
              id="symptoms"
              placeholder="Describe what you observe: color changes, spots, wilting, etc."
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
                  <MicOff className="h-4 w-4 mr-2 text-red-600" /> Stop Recording (Simulated)
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" /> Start Voice Input (Simulated)
                </>
              )}
            </Button>

            {isRecording && <span className="text-sm text-red-500 animate-pulse ml-4">Recording...</span>}
            {textInput && !isRecording && <span className="text-sm text-green-600 ml-4">Transcription Ready.</span>}
          </CardContent>
        </Card>

        {/* Analyze Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleAnalyze}
            disabled={!fileObject || isAnalyzing}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 text-lg transition-all duration-200"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing...
              </>
            ) : (
              "Analyze Crop"
            )}
          </Button>
        </div>

        {/* Analysis Results */}
        {analysisResult && (
          <Card className="border-border shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Analysis Complete: {analysisResult.disease}
              </CardTitle>
              <CardDescription>AI-powered results and tailored recommendations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid md:grid-cols-3 gap-6 border-b pb-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Disease Identified</h4>
                  <span className="text-xl font-bold text-foreground">{analysisResult.disease}</span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Confidence</h4>
                  <Badge variant="secondary" className="text-lg py-1">{analysisResult.confidence}%</Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Severity</h4>
                  <Badge variant={severityVariant} className="text-lg py-1">{analysisResult.severity}</Badge>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold mb-3 text-lg flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-red-500" /> Immediate Treatment Plan
                  </h3>
                  <ul className="space-y-3">
                    {analysisResult.treatment.map((step: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 text-lg flex items-center">
                    <Info className="h-5 w-5 mr-2 text-blue-500" /> Long-term Prevention
                  </h3>
                  <ul className="space-y-3">
                    {analysisResult.prevention.map((tip: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <p className="text-sm text-muted-foreground pt-4 border-t">
                Disclaimer: This is an AI-powered detection. Always consult a local agricultural expert for critical decisions.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
