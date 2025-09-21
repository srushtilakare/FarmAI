"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Camera, Upload, Mic, MicOff, AlertTriangle, CheckCircle, Info } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function DiseaseDetectionPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [textInput, setTextInput] = useState("")

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAnalyze = () => {
    setIsAnalyzing(true)
    // Simulate AI analysis
    setTimeout(() => {
      setAnalysisResult({
        disease: "Late Blight",
        confidence: 92,
        severity: "Moderate",
        affectedArea: "Leaves and stems",
        treatment: [
          "Apply copper-based fungicide immediately",
          "Remove affected leaves and dispose properly",
          "Improve air circulation around plants",
          "Reduce watering frequency",
        ],
        prevention: [
          "Use resistant varieties",
          "Maintain proper plant spacing",
          "Apply preventive fungicide sprays",
          "Monitor weather conditions",
        ],
      })
      setIsAnalyzing(false)
    }, 3000)
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
    // Simulate voice recording
    if (!isRecording) {
      setTimeout(() => {
        setIsRecording(false)
        setTextInput("My tomato plants have brown spots on the leaves and they are wilting")
      }, 3000)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Crop Disease Detection</h1>
          <p className="text-muted-foreground mt-2">
            Upload an image of your crop and get instant AI-powered disease identification with treatment
            recommendations
          </p>
        </div>

        {/* How it Works */}
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

        {/* Image Upload Section */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Upload Crop Image</CardTitle>
            <CardDescription>
              Take a clear photo of the affected crop area for accurate disease detection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              {selectedImage ? (
                <div className="space-y-4">
                  <img
                    src={selectedImage || "/placeholder.svg"}
                    alt="Uploaded crop"
                    className="max-w-full h-64 object-contain mx-auto rounded-lg"
                  />
                  <Button variant="outline" onClick={() => setSelectedImage(null)} className="border-border">
                    Remove Image
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div>
                    <p className="text-lg font-medium text-foreground">Upload an image</p>
                    <p className="text-sm text-muted-foreground">PNG, JPG up to 10MB</p>
                  </div>
                  <div className="flex gap-4 justify-center">
                    <Label htmlFor="image-upload">
                      <Button variant="outline" className="border-border cursor-pointer bg-transparent">
                        <Camera className="h-4 w-4 mr-2" />
                        Choose File
                      </Button>
                    </Label>
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>Provide more details about the symptoms for better analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="symptoms" className="text-foreground">
                Describe the symptoms
              </Label>
              <Textarea
                id="symptoms"
                placeholder="Describe what you observe: color changes, spots, wilting, etc."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="border-border focus:ring-primary min-h-[100px]"
              />
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={toggleRecording}
                className={`border-border ${isRecording ? "bg-red-50 border-red-300" : ""}`}
              >
                {isRecording ? (
                  <>
                    <MicOff className="h-4 w-4 mr-2 text-red-500" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Voice Input
                  </>
                )}
              </Button>
              {isRecording && <span className="text-sm text-red-500 animate-pulse">Recording...</span>}
            </div>
          </CardContent>
        </Card>

        {/* Analyze Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleAnalyze}
            disabled={!selectedImage || isAnalyzing}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 text-lg"
          >
            {isAnalyzing ? "Analyzing..." : "Analyze Crop"}
          </Button>
        </div>

        {/* Results */}
        {analysisResult && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Analysis Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-card-foreground mb-3">Disease Identified</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium text-foreground">{analysisResult.disease}</span>
                      <Badge variant="secondary">{analysisResult.confidence}% confidence</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Severity:</span>
                      <Badge variant={analysisResult.severity === "High" ? "destructive" : "default"}>
                        {analysisResult.severity}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Affected Area:</span>
                      <span className="text-foreground">{analysisResult.affectedArea}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-card-foreground mb-3">Immediate Treatment</h3>
                  <ul className="space-y-2">
                    {analysisResult.treatment.map((step: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-foreground">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-card-foreground mb-3">Prevention Tips</h3>
                <ul className="grid md:grid-cols-2 gap-2">
                  {analysisResult.prevention.map((tip: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-foreground">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
