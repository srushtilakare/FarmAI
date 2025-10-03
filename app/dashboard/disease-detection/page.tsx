"use client"

import type React from "react"
import { useState, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Camera, Upload, Mic, MicOff, AlertTriangle, CheckCircle, Info, Loader2 } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"

// Helper function to simulate a short network delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function DiseaseDetectionPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [fileObject, setFileObject] = useState<File | null>(null) // store the actual file
  const [isRecording, setIsRecording] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [textInput, setTextInput] = useState("")

  // Ref to the hidden file input element for direct manipulation
  const fileInputRef = useRef<HTMLInputElement>(null)

  // --- Handlers ---

  // Handle file upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setFileObject(file)
      // Clear any previous results
      setAnalysisResult(null) 
      const reader = new FileReader()
      reader.onload = (e) => setSelectedImage(e.target?.result as string)
      reader.readAsDataURL(file)
    }
    // Note: The input value is left as is so the user can select the *same* file again if they remove it.
  }

  const removeImage = () => {
    setSelectedImage(null)
    setFileObject(null)
    setAnalysisResult(null)
    // IMPORTANT: Clear the file input's value so that re-uploading the same file works
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const toggleRecording = () => {
    if (!isRecording) {
      // Start recording simulation
      setIsRecording(true)
      // Clear text input when starting a new recording
      setTextInput("")
      
      // Simulate recording for 3 seconds, then "transcribe"
      setTimeout(() => {
        setIsRecording(false)
        setTextInput("My tomato plants have brown spots on the leaves and they are wilting")
      }, 3000)
    } else {
      // Stop recording immediately if user clicks again
      setIsRecording(false)
    }
  }

  const handleAnalyze = async () => {
    if (!fileObject) {
      alert("Please upload an image first!")
      return
    }

    setIsAnalyzing(true)
    setAnalysisResult(null) // Clear previous results

    try {
      // --- Simulated API Response for Demo (if backend isn't running) ---
      // Comment out this block if you want to use the actual fetch below.
      await sleep(2000); // Simulate network latency
      const simulatedData = {
          disease: "Early Blight",
          confidence: 92.4,
          severity: "High",
      };

      const data = simulatedData;
      // --- End Simulated API Response ---

      // // --- Actual Backend Fetch (Uncomment to use) ---
      // const formData = new FormData()
      // formData.append("image", fileObject)

      // const res = await fetch("http://127.0.0.1:5000/predict/tomato", {
      //   method: "POST",
      //   body: formData,
      // })

      // const data = await res.json()
      // if (res.status !== 200) {
      //   throw new Error(data.error || `Server returned status ${res.status}`)
      // }
      // // --- End Actual Backend Fetch ---

      if (data.error) {
        alert(data.error)
        return
      }

      const isHealthy = data.disease.toLowerCase() === "healthy";
      const severity = data.severity || (isHealthy ? "None" : (data.confidence > 85 ? "High" : "Moderate"));

      setAnalysisResult({
        disease: data.disease,
        confidence: Math.round(data.confidence),
        severity: severity,
        affectedArea: isHealthy ? "None" : "Leaves, Stem",
        treatment: isHealthy
          ? ["No treatment needed, continue regular care."]
          : [
              "Apply recommended fungicide (e.g., Chlorothalonil or Mancozeb)",
              "Remove and destroy severely affected leaves to reduce spread",
              "Ensure good air circulation around plants",
              "Water at the base of the plant to keep leaves dry",
            ],
        prevention: isHealthy
          ? ["Maintain healthy plants", "Regular monitoring for early signs"]
          : [
              "Use disease-resistant tomato varieties",
              "Practice crop rotation (do not plant tomatoes in the same spot next year)",
              "Sanitize tools regularly",
              "Mulch to prevent soil splash onto leaves",
            ],
      })
    } catch (err) {
      console.error("Analysis Error:", err)
      alert("Failed to analyze the crop. Check console for details or ensure backend is running at http://127.0.0.1:5000")
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Determine the correct badge variant for severity
  const severityVariant = useMemo(() => {
    if (analysisResult?.severity === "High") return "destructive"
    if (analysisResult?.severity === "Moderate") return "warning" // Assuming you have a 'warning' variant
    if (analysisResult?.severity === "None" || analysisResult?.disease === "Healthy") return "success" // Assuming a 'success' variant
    return "default"
  }, [analysisResult])


  return (
    // Note: DashboardLayout is a component from your provided imports
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
              <div className="text-center">
                <div className="bg-primary/10 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <Camera className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium text-card-foreground">1. Capture Image</h3>
                <p className="text-sm text-muted-foreground">Take a clear photo of affected crop</p>
              </div>
              <div className="text-center">
                <div className="bg-primary/10 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <Mic className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium text-card-foreground">2. Add Details</h3>
                <p className="text-sm text-muted-foreground">Describe symptoms via text or voice</p>
              </div>
              <div className="text-center">
                <div className="bg-primary/10 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium text-card-foreground">3. AI Analysis</h3>
                <p className="text-sm text-muted-foreground">Our AI processes and identifies disease</p>
              </div>
              <div className="text-center">
                <div className="bg-primary/10 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium text-card-foreground">4. Get Results</h3>
                <p className="text-sm text-muted-foreground">Receive treatment and prevention tips</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Image Upload */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Upload Crop Image</CardTitle>
            <CardDescription>Take a clear photo of the affected crop area (e.g., a single leaf)</CardDescription>
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
                  <p className="text-lg font-medium text-foreground mt-2">Upload or capture an image</p>
                  <p className="text-sm text-muted-foreground">PNG, JPG up to 10MB</p>

                  {/* Hidden Input File Element */}
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    ref={fileInputRef} // Attach ref for clearing value
                  />
                  {/* Custom Button acting as trigger for the hidden input */}
                  <Label htmlFor="image-upload" className="cursor-pointer mt-4 inline-block">
                    <Button variant="outline" className="border-border bg-transparent">
                      <Camera className="h-4 w-4 mr-2" /> Choose File
                    </Button>
                  </Label>
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
              placeholder="Describe what you observe: color changes, spots, wilting, location on the plant, etc."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="border-border focus-visible:ring-primary min-h-[100px]"
            />

            <Button
              variant="outline"
              onClick={toggleRecording}
              disabled={isRecording} // Disable button while recording is simulated
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
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing...</>
            ) : "Analyze Crop"}
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
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground">Disease Identified</h4>
                  <span className="text-xl font-bold text-foreground">{analysisResult.disease}</span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground">Confidence</h4>
                  <Badge variant="secondary" className="text-lg py-1">{analysisResult.confidence}%</Badge>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground">Severity</h4>
                  <Badge variant={severityVariant} className="text-lg py-1">
                    {analysisResult.severity}
                  </Badge>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Immediate Treatment */}
                <div>
                  <h3 className="font-semibold text-card-foreground mb-3 text-lg flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-red-500" /> Immediate Treatment Plan
                  </h3>
                  <ul className="space-y-3">
                    {analysisResult.treatment.map((step: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                        <span className="text-base text-foreground">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Prevention Tips */}
                <div>
                  <h3 className="font-semibold text-card-foreground mb-3 text-lg flex items-center">
                    <Info className="h-5 w-5 mr-2 text-blue-500" /> Long-term Prevention
                  </h3>
                  <ul className="space-y-3">
                    {analysisResult.prevention.map((tip: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
                        <span className="text-base text-foreground">{tip}</span>
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